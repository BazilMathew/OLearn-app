import React, { useState, useEffect, useRef } from 'react';
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

// Longest we wait for the "Listening" clip to finish before opening the mic anyway.
const MAX_PROMPT_MS = 4000;

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
  const [notUnderstood, setNotUnderstood] = useState<boolean>(false);

  const t = I18N[language] || I18N.en;
  const sttRef = useRef<STTService | null>(null);
  if (!sttRef.current) sttRef.current = new STTService();
  const stt = sttRef.current;

  const startTokenRef = useRef(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListening = voiceState === 'starting' || voiceState === 'listening';

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
    cancelPendingStart();
    stt.cancel();
  }, [stt]);

  const clipPath = (clip: string) => `assets/audio/${language}/${clip}.mp3`;

  const showNotice = (err: STTError) => {
    setNotice(t[ERROR_TEXT[err]] as string);
    AudioService.playClip(clipPath(ERROR_CLIP[err]));
  };

  const handleToggleMic = () => {
    if (voiceState === 'transcribing') return;
    if (voiceState === 'starting') {
      cancelPendingStart();
      AudioService.stopAudio();
      setVoiceState('idle');
      return;
    }
    if (voiceState === 'listening') {
      // Whatever was heard arrives through onFinal and is routed there.
      stt.stopListening();
      return;
    }

    setClarifyData(null);
    setNotUnderstood(false);
    setTranscript('');
    setNotice(null);

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
      stt.startListening(language, {
        onInterim: (text) => setTranscript(text),
        onFinal: (text) => {
          setTranscript(text);
          processQuery(text);
        },
        onError: (err) => showNotice(err),
        onStateChange: (state) => setVoiceState(state)
      });
    };
    // Wait for the clip (at most MAX_PROMPT_MS); if there is no clip, openMic runs right away.
    startTimerRef.current = setTimeout(openMic, MAX_PROMPT_MS);
    AudioService.playClip(clipPath(LISTENING_CLIP), openMic, openMic);
  };

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsRouting(true);
    setClarifyData(null);
    setNotUnderstood(false);

    const result = await TaskRouterService.routeQuery(queryText, language);
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
      // Shown as text only: no clip exists for this message.
      setNotUnderstood(true);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      stopVoice();
      setNotice(null);
      processQuery(typedInput);
      setTypedInput('');
    }
  };

  // Mitra appears only while nothing else is happening on screen.
  const isIdle = voiceState === 'idle' && !isRouting && !clarifyData && !notUnderstood && !transcript && !notice;

  return (
    <div className="h-full w-full bg-canvas text-ink flex flex-col p-lg select-none relative">
      {/* Top Bar with Cancel / X */}
      <ScreenHeader
        title={<span className="text-accent-deep">{t.askMe}</span>}
        onBack={() => {
          stopVoice();
          onClose();
        }}
        backLabel={t.cancel}
        backIcon={X}
        aside={isIdle ? <Mascot size={72} /> : undefined}
      />

      {/* Main Interaction Zone */}
      <div className="flex-1 overflow-y-auto flex flex-col -mx-xs px-xs">
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
          {notUnderstood && (
            <Card className="w-full border-accent-deep text-left space-y-lg" shade="#8A5207">
              <div className="flex items-start gap-md" role="alert">
                <HelpCircle className="w-7 h-7 text-accent-deep flex-shrink-0 mt-xs" />
                <div className="text-body font-bold text-ink">
                  {t.didNotUnderstand}
                </div>
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
                    onClick={() => onSelectTask(task)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Typed Input Fallback */}
      <form onSubmit={handleTypedSubmit} className="pt-md space-y-md">
        <TextField
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
