import { Capacitor } from '@capacitor/core';
import type { SpeechRecognitionPlugin } from '@capacitor-community/speech-recognition';
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

// ---------- Android app: the phone's own speech service (Capacitor plugin) ----------
// The Android WebView has no working Web Speech recognition, and /api/stt is not reachable
// from the app, so the app uses Android's SpeechRecognizer instead. The web never loads this.
const IS_NATIVE = Capacitor.isNativePlatform();

// If Android has not answered this long after listening stopped, give up ("didn't hear you").
const NATIVE_GIVE_UP_MS = 8000;
// Many phones never answer the supported-languages question; then we just try.
const LANGUAGE_LIST_WAIT_MS = 1500;

let nativePlugin: Promise<SpeechRecognitionPlugin> | null = null;
let nativeAvailable: boolean | null = null; // null = not known yet
let nativeLanguages: Promise<string[] | null> | null = null;

const loadNativePlugin = () =>
  (nativePlugin ??= import('@capacitor-community/speech-recognition').then((m) => m.SpeechRecognition));

/** Started once, in the background, so getBlocker() can say "unavailable" before the Listening clip. */
function checkNativeSupport(): void {
  loadNativePlugin()
    .then(async (plugin) => {
      nativeAvailable = (await plugin.available()).available;
      nativeLanguages ??= Promise.race([
        plugin
          .getSupportedLanguages()
          .then((r) => (Array.isArray(r.languages) && r.languages.length ? r.languages.map(String) : null))
          .catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), LANGUAGE_LIST_WAIT_MS))
      ]);
    })
    .catch(() => {
      nativeAvailable = false;
    });
}

/** False only when the phone listed its languages and this one is missing; an unknown list means "try". */
async function nativeSupportsLanguage(code: string): Promise<boolean> {
  const list = nativeLanguages ? await nativeLanguages : null;
  if (!list) return true;
  const base = code.split('-')[0].toLowerCase();
  return list.some((l) => l.replace('_', '-').toLowerCase().split('-')[0] === base);
}

/** Plugin rejection messages (see the plugin's getErrorText) mapped to the same states as the web. */
function nativeError(err: unknown): STTError {
  const message = String((err as { message?: unknown })?.message ?? err).toLowerCase();
  if (message.includes('permission')) return 'not-allowed';
  if (message.includes('network')) return 'offline';
  if (message.includes('not available')) return 'unavailable';
  return 'no-speech';
}

export class STTService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private giveUpTimer: ReturnType<typeof setTimeout> | null = null;
  private listener: STTListener | null = null;
  private active = false;
  private nativeSession = 0;

  constructor() {
    if (IS_NATIVE) {
      if (nativeAvailable === null) checkNativeSupport();
      return;
    }
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
    if (IS_NATIVE) return nativeAvailable === false ? 'unavailable' : null;
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

    if (IS_NATIVE) {
      this.startNative(language);
    } else if (this.recognition) {
      this.startRecognition(language);
    } else {
      this.startRecording(language);
    }
  }

  /** Stops listening; whatever was heard is still delivered through onFinal. */
  public stopListening(): void {
    if (!this.active) return;
    if (IS_NATIVE) {
      this.stopNative();
    } else if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
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
    if (IS_NATIVE) {
      // A late result from this session is ignored (see startNative).
      this.nativeSession++;
      loadNativePlugin().then((plugin) => plugin.stop()).catch(() => {});
    }
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

  /** Android app: listen with the phone's speech service. Text arrives once, when listening ends. */
  private async startNative(language: SupportedLanguage): Promise<void> {
    const session = ++this.nativeSession;
    const isCurrent = () => this.active && this.nativeSession === session;
    const code = LANG_CODES[language];

    try {
      const plugin = await loadNativePlugin();
      if (!(await plugin.available()).available) {
        nativeAvailable = false;
        if (isCurrent()) this.finish('unavailable');
        return;
      }

      // Android shows its own permission dialog the first time (and after "Deny", but not after "Don't ask again").
      let permission = (await plugin.checkPermissions()).speechRecognition;
      if (permission !== 'granted') permission = (await plugin.requestPermissions()).speechRecognition;
      if (!isCurrent()) return;
      if (permission !== 'granted') {
        this.finish('not-allowed');
        return;
      }

      if (!(await nativeSupportsLanguage(code))) {
        if (isCurrent()) this.finish('unavailable');
        return;
      }
      if (!isCurrent()) return;

      // partialResults stays off: with it on, the plugin drops errors and never reports silence.
      const listening = plugin.start({ language: code, maxResults: 1, popup: false, partialResults: false });
      this.listener?.onStateChange('listening');
      this.stopTimer = setTimeout(() => this.stopListening(), MAX_RECORDING_MS);

      const result = await listening;
      if (!isCurrent()) return;
      const text = (result.matches?.[0] ?? '').trim();
      if (text) this.finish(null, text);
      else this.finish('no-speech');
    } catch (err) {
      if (isCurrent()) this.finish(nativeError(err));
    }
  }

  private stopNative(): void {
    this.clearStopTimer();
    // The plugin's stop() never resolves; Android then delivers the result to the pending start().
    loadNativePlugin().then((plugin) => plugin.stop()).catch(() => {});
    const session = this.nativeSession;
    this.giveUpTimer = setTimeout(() => {
      this.giveUpTimer = null;
      if (this.active && this.nativeSession === session) this.finish('no-speech');
    }, NATIVE_GIVE_UP_MS);
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
    if (this.giveUpTimer) clearTimeout(this.giveUpTimer);
    this.giveUpTimer = null;
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
