import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import type { SpeechRecognitionPlugin } from '@capacitor-community/speech-recognition';
import { SupportedLanguage } from '../types/task';
import { apiPost } from './apiClient';
import { VoiceHelper } from './VoiceHelper';

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
  /** Android app only: the session's report after every event (Voice check). Kept in memory only. */
  onReport?: (report: VoiceReport) => void;
}

/** Android app: what one voice session did, for the Voice check screen. Never stored or sent. */
export interface VoiceReport {
  language: string;
  /** A = in-app recognizer, B = Google voice box, C = none; "A→B" = A failed, B was used. Empty until the end. */
  route: string;
  /** Why this route was used, or why the session ended without words. */
  reason: string;
  /** 'ok' or an STTError; empty until the end. */
  outcome: string;
  heard: string;
  facts: Record<string, string>;
  events: string[];
}

// The server rejects audio over 1 MB; 15 s of speech is far below that.
const MAX_RECORDING_MS = 15000;

// Browser recognition errors that mean "try recording and sending to the server instead".
const FALLBACK_ERRORS = ['language-not-supported', 'service-not-allowed'];

const LANG_CODES: Record<SupportedLanguage, string> = { en: 'en-IN', hi: 'hi-IN', ml: 'ml-IN' };

// ---------- Android app: the phone's own speech service (Capacitor plugin) ----------
// The Android WebView has no working Web Speech recognition, and /api/stt is not reachable
// from the app, so the app uses Android's SpeechRecognizer instead. The web never loads this.
// Routes, tried in this order (see docs/android.md, "Voice check"):
//   A  the in-app recognizer (plugin, popup: false)
//   B  Android's voice box, usually Google's (plugin, popup: true = RecognizerIntent), after a hard failure of A
//      or from the "Try the Google voice box" button
//   C  nothing can listen: "unavailable", and Ask Me focuses the typing box
const IS_NATIVE = Capacitor.isNativePlatform();

// Route A: after "Listening" ends (15 s cap or a tap), how long Android may still take to deliver the words.
const NATIVE_GRACE_MS = 3000;
// Route A: a working recognizer reports speech or silence well before this. Counted from start().
const NATIVE_NO_RESPONSE_MS = 8000;
// Route B: the voice box has its own listening and silence timeouts; this only catches a lost answer.
const DIALOG_CAP_MS = 60000;
// Each question to Android before listening (not the permission dialog: that waits for the person).
const NATIVE_STEP_MS = 3000;
// Many phones never answer the supported-languages question; then we just try.
const LANGUAGE_LIST_WAIT_MS = 1500;
// After a hard failure of route A, start with the voice box for a week.
const VOICE_BOX_FIRST_KEY = 'olearn_voice_box_first';
const VOICE_BOX_FIRST_MS = 7 * 24 * 60 * 60 * 1000;

// Capacitor plugin proxies answer every property, "then" included, so a promise must never resolve to one:
// it would wait forever for a native "then" method. The plugin is therefore always wrapped in an object.
let nativePlugin: Promise<{ plugin: SpeechRecognitionPlugin }> | null = null;
let nativeAvailable: boolean | null = null; // null = not known yet
let nativeLanguages: Promise<string[] | null> | null = null;
let voiceBox: Promise<string> | null = null; // package that shows the voice box, '' = none
let voiceBoxAvailable: boolean | null = null;

const loadNativePlugin = () =>
  (nativePlugin ??= import('@capacitor-community/speech-recognition').then((m) => ({ plugin: m.SpeechRecognition })));

// Opening the voice box on a phone without one crashes the app, so the helper is asked first.
const checkVoiceBox = () =>
  (voiceBox ??= withTimeout(VoiceHelper.canShowVoiceDialog(), NATIVE_STEP_MS, 'canShowVoiceDialog()')
    .then((r) => (r.value ? r.handler || '?' : ''))
    .catch(() => '')
    .then((handler) => {
      voiceBoxAvailable = handler !== '';
      return handler;
    }));

/** Started once, in the background, so getBlocker() can say "unavailable" before the Listening clip. */
function checkNativeSupport(): void {
  loadNativePlugin()
    .then(async ({ plugin }) => {
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
  checkVoiceBox();
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what}: no answer in ${ms / 1000} s`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

/** False only when the phone listed its languages and this one is missing; an unknown list means "try". */
function languageListed(list: string[] | null, code: string): boolean {
  if (!list) return true;
  const base = code.split('-')[0].toLowerCase();
  return list.some((l) => l.replace('_', '-').toLowerCase().split('-')[0] === base);
}

function voiceBoxFirst(): boolean {
  try {
    const since = Number(localStorage.getItem(VOICE_BOX_FIRST_KEY));
    if (since && Date.now() - since < VOICE_BOX_FIRST_MS) return true;
    localStorage.removeItem(VOICE_BOX_FIRST_KEY);
  } catch {}
  return false;
}

function rememberVoiceBoxFirst(): void {
  try {
    localStorage.setItem(VOICE_BOX_FIRST_KEY, String(Date.now()));
  } catch {}
}

/**
 * How a route-A failure continues. final = show the error (permission, internet); soft = "didn't catch that"
 * and offer the voice box button (silence); hard = A cannot work here, go to the voice box at once.
 */
interface NativeFailure {
  error: STTError;
  kind: 'final' | 'soft' | 'hard';
  raw: string;
}

const errorText = (err: unknown) => String((err as { message?: unknown })?.message ?? err);

/** Plugin rejection messages (its getErrorText and NOT_AVAILABLE) mapped to the same states as the web. */
function classifyNative(raw: string): NativeFailure {
  const message = raw.toLowerCase();
  if (message.includes('permission')) return { error: 'not-allowed', kind: 'final', raw };
  if (message.includes('network')) return { error: 'offline', kind: 'final', raw };
  if (message.includes('no match') || message.includes('no speech')) return { error: 'no-speech', kind: 'soft', raw };
  if (message.includes('not available')) return { error: 'unavailable', kind: 'hard', raw };
  // Client side error, busy, server error and "Didn't understand" (the plugin's text for Android 12+ codes
  // 10-13, among them "language not supported").
  return { error: 'no-speech', kind: 'hard', raw };
}

const NO_RESPONSE = (ms: number): NativeFailure => ({
  error: 'no-speech',
  kind: 'hard',
  raw: `no response from the recognizer in ${ms / 1000} s`
});

export class STTService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private giveUpTimer: ReturnType<typeof setTimeout> | null = null;
  private listener: STTListener | null = null;
  private active = false;
  private nativeSession = 0;
  // Route A while it listens: stop = end listening and wait for the words; abort = drop the session.
  private nativeRoute: { stop: (why: string) => void; abort: () => void } | null = null;
  private report: VoiceReport | null = null;
  private reportStart = 0;

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

  /** Android app: the Google voice box can be offered after "didn't catch that". */
  public canOfferVoiceBox(): boolean {
    return IS_NATIVE && nativeAvailable === true && voiceBoxAvailable === true;
  }

  /** Android app: the last session's report (Voice check). */
  public getReport(): VoiceReport | null {
    return this.report && { ...this.report, facts: { ...this.report.facts }, events: [...this.report.events] };
  }

  /** Android app: forget "start with the voice box", so the next session tries route A first (Voice check). */
  public static forgetVoiceBoxFirst(): void {
    try {
      localStorage.removeItem(VOICE_BOX_FIRST_KEY);
    } catch {}
  }

  /** options.voiceBox (Android app): go straight to the Google voice box ("Try the Google voice box" button). */
  public startListening(language: SupportedLanguage, listener: STTListener, options: { voiceBox?: boolean } = {}): void {
    if (this.active) return;
    this.listener = listener;
    this.active = true;

    const blocker = this.getBlocker();
    if (blocker) {
      if (IS_NATIVE) {
        this.beginReport(LANG_CODES[language]);
        Object.assign(this.report!, { route: 'C', reason: `blocked before listening: ${blocker}`, outcome: blocker });
        this.note('end: ' + blocker);
      }
      this.finish(blocker);
      return;
    }

    if (IS_NATIVE) {
      this.startNative(language, options.voiceBox === true);
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
      this.nativeRoute?.abort();
      this.nativeRoute = null;
      loadNativePlugin().then(({ plugin }) => plugin.stop()).catch(() => {});
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

  /** Android app: route A, then B or C (see the top of the file). Text arrives once, when listening ends. */
  private async startNative(language: SupportedLanguage, voiceBoxOnly: boolean): Promise<void> {
    const session = ++this.nativeSession;
    const isCurrent = () => this.active && this.nativeSession === session;
    const code = LANG_CODES[language];
    this.beginReport(code);
    const end = (route: string, reason: string, error: STTError | null, text?: string) => {
      if (!isCurrent()) return;
      Object.assign(this.report!, { route, reason, outcome: text ? 'ok' : error ?? '', heard: text ?? '' });
      this.note(`end: ${text ? 'words' : error}`);
      this.finish(text ? null : error, text);
    };

    try {
      const { plugin } = await withTimeout(loadNativePlugin(), NATIVE_STEP_MS, 'plugin load');
      const available = (await withTimeout(plugin.available(), NATIVE_STEP_MS, 'available()')).available;
      nativeAvailable = available;
      this.fact('speech service (available)', available ? 'yes' : 'no');
      const handler = await checkVoiceBox();
      this.fact('voice box', handler ? `yes (${handler})` : 'no');
      if (!isCurrent()) return;
      // The plugin refuses both routes without a speech service, even the voice box.
      if (!available) return end('C', 'no speech recognition service on this phone', 'unavailable');

      // Android shows its own permission dialog the first time (and after "Deny", but not after "Don't ask again").
      let permission = (await withTimeout(plugin.checkPermissions(), NATIVE_STEP_MS, 'checkPermissions()'))
        .speechRecognition;
      if (permission !== 'granted') {
        this.note('asking for the microphone');
        permission = (await plugin.requestPermissions()).speechRecognition;
      }
      this.fact('microphone permission', permission);
      if (!isCurrent()) return;
      if (permission !== 'granted') return end('-', 'microphone permission not granted', 'not-allowed');

      const languages = nativeLanguages ? await nativeLanguages : null;
      const listed = languageListed(languages, code);
      this.fact('language list', languages ? `${languages.length} languages, ${code} ${listed ? 'listed' : 'missing'}` : 'no answer');
      if (!isCurrent()) return;
      if (!listed) return end('C', `${code} is not in the phone's language list`, 'unavailable');

      if (voiceBoxOnly || (handler && voiceBoxFirst())) {
        const why = voiceBoxOnly
          ? 'chosen with the "Try the Google voice box" button'
          : 'the in-app recognizer failed on this phone in the last 7 days';
        if (!handler) return end('C', `${why}; no voice box on this phone`, 'unavailable');
        return this.runVoiceBox(plugin, code, 'B', why, end);
      }

      const result = await this.runInApp(plugin, code, isCurrent);
      if (!isCurrent()) return;
      if ('text' in result) return end('A', 'in-app recognizer', null, result.text);
      if (result.kind !== 'hard') return end('A', result.raw, result.error);
      // The in-app recognizer cannot work on this phone (or not now): no words, so nothing is lost.
      if (!handler) return end('A→C', `${result.raw}; no voice box on this phone`, 'unavailable');
      rememberVoiceBoxFirst();
      return this.runVoiceBox(plugin, code, 'A→B', result.raw, end);
    } catch (err) {
      // A question to Android before listening failed or went unanswered: nothing can listen.
      const failure = classifyNative(errorText(err));
      end('C', failure.raw, failure.kind === 'final' ? failure.error : 'unavailable');
    }
  }

  /**
   * Route A: Android's recognizer inside the app. "Listening" ends at MAX_RECORDING_MS (or a tap); the words
   * then have NATIVE_GRACE_MS. No sign of life within NATIVE_NO_RESPONSE_MS of start() is a hard failure.
   */
  private runInApp(plugin: SpeechRecognitionPlugin, code: string, isCurrent: () => boolean): Promise<{ text: string } | NativeFailure> {
    return new Promise((resolve) => {
      let alive = false; // the recognizer reported the start or end of speech
      let settled = false;
      const handle: Promise<PluginListenerHandle> = plugin.addListener('listeningState', (data) => {
        if (settled) return;
        alive = true;
        this.note(`A: listeningState ${data.status}`);
      });
      const settle = (result: { text: string } | NativeFailure) => {
        if (settled) return;
        settled = true;
        this.clearStopTimer();
        this.nativeRoute = null;
        handle.then((h) => h.remove()).catch(() => {});
        resolve(result);
      };

      let stopped = false;
      const stop = (why: string) => {
        if (settled || stopped) return;
        stopped = true;
        this.clearStopTimer();
        this.note(`A: stop (${why})`);
        // The plugin's stop() never resolves; Android delivers the words to the pending start().
        plugin.stop().catch(() => {});
        if (isCurrent()) this.listener?.onStateChange('transcribing');
        this.giveUpTimer = setTimeout(
          () =>
            settle(
              alive
                ? { error: 'no-speech', kind: 'soft', raw: `no words ${NATIVE_GRACE_MS / 1000} s after stop` }
                : NO_RESPONSE(NATIVE_NO_RESPONSE_MS)
            ),
          NATIVE_GRACE_MS
        );
      };
      this.nativeRoute = { stop, abort: () => settle({ error: 'no-speech', kind: 'final', raw: 'cancelled' }) };

      // partialResults stays off: with it on, the plugin drops errors and never reports silence.
      plugin.start({ language: code, maxResults: 1, popup: false, partialResults: false }).then(
        (result) => {
          const text = (result.matches?.[0] ?? '').trim();
          if (!settled) this.note(`A: result (${text ? 'words' : 'empty'})`);
          settle(text ? { text } : { error: 'no-speech', kind: 'soft', raw: 'empty result' });
        },
        (err) => {
          const raw = errorText(err);
          if (!settled) this.note(`A: error "${raw}"`);
          settle(classifyNative(raw));
        }
      );
      this.note('A: start()');
      this.listener?.onStateChange('listening');
      this.stopTimer = setTimeout(() => stop(`${MAX_RECORDING_MS / 1000} s cap`), MAX_RECORDING_MS);
      this.giveUpTimer = setTimeout(() => {
        if (alive || stopped) return;
        this.note(`A: nothing from the recognizer in ${NATIVE_NO_RESPONSE_MS / 1000} s`);
        plugin.stop().catch(() => {});
        settle(NO_RESPONSE(NATIVE_NO_RESPONSE_MS));
      }, NATIVE_NO_RESPONSE_MS);
    });
  }

  /** Route B: Android's voice box. It listens and times out by itself; our stop() cannot close it. */
  private async runVoiceBox(
    plugin: SpeechRecognitionPlugin,
    code: string,
    route: string,
    reason: string,
    end: (route: string, reason: string, error: STTError | null, text?: string) => void
  ): Promise<void> {
    this.note(`${route}: voice box opened`);
    this.listener?.onStateChange('listening');
    this.giveUpTimer = setTimeout(
      () => end(route, `${reason}; no answer from the voice box in ${DIALOG_CAP_MS / 1000} s`, 'no-speech'),
      DIALOG_CAP_MS
    );
    try {
      const result = await plugin.start({ language: code, maxResults: 1, popup: true, partialResults: false });
      const text = (result.matches?.[0] ?? '').trim();
      this.note(`${route}: voice box result (${text ? 'words' : 'empty'})`);
      end(route, reason, text ? null : 'no-speech', text);
    } catch (err) {
      const raw = errorText(err);
      this.note(`${route}: voice box error "${raw}"`);
      // A number is the dialog's result code: 0 = closed, or nothing heard.
      const isCode = /^-?\d+$/.test(raw);
      const why = isCode ? `voice box result code ${raw}${raw === '0' ? ' (closed or nothing heard)' : ''}` : raw;
      end(route, `${reason}; ${why}`, isCode ? 'no-speech' : classifyNative(raw).error);
    }
  }

  private stopNative(): void {
    // Route A stops listening and waits briefly for the words; the voice box ends by itself.
    this.nativeRoute?.stop('tap');
  }

  private beginReport(language: string): void {
    this.reportStart = Date.now();
    this.report = { language, route: '', reason: '', outcome: '', heard: '', facts: {}, events: [] };
  }

  private fact(name: string, value: string): void {
    if (this.report) this.report.facts[name] = value;
  }

  private note(event: string): void {
    if (!this.report) return;
    this.report.events.push(`+${((Date.now() - this.reportStart) / 1000).toFixed(1)} s ${event}`);
    const report = this.getReport();
    if (report) this.listener?.onReport?.(report);
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
