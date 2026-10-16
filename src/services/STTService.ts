import { SupportedLanguage } from '../types/task';
import { apiPost } from './apiClient';

export type STTError =
  | 'no-speech'    // nothing usable was heard
  | 'not-allowed'  // microphone permission denied
  | 'insecure'     // page is not HTTPS, the browser blocks the mic
  | 'offline'      // no internet connection
  | 'unavailable'; // no browser recognition and the server could not transcribe (503, unreachable)

export type STTState = 'idle' | 'listening' | 'transcribing';

export interface STTListener {
  /** Live text while the user is speaking (browser recognition only). */
  onInterim: (text: string) => void;
  /** Called at most once per session, with non-empty text, when listening has finished. */
  onFinal: (text: string) => void;
  onError: (error: STTError) => void;
  onStateChange: (state: STTState) => void;
}

// The server rejects audio over 1 MB; 15 s of speech is far below that.
const MAX_RECORDING_MS = 15000;

// Browser recognition errors that mean "try recording and sending to the server instead".
const FALLBACK_ERRORS = ['language-not-supported', 'service-not-allowed'];

const LANG_CODES: Record<SupportedLanguage, string> = { en: 'en-IN', hi: 'hi-IN', ml: 'ml-IN' };

export class STTService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private listener: STTListener | null = null;
  private active = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  /** A reason voice cannot start right now, checked before saying "Listening". */
  public getBlocker(): STTError | null {
    if (!window.isSecureContext) return 'insecure';
    if (navigator.onLine === false) return 'offline';
    if (!this.recognition && !this.canRecord()) return 'unavailable';
    return null;
  }

  public isActive(): boolean {
    return this.active;
  }

  public startListening(language: SupportedLanguage, listener: STTListener): void {
    if (this.active) return;
    this.listener = listener;
    this.active = true;

    const blocker = this.getBlocker();
    if (blocker) {
      this.finish(blocker);
      return;
    }

    if (this.recognition) {
      this.startRecognition(language);
    } else {
      this.startRecording(language);
    }
  }

  /** Stops listening; whatever was heard is still delivered through onFinal. */
  public stopListening(): void {
    if (!this.active) return;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    } else if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  /** Abandons the session without calling the listener again (unmount, close, typed query). */
  public cancel(): void {
    this.listener = null;
    this.active = false;
    this.clearStopTimer();
    if (this.recognition) {
      this.recognition.onresult = this.recognition.onerror = this.recognition.onend = null;
      try { this.recognition.abort(); } catch (e) {}
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      if (this.mediaRecorder.state !== 'inactive') {
        try { this.mediaRecorder.stop(); } catch (e) {}
      }
      this.mediaRecorder = null;
    }
    this.releaseStream();
  }

  private startRecognition(language: SupportedLanguage): void {
    const rec = this.recognition;
    let finalText = '';
    let interimText = '';
    let error: STTError | null = null;
    let fallBack = false;

    rec.lang = LANG_CODES[language];

    rec.onresult = (event: any) => {
      finalText = '';
      interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interimText += event.results[i][0].transcript;
      }
      this.listener?.onInterim(finalText + interimText);
    };

    rec.onerror = (event: any) => {
      const code: string = event.error;
      if (FALLBACK_ERRORS.includes(code)) fallBack = true;
      else if (code === 'not-allowed') error = 'not-allowed';
      else if (code === 'network') error = 'offline';
      else if (code !== 'aborted') error = 'no-speech'; // no-speech, audio-capture and anything unknown
    };

    // onend always follows onerror, so this is the one place a recognition session finishes.
    rec.onend = () => {
      rec.onresult = rec.onerror = rec.onend = null;
      if (!this.active) return;
      if (fallBack && this.canRecord()) {
        this.startRecording(language);
        return;
      }
      if (fallBack) {
        this.finish('unavailable');
        return;
      }
      // After a manual stop Chrome sometimes ends before marking the last result final.
      const text = (finalText || interimText).trim();
      if (text) this.finish(null, text);
      else this.finish(error ?? 'no-speech');
    };

    try {
      rec.start();
      this.listener?.onStateChange('listening');
    } catch (err) {
      console.warn('Recognition start failed:', err);
      rec.onresult = rec.onerror = rec.onend = null;
      if (this.canRecord()) this.startRecording(language);
      else this.finish('no-speech');
    }
  }

  private canRecord(): boolean {
    // mediaDevices is undefined on insecure pages and some old browsers, despite the DOM types.
    return !!(navigator.mediaDevices as MediaDevices | undefined) && typeof window.MediaRecorder !== 'undefined';
  }

  /** Fallback: record with MediaRecorder and transcribe on the OLearn server (POST /api/stt). */
  private async startRecording(language: SupportedLanguage): Promise<void> {
    if (!this.canRecord()) {
      this.finish('unavailable');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      this.finish(denied ? 'not-allowed' : 'no-speech');
      return;
    }
    if (!this.active) {
      // Cancelled while the permission prompt was open.
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    this.stream = stream;

    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (err) {
      console.warn('MediaRecorder start failed:', err);
      this.finish('unavailable');
      return;
    }
    this.mediaRecorder = recorder;

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      this.clearStopTimer();
      this.releaseStream();
      this.mediaRecorder = null;
      if (!this.active) return;

      const type = recorder.mimeType || mimeType || 'audio/webm';
      const audio = new Blob(chunks, { type });
      if (audio.size === 0) {
        this.finish('no-speech');
        return;
      }

      this.listener?.onStateChange('transcribing');
      const text = await this.sendToWhisper(audio, type, language);
      if (!this.active) return;
      if (text === null) this.finish(navigator.onLine === false ? 'offline' : 'unavailable');
      else if (!text.trim()) this.finish('no-speech');
      else this.finish(null, text.trim());
    };

    recorder.start();
    this.listener?.onStateChange('listening');
    this.stopTimer = setTimeout(() => this.stopListening(), MAX_RECORDING_MS);
  }

  private finish(error: STTError | null, text?: string): void {
    const listener = this.listener;
    this.listener = null;
    this.active = false;
    this.clearStopTimer();
    this.releaseStream();
    if (!listener) return;
    listener.onStateChange('idle');
    if (text) listener.onFinal(text);
    else if (error) listener.onError(error);
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  private clearStopTimer(): void {
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
  }

  private async sendToWhisper(audio: Blob, mimeType: string, language: SupportedLanguage): Promise<string | null> {
    const extension = mimeType.startsWith('audio/mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('language', language);
    formData.append('audio', audio, `audio.${extension}`);

    // apiPost returns null on 503 (no OpenAI key), offline, timeout or an unreachable server.
    const data = await apiPost<{ text?: unknown }>('/api/stt', formData);
    if (!data || typeof data.text !== 'string') return null;
    return data.text;
  }
}
