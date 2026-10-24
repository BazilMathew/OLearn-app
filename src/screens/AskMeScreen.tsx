import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { I18N, TranslationDictionary } from '../config/i18n';
import { STTService, STTError, STTState } from '../services/STTService';
import { TaskRouterService, RouteResult } from '../services/TaskRouterService';
import { AudioService } from '../services/AudioService';
import { Mic, X, Send, HelpCircle, Loader2, ArrowRight, Keyboard } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { Mascot } from '../components/Mascot';

const ERROR_TEXT: Record<STTError, keyof TranslationDictionary> = {
  'no-speech': 'voiceNoSpeech',
  'not-allowed': 'voiceMicDenied',
  insecure: 'voiceInsecure',
  offline: 'voiceOffline',
  unavailable: 'voiceUnavailable'
};

// Status messages play only bundled clips from public/assets/audio/{lang}/, never TTS,
// so they use the same voice as the tutorials. A missing clip means the message is shown, not spoken.
const LISTENING_CLIP = 'askme_listening';
const ERROR_CLIP: Record<STTError, string> = {
  'no-speech': 'askme_no_speech',
  'not-allowed': 'askme_mic_denied',
  insecure: 'askme_insecure',
  offline: 'askme_offline',
  unavailable: 'askme_unavailable'
};

// Spoken once per request when the router finds no task; says the same sentence as the screen.
const NOT_UNDERSTOOD_CLIP = 'askme_not_understood';

// Longest we wait for the "Listening" clip to finish before opening the mic anyway.
const MAX_PROMPT_MS = 4000;
// How long after "not understood" a closing keyboard may still grow the screen.
const KEYBOARD_SETTLE_MS = 1000;

const IS_NATIVE = Capacitor.isNativePlatform();
const TYPED_INPUT_ID = 'askme-typed-input';
const NOT_UNDERSTOOD_ID = 'askme-not-understood';

const motionReduced = () =>
  document.documentElement.classList.contains('reduce-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface AskMeScreenProps {
  language: SupportedLanguage;
  tasks: TaskConfig[];
  onSelectTask: (task: TaskConfig) => void;
  onClose: () => void;
}

export const AskMeScreen: React.FC<AskMeScreenProps> = ({
  language,
  tasks,
  onSelectTask,
  onClose
}) => {
  // 'starting' = playing the "Listening" clip before the mic opens, so it is not transcribed.
  const [voiceState, setVoiceState] = useState<STTState | 'starting'>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [clarifyData, setClarifyData] = useState<RouteResult['clarifyQuestion'] | null>(null);
  // The request the router did not understand (null = none); a new request makes a new id.
  const [notUnderstood, setNotUnderstood] = useState<number | null>(null);
  // Read by screen readers: the same sentence as the spoken clip.
  const [liveMessage, setLiveMessage] = useState<string>('');
  // Android app: "Try the Google voice box" after "didn't catch that"
  const [offerVoiceBox, setOfferVoiceBox] = useState<boolean>(false);

  const t = I18N[language] || I18N.en;
  const sttRef = useRef<STTService | null>(null);
  if (!sttRef.current) sttRef.current = new STTService();
  const stt = sttRef.current;

  const startTokenRef = useRef(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListening = voiceState === 'starting' || voiceState === 'listening';

  // A routing result is used only if no newer request (or closing the screen) came after it.
  const requestRef = useRef(0);
  const spokenRef = useRef(0);
  const notUnderstoodPlayingRef = useRef(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const listCardRef = useRef<HTMLDivElement>(null);

  const stopNotUnderstoodClip = () => {
    if (!notUnderstoodPlayingRef.current) return;
    notUnderstoodPlayingRef.current = false;
    AudioService.stopAudio();
  };

  const cancelPendingStart = () => {
    startTokenRef.current++;
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
  };

  const stopVoice = () => {
    cancelPendingStart();
    stt.cancel();
    setVoiceState('idle');
  };

  useEffect(() => () => {
    requestRef.current++;
    stopNotUnderstoodClip();
    cancelPendingStart();
    stt.cancel();
  }, [stt]);

  const clipPath = (clip: string) => `assets/audio/${language}/${clip}.mp3`;

  // Brings the message and task list into view unless they already are. Below 130% text the middle zone
  // scrolls; from 130% the whole screen does.
  const revealList = () => {
    const card = listCardRef.current;
    const box = [zoneRef.current, screenRef.current].find(
      (el) => el && getComputedStyle(el).overflowY !== 'visible' && el.scrollHeight > el.clientHeight
    );
    if (!card || !box) return;
    const view = box.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    if (rect.top >= view.top && rect.bottom <= view.bottom) return;
    box.scrollTo({ top: box.scrollTop + rect.top - view.top, behavior: motionReduced() ? 'auto' : 'smooth' });
  };

  // "Not understood": speak the message and scroll to the list at the same moment, once per request.
  useEffect(() => {
    if (notUnderstood === null || spokenRef.current === notUnderstood) return;
    spokenRef.current = notUnderstood;
    // Never over an open mic.
    stopVoice();
    setLiveMessage(t.didNotUnderstand);
    notUnderstoodPlayingRef.current = true;
    const done = () => { notUnderstoodPlayingRef.current = false; };
    AudioService.playClip(clipPath(NOT_UNDERSTOOD_CLIP), done, done);
    revealList();
    // A typed request closes the keyboard; check again as the screen grows back.
    window.addEventListener('resize', revealList);
    const timer = setTimeout(() => window.removeEventListener('resize', revealList), KEYBOARD_SETTLE_MS);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', revealList);
    };
  }, [notUnderstood]);

  const showNotice = (err: STTError) => {
    setNotice(t[ERROR_TEXT[err]] as string);
    AudioService.playClip(clipPath(ERROR_CLIP[err]));
    setOfferVoiceBox(err === 'no-speech' && stt.canOfferVoiceBox());
    // Android app: nothing on this phone can listen, so typing is the way on.
    if (IS_NATIVE && err === 'unavailable') document.getElementById(TYPED_INPUT_ID)?.focus();
  };

  const voiceListener = () => ({
    onInterim: (text: string) => setTranscript(text),
    onFinal: (text: string) => {
      setTranscript(text);
      processQuery(text);
    },
    onError: (err: STTError) => showNotice(err),
    onStateChange: (state: STTState) => setVoiceState(state)
  });

  const handleToggleMic = () => {
    if (voiceState === 'transcribing') return;
    if (voiceState === 'starting') {
      cancelPendingStart();
      AudioService.stopAudio();
      // The mic may already be opening (Android asks the phone first): drop that session too.
      stt.cancel();
      setVoiceState('idle');
      return;
    }
    if (voiceState === 'listening') {
      // Whatever was heard arrives through onFinal and is routed there.
      stt.stopListening();
      return;
    }

    requestRef.current++;
    stopNotUnderstoodClip();
    setIsRouting(false);
    setClarifyData(null);
    setNotUnderstood(null);
    setLiveMessage('');
    setTranscript('');
    setNotice(null);
    setOfferVoiceBox(false);

    const blocker = stt.getBlocker();
    if (blocker) {
      showNotice(blocker);
      return;
    }

    setVoiceState('starting');
    const token = ++startTokenRef.current;
    const openMic = () => {
      if (startTokenRef.current !== token) return;
      cancelPendingStart();
      AudioService.stopAudio();
      stt.startListening(language, voiceListener());
    };
    // Wait for the clip (at most MAX_PROMPT_MS); if there is no clip, openMic runs right away.
    startTimerRef.current = setTimeout(openMic, MAX_PROMPT_MS);
    AudioService.playClip(clipPath(LISTENING_CLIP), openMic, openMic);
  };

  // Android app: the phone's own voice box; it shows and speaks its own prompt, so no Listening clip.
  const handleTryVoiceBox = () => {
    setOfferVoiceBox(false);
    setNotice(null);
    setTranscript('');
    setVoiceState('starting');
    stt.startListening(language, voiceListener(), { voiceBox: true });
  };

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    const request = ++requestRef.current;
    stopNotUnderstoodClip();
    setIsRouting(true);
    setClarifyData(null);
    setNotUnderstood(null);
    setLiveMessage('');

    const result = await TaskRouterService.routeQuery(queryText, language);
    if (requestRef.current !== request) return;
    setIsRouting(false);

    if (result.matched && result.taskId) {
      const found = tasks.find(t => t.task_id === result.taskId);
      if (found) {
        onSelectTask(found);
        return;
      }
    }

    if (result.clarifyQuestion) {
      setClarifyData(result.clarifyQuestion);
    } else if (result.notUnderstood) {
      // Typed request: close the keyboard so the task list has room.
      const input = document.getElementById(TYPED_INPUT_ID);
      if (input && document.activeElement === input) input.blur();
      setNotUnderstood(request);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      stopVoice();
      setNotice(null);
      setOfferVoiceBox(false);
      processQuery(typedInput);
      setTypedInput('');
    }
  };

  // Mitra appears only while nothing else is happening on screen.
  const isIdle = voiceState === 'idle' && !isRouting && !clarifyData && notUnderstood === null && !transcript && !notice;

  return (
    <div ref={screenRef} className="h-full w-full bg-canvas text-ink flex flex-col p-lg select-none relative [.text-large_&]:overflow-y-auto">
      <div className="sr-only" aria-live="polite">{liveMessage}</div>

      {/* Top Bar with Cancel / X */}
      <ScreenHeader
        title={<span className="text-accent-deep">{t.askMe}</span>}
        onBack={() => {
          requestRef.current++;
          stopNotUnderstoodClip();
          stopVoice();
          onClose();
        }}
        backLabel={t.cancel}
        backIcon={X}
        aside={isIdle ? <Mascot size={72} /> : undefined}
      />

      {/* Main Interaction Zone (at large text sizes the whole screen scrolls instead) */}
      <div ref={zoneRef} className="flex-1 overflow-y-auto flex flex-col -mx-xs px-xs [.text-large_&]:flex-[1_0_auto] [.text-large_&]:overflow-visible">
        <div className="my-auto flex flex-col items-center space-y-xl text-center py-sm">
          <p className="text-body font-bold text-ink max-w-sm">
            {t.askMeSubtitle}
          </p>

          {/* Large Centered Mic Button: breathes when idle, calm rings while listening (No confusing waveforms) */}
          <div className="relative flex items-center justify-center py-lg">
            {isListening && (
              <>
                <div className="mic-ring absolute w-32 h-32 rounded-full border-4 border-danger opacity-40 pointer-events-none" />
                <div className="mic-ring mic-ring-delay absolute w-32 h-32 rounded-full border-4 border-danger opacity-40 pointer-events-none" />
              </>
            )}
            <div className={isListening ? undefined : 'mic-breathe'}>
              <button
                onClick={handleToggleMic}
                aria-label={isListening ? t.listening : t.tapAndSpeak}
                style={{ ['--shade' as string]: isListening ? '#7A151B' : '#8A5207' }}
                className={`pressable w-32 h-32 rounded-full flex items-center justify-center border-4 ${
                  isListening
                    ? 'bg-danger border-[#7A151B] text-white active:bg-[#951D25]'
                    : 'bg-accent border-accent-deep text-ink active:bg-[#E59A2A]'
                }`}
              >
                <Mic className="w-16 h-16" strokeWidth={2.25} />
              </button>
            </div>
          </div>

          {/* Persistent Large Text Label Beneath Mic Button AT ALL TIMES */}
          <div className="space-y-md w-full">
            <div className="text-title text-ink flex items-center justify-center gap-sm" role="status" aria-live="polite">
              {voiceState === 'transcribing' && <Loader2 className="w-7 h-7 spin-slow" />}
              <span>
                {voiceState === 'transcribing' ? t.voiceWorking : isListening ? t.listening : t.tapAndSpeak}
              </span>
            </div>
            {notice && !isListening && voiceState !== 'transcribing' && (
              <Card className="border-accent-deep text-body font-bold text-ink max-w-sm mx-auto" shade="#8A5207">
                <div role="alert">{notice}</div>
              </Card>
            )}
            {offerVoiceBox && notice && !isListening && voiceState !== 'transcribing' && (
              <div className="max-w-sm mx-auto">
                <Button icon={Mic} label={t.voiceTryVoiceBox} variant="primary" fullWidth onClick={handleTryVoiceBox} />
              </div>
            )}
            {transcript && (
              <Card className="text-body font-semibold text-success max-w-xs mx-auto">
                "{transcript}"
              </Card>
            )}
          </div>

          {isRouting && (
            <div className="flex items-center gap-sm text-accent-deep text-body font-bold">
              <Loader2 className="w-6 h-6 spin-slow" />
              <span>Finding matching tutorial...</span>
            </div>
          )}

          {/* Clarifying Question Modal if ambiguous */}
          {clarifyData && (
            <Card className="w-full border-accent-deep text-left space-y-lg" shade="#8A5207">
              <div className="flex items-start gap-md">
                <HelpCircle className="w-7 h-7 text-accent-deep flex-shrink-0 mt-xs" />
                <div className="text-body font-bold text-ink">
                  {clarifyData.text}
                </div>
              </div>

              <div className="space-y-md">
                {clarifyData.options.map((opt) => (
                  <Button
                    key={opt.taskId}
                    icon={ArrowRight}
                    iconEnd
                    label={opt.label}
                    variant="primary"
                    fullWidth
                    className="justify-between"
                    onClick={() => {
                      const found = tasks.find(t => t.task_id === opt.taskId);
                      if (found) onSelectTask(found);
                    }}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Nothing matched: say so and let the user pick a task */}
          {notUnderstood !== null && (
            <div ref={listCardRef} id={NOT_UNDERSTOOD_ID} className="w-full">
              <Card className="w-full border-accent-deep text-left space-y-lg" shade="#8A5207">
                {/* Full width (no icon) so the Malayalam fits two lines at 360px; read out by the live region above */}
                <div className="text-body font-bold text-ink">
                  {t.didNotUnderstand}
                </div>

                <div className="space-y-md max-h-[40vh] overflow-y-auto px-xs pb-xs">
                  {tasks.map((task) => (
                    <Button
                      key={task.task_id}
                      icon={ArrowRight}
                      iconEnd
                      label={task.title[language]}
                      variant="primary"
                      fullWidth
                      className="justify-between"
                      onClick={() => {
                        stopNotUnderstoodClip();
                        onSelectTask(task);
                      }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Typed Input Fallback */}
      <form onSubmit={handleTypedSubmit} className="pt-md space-y-md">
        <TextField
          id={TYPED_INPUT_ID}
          icon={Keyboard}
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          label={t.typePlaceholder}
        />
        <Button type="submit" icon={Send} label={t.send} variant="primary" fullWidth />
      </form>
    </div>
  );
};
