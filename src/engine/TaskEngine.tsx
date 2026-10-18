import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { TaskConfig, SupportedLanguage } from '../types/task';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';
import { I18N } from '../config/i18n';
import { WhatsAppReplica } from '../replicas/WhatsAppReplica';
import { GPayReplica } from '../replicas/GPayReplica';
import { Button } from '../components/Button';
import { MitraSvg } from '../components/Mascot';
import { Volume2, RotateCcw, X, List, Lightbulb, Sparkles, ArrowUp, Hand, Eye } from 'lucide-react';

interface TaskEngineProps {
  task: TaskConfig;
  language: SupportedLanguage;
  /** Practice screens in English ('en', default) or in the learner's language ('follow'). */
  replicaLanguage?: 'en' | 'follow';
  onExit: () => void;
}

// 16 sparkles around Mitra: [x offset px, y offset px, size px, colour]
const SPARKLES: [number, number, number, string][] = [
  [-120, -70, 14, '#F2A93B'], [120, -64, 12, '#276B43'], [-104, 34, 12, '#1A73E8'], [108, 40, 14, '#F2A93B'],
  [-40, -110, 10, '#128C7E'], [44, -112, 12, '#F08A6C'], [-140, -10, 10, '#276B43'], [146, -6, 10, '#1A73E8'],
  [-72, 58, 10, '#F08A6C'], [76, 60, 12, '#128C7E'], [0, -128, 12, '#F2A93B'], [-150, 48, 10, '#F2A93B'],
  [150, 52, 10, '#276B43'], [-84, -104, 10, '#1A73E8'], [90, -100, 10, '#F2A93B'], [-132, -46, 10, '#F08A6C']
];

const motionReduced = () =>
  document.documentElement.classList.contains('reduce-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Swipe hint: the hand slides up twice, then rests (transform/opacity only, never loops)
// After the final tap a step's result screen (e.g. the sent message) stays this long before "Well done"
const RESULT_MS = 2000;

const SWIPE: Keyframe[] = [
  { transform: 'translateY(20px)', opacity: 0.4 },
  { transform: 'translateY(0)', opacity: 1 }
];

export const TaskEngine: React.FC<TaskEngineProps> = ({
  task,
  language,
  replicaLanguage = 'en',
  onExit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [nudgeKey, setNudgeKey] = useState<number>(0);
  const [showMeVisible, setShowMeVisible] = useState<boolean>(false);
  // The final tap is done and the step's result screen is showing
  const [showingResult, setShowingResult] = useState<boolean>(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // The hint is taller than its bar (largest text size only): it scrolls, with a visible cue
  const [hintScrolls, setHintScrolls] = useState<boolean>(false);
  const [hintMore, setHintMore] = useState<boolean>(false);
  // Thumb of the hint's own scrollbar, as fractions of the visible height
  const [hintThumb, setHintThumb] = useState<{ top: number; size: number }>({ top: 0, size: 1 });
  const hintRef = useRef<HTMLDivElement>(null);
  const replicaRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const scrollDoneRef = useRef<boolean>(false);
  const showMeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentStep = task.steps[currentStepIndex];
  const totalSteps = task.steps.length;
  // Steps without a recorded clip yet are caption-only: no narration, no speech synthesis
  const clipPath = currentStep
    ? ((currentStep[`audio_${language}`] as string) || currentStep.audio_en)
    : '';
  const isScrollStep = currentStep?.action === 'scroll';
  const t = I18N[language] || I18N.en;
  // The mock app screens have their own language; the tutorial chrome and voice always use `language`
  const screenLanguage: SupportedLanguage = replicaLanguage === 'follow' ? language : 'en';

  // Play audio narration when step changes
  useEffect(() => {
    if (isCompleted) {
      AudioService.playCelebrationSound();
      StorageService.markTaskCompleted(task.task_id);
      return;
    }

    if (currentStep && clipPath) {
      const hintText = currentStep.hint_text[language] || currentStep.hint_text.en;

      setIsAudioPlaying(true);
      AudioService.playNarration(clipPath, language, hintText, () => {
        setIsAudioPlaying(false);
      });
    } else {
      setIsAudioPlaying(false);
    }

    return () => {
      AudioService.stopAudio();
    };
  }, [currentStepIndex, isCompleted, language, task]);

  const measureHint = () => {
    const el = hintRef.current;
    if (!el) return;
    setHintScrolls(el.scrollHeight > el.clientHeight + 1);
    setHintMore(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    setHintThumb({ top: el.scrollTop / el.scrollHeight, size: el.clientHeight / el.scrollHeight });
  };

  // Each new step's hint starts at its first line
  useLayoutEffect(() => {
    if (hintRef.current) hintRef.current.scrollTop = 0;
    measureHint();
    window.addEventListener('resize', measureHint);
    return () => window.removeEventListener('resize', measureHint);
  }, [currentStepIndex, isCompleted, language]);

  // Scroll step: the learner scrolls the list themselves. The step completes once scrolling settles
  // with the target fully visible above the floating button. "Show me" appears after 10s without scrolling.
  useEffect(() => {
    setShowMeVisible(false);
    scrollDoneRef.current = false;
    if (!isScrollStep || isCompleted) return;
    const list = replicaRef.current?.querySelector<HTMLElement>('[data-scroll-area]');
    if (!list) return;

    if (!motionReduced()) {
      handRef.current?.animate?.(SWIPE, { duration: 400, iterations: 2, easing: 'ease-in-out', delay: 300 });
    }

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const waitForIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setShowMeVisible(true), 10000);
    };
    const onScroll = () => {
      waitForIdle();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (scrollTargetVisible()) completeScrollStep();
      }, 150);
    };

    list.addEventListener('scroll', onScroll, { passive: true });
    waitForIdle();
    return () => {
      list.removeEventListener('scroll', onScroll);
      clearTimeout(settleTimer);
      clearTimeout(idleTimer);
      clearTimeout(showMeTimerRef.current);
    };
  }, [currentStepIndex, isCompleted, task]);

  // The scroll list, its target row and the visible area: above the floating button and the hint
  const scrollParts = () => {
    const list = replicaRef.current?.querySelector<HTMLElement>('[data-scroll-area]');
    const row = list?.querySelector<HTMLElement>(`[data-element-id="${currentStep.highlight_element}"]`);
    if (!list || !row) return null;
    const lr = list.getBoundingClientRect();
    let bottom = lr.bottom;
    list.parentElement?.querySelectorAll('[data-scroll-cover]').forEach((c) => {
      bottom = Math.min(bottom, c.getBoundingClientRect().top);
    });
    return { list, rr: row.getBoundingClientRect(), top: lr.top, bottom };
  };

  // Fully visible with room for the highlight ring (12px)
  const scrollTargetVisible = () => {
    const p = scrollParts();
    return !!p && p.rr.top >= p.top + 12 && p.rr.bottom <= p.bottom - 12;
  };

  const completeScrollStep = () => {
    if (scrollDoneRef.current) return;
    scrollDoneRef.current = true;
    handleCorrectTap();
  };

  // "Show me": scrolls the list for the learner so the target sits in the middle of the visible area
  const handleShowMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    const p = scrollParts();
    if (!p) return;
    const instant = motionReduced();
    const delta = p.rr.top - p.top - (p.bottom - p.top - p.rr.height) / 2;
    p.list.scrollBy({ top: delta, behavior: instant ? 'auto' : 'smooth' });
    // Backstop for when the list cannot move any further (no scroll event follows)
    clearTimeout(showMeTimerRef.current);
    showMeTimerRef.current = setTimeout(() => {
      if (scrollTargetVisible()) completeScrollStep();
    }, instant ? 200 : 900);
  };

  // Handle correct tap on the highlighted element
  const handleCorrectTap = () => {
    if (showingResult) return;
    AudioService.playCorrectSound();
    setShowNudge(false);

    if (currentStepIndex + 1 < totalSteps) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentStep.result_screen) {
      setShowingResult(true);
      resultTimerRef.current = setTimeout(() => {
        setShowingResult(false);
        setIsCompleted(true);
      }, RESULT_MS);
    } else {
      setIsCompleted(true);
    }
  };

  useEffect(() => () => clearTimeout(resultTimerRef.current), []);

  // Handle tap on any inert / wrong element (ignored while the result screen shows)
  const handleWrongTap = () => {
    if (showingResult) return;
    AudioService.playNudgeSound();
    setShowNudge(true);
    setNudgeKey(k => k + 1);
    setTimeout(() => {
      setShowNudge(false);
    }, 3000);
  };

  const handleReplayAudio = () => {
    if (currentStep && clipPath) {
      const hintText = currentStep.hint_text[language] || currentStep.hint_text.en;

      setIsAudioPlaying(true);
      AudioService.playNarration(clipPath, language, hintText, () => {
        setIsAudioPlaying(false);
      });
    }
  };

  const handlePracticeAgain = () => {
    clearTimeout(resultTimerRef.current);
    setShowingResult(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setShowNudge(false);
  };

  if (isCompleted) {
    return (
      <div className="h-full w-full bg-canvas flex flex-col justify-between p-lg select-none screen-enter overflow-y-auto [.text-large_&]:px-md">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-xl py-lg">
          {/* Mitra with a one-time sparkle burst (static sparkles under Reduce motion) */}
          <div className="relative w-[136px] h-[136px] mt-2xl" aria-hidden="true">
            {SPARKLES.map(([dx, dy, size, color], i) => (
              <span
                key={i}
                className="sparkle"
                style={{
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  background: color,
                  animationDelay: `${(i % 4) * 60}ms`,
                  ['--dx' as string]: `${dx}px`,
                  ['--dy' as string]: `${dy}px`
                }}
              />
            ))}
            <div className="mitra-still relative w-full h-full">
              <MitraSvg />
            </div>
          </div>

          <div className="space-y-sm">
            <h2 className="text-display text-ink">
              {t.taskCompleted}
            </h2>
            <p className="text-body text-ink-muted max-w-sm mx-auto">
              {t.taskCompletedSubtitle}
            </p>
          </div>

          <div className="bg-success-soft border-2 border-success rounded-card p-lg w-full text-left flex items-start gap-md [.text-large_&]:flex-wrap [.text-large_&]:p-md">
            <Sparkles className="w-7 h-7 text-success flex-shrink-0 mt-xs" aria-hidden="true" />
            <div className="min-w-0 [.text-large_&]:basis-full">
              <div className="text-body font-bold text-ink">
                {task.title[language] || task.title.en}
              </div>
              <div className="text-label text-success">
                {task.app === 'whatsapp' ? t.whatsAppTitle : t.gpayTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Min 64dp height for elderly touch targets */}
        <div className="space-y-md pt-lg">
          <Button icon={RotateCcw} label={t.practiceAgain} variant="primary" fullWidth onClick={handlePracticeAgain} />
          <Button icon={List} label={t.backToMenu} variant="dark" fullWidth onClick={onExit} />
        </div>
      </div>
    );
  }

  const stepLabel = t.stepXofY.replace('{n}', String(currentStepIndex + 1)).replace('{total}', String(totalSteps));
  const hint = currentStep.hint_text[language] || currentStep.hint_text.en;
  // The result screen has nothing to tap, so nothing is highlighted
  const replicaScreen = showingResult && currentStep.result_screen ? currentStep.result_screen : currentStep.screen;
  const replicaHighlight = showingResult ? '' : currentStep.highlight_element;

  // Drawn over the bottom of the chat list, beside the floating button, so the chats stay clear.
  // Taps pass through the swipe hint; after 10s without scrolling "Show me" takes its place.
  const scrollHint = (
    <div data-scroll-cover className="absolute left-lg right-[96px] bottom-lg">
      {showMeVisible ? (
        <div className="pointer-events-auto screen-enter">
          <Button icon={Eye} label={t.showMe} variant="primary" fullWidth onClick={handleShowMe} className="!px-md" />
        </div>
      ) : (
        <div className="min-h-[64px] bg-surface border-2 border-accent-deep rounded-btn px-md py-xs flex items-center gap-sm">
          <div ref={handRef} className="flex flex-col items-center text-accent-deep flex-shrink-0" aria-hidden="true">
            <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
            <Hand className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="text-label font-bold text-ink min-w-0">{t.swipeUp}</span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="h-full w-full flex flex-col justify-between bg-canvas relative overflow-hidden select-none"
      onClick={handleWrongTap}
    >
      {/* Tutorial chrome: exit + repeat. The gentle nudge overlays this bar so the screen never shifts.
          Stays at 100% text (ts-fixed): in Malayalam these labels already fill the bar. */}
      <div className="ts-fixed relative bg-surface border-b-2 border-line px-sm py-sm z-30 [.text-large_&]:py-xs">
        <div className="grid grid-cols-2 gap-xs">
          <Button
            icon={X}
            label={t.exitTutorial}
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="!px-sm !py-sm !text-label !gap-xs min-w-0 break-words [&>svg]:!w-6 [&>svg]:!h-6"
          />
          {/* Greyed out (but kept in place) on steps that have no recorded clip yet */}
          <Button
            icon={Volume2}
            label={t.replayAudio}
            variant={isAudioPlaying ? 'primary' : 'secondary'}
            aria-disabled={!clipPath}
            onClick={(e) => {
              e.stopPropagation();
              handleReplayAudio();
            }}
            className={`!px-sm !py-sm !text-label !gap-xs min-w-0 break-words [&>svg]:!w-6 [&>svg]:!h-6 ${clipPath ? '' : 'opacity-50 cursor-default'}`}
          />
        </div>

        {/* Gentle Nudge (never a penalty or dead-end); taps pass through to the buttons underneath */}
        {showNudge && (
          <div className="screen-enter absolute top-0 left-0 right-0 min-h-full z-50 pointer-events-none bg-surface border-b-4 border-accent px-lg py-sm flex items-center gap-md" role="status">
            <Lightbulb className="w-8 h-8 text-accent-deep flex-shrink-0" aria-hidden="true" />
            <div className="text-label font-bold text-ink leading-snug">
              {isScrollStep ? t.scrollNudge : t.gentleNudge}
            </div>
          </div>
        )}
      </div>

      {/* Screen Replica Container: imitates the real apps, so it keeps 100% text at every Text size (ts-fixed).
          It always keeps 40% of the height and at least 284px (the 256px QR viewfinder with room for its
          ring), or 336px on a scroll step (chat list header, a full chat row and the swipe hint); the
          instruction below takes the rest. Only on the chat search (the one screen with a text field) that floor
          is dropped under 480px tall, i.e. while the phone keyboard is open, so the instruction stays in view. */}
      <div
        ref={replicaRef}
        className={`ts-fixed flex-1 ${isScrollStep ? 'min-h-[max(40%,336px)]' : 'min-h-[max(40%,284px)]'} ${
          currentStep.screen === 'whatsapp_search_screen' ? '[@media(max-height:480px)]:min-h-0' : ''
        } relative overflow-y-auto overflow-x-hidden bg-canvas flex flex-col`}
      >
        {task.app === 'whatsapp' ? (
          <WhatsAppReplica
            screen={replicaScreen}
            highlightElement={replicaHighlight}
            language={screenLanguage}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
            nudgeKey={nudgeKey}
            scrollHint={isScrollStep ? scrollHint : undefined}
          />
        ) : (
          <GPayReplica
            screen={replicaScreen}
            highlightElement={replicaHighlight}
            language={screenLanguage}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
            nudgeKey={nudgeKey}
            taskId={task.task_id}
          />
        )}
      </div>

      {/* In-language step instruction with progress and the practice badge. Only the instruction grows with
          the Text size setting; if it needs more room than the practice screen leaves, it scrolls. */}
      <div className="min-h-0 flex flex-col gap-sm bg-accent-soft border-t-4 border-accent px-md pt-sm pb-sm z-20" aria-live="polite">
        <div className="ts-fixed shrink-0 flex items-center justify-between gap-sm">
          <div className="text-label font-bold text-ink whitespace-nowrap" id="tutorial-progress-label">
            {stepLabel}
          </div>
          <div className="min-w-0 bg-accent-deep text-white rounded-lg px-sm text-label font-bold text-center">
            {t.practiceMode}
          </div>
        </div>

        <div
          className="shrink-0 h-3 w-full bg-surface border border-accent-deep rounded-full overflow-hidden"
          role="progressbar"
          aria-labelledby="tutorial-progress-label"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStepIndex + 1}
        >
          <div
            className="h-full w-full bg-accent-deep rounded-full origin-left transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${(currentStepIndex + 1) / totalSteps})` }}
          />
        </div>

        {/* A hint taller than the bar scrolls: its own thin scrollbar (always shown), a solid bottom edge,
            and a fade while more text is below */}
        <div className="relative min-h-0 flex flex-col">
          <div
            ref={hintRef}
            id="tutorial-hint"
            onScroll={measureHint}
            tabIndex={hintScrolls ? 0 : undefined}
            className={`hint-scroll min-h-0 overflow-y-auto text-body font-extrabold text-ink leading-snug [.text-large_&]:leading-[1.3] ${
              hintScrolls ? 'pr-md border-b-2 border-accent-deep' : ''
            }`}
          >
            {hint}
          </div>
          {hintMore && (
            <div
              data-hint-fade
              className="absolute left-0 right-md bottom-[2px] h-10 bg-gradient-to-t from-accent-soft to-accent-soft/0 pointer-events-none"
              aria-hidden="true"
            />
          )}
          {hintScrolls && (
            <div
              data-hint-scrollbar
              className="absolute right-0 top-0 bottom-[2px] w-[6px] rounded-full bg-surface border border-line pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="w-full bg-accent-deep rounded-full"
                style={{ height: `${hintThumb.size * 100}%`, transform: `translateY(${(hintThumb.top / hintThumb.size) * 100}%)` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
