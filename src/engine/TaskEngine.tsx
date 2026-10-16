import React, { useState, useEffect } from 'react';
import { TaskConfig, SupportedLanguage } from '../types/task';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';
import { I18N } from '../config/i18n';
import { WhatsAppReplica } from '../replicas/WhatsAppReplica';
import { GPayReplica } from '../replicas/GPayReplica';
import { Button } from '../components/Button';
import { MitraSvg } from '../components/Mascot';
import { Volume2, RotateCcw, X, List, Lightbulb, Sparkles } from 'lucide-react';

interface TaskEngineProps {
  task: TaskConfig;
  language: SupportedLanguage;
  onExit: () => void;
}

// 16 sparkles around Mitra: [x offset px, y offset px, size px, colour]
const SPARKLES: [number, number, number, string][] = [
  [-120, -70, 14, '#F2A93B'], [120, -64, 12, '#276B43'], [-104, 34, 12, '#1A73E8'], [108, 40, 14, '#F2A93B'],
  [-40, -110, 10, '#128C7E'], [44, -112, 12, '#F08A6C'], [-140, -10, 10, '#276B43'], [146, -6, 10, '#1A73E8'],
  [-72, 58, 10, '#F08A6C'], [76, 60, 12, '#128C7E'], [0, -128, 12, '#F2A93B'], [-150, 48, 10, '#F2A93B'],
  [150, 52, 10, '#276B43'], [-84, -104, 10, '#1A73E8'], [90, -100, 10, '#F2A93B'], [-132, -46, 10, '#F08A6C']
];

export const TaskEngine: React.FC<TaskEngineProps> = ({
  task,
  language,
  onExit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [nudgeKey, setNudgeKey] = useState<number>(0);

  const currentStep = task.steps[currentStepIndex];
  const totalSteps = task.steps.length;
  const t = I18N[language] || I18N.en;

  // Play audio narration when step changes
  useEffect(() => {
    if (isCompleted) {
      AudioService.playCelebrationSound();
      StorageService.markTaskCompleted(task.task_id);
      return;
    }

    if (currentStep) {
      const audioField = `audio_${language}` as keyof typeof currentStep;
      const audioPath = (currentStep[audioField] as string) || currentStep.audio_en;
      const hintText = currentStep.hint_text[language] || currentStep.hint_text.en;

      setIsAudioPlaying(true);
      AudioService.playNarration(audioPath, language, hintText, () => {
        setIsAudioPlaying(false);
      });
    }

    return () => {
      AudioService.stopAudio();
    };
  }, [currentStepIndex, isCompleted, language, task]);

  // Handle correct tap on the highlighted element
  const handleCorrectTap = () => {
    AudioService.playCorrectSound();
    setShowNudge(false);

    if (currentStepIndex + 1 < totalSteps) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Handle tap on any inert / wrong element
  const handleWrongTap = () => {
    AudioService.playNudgeSound();
    setShowNudge(true);
    setNudgeKey(k => k + 1);
    setTimeout(() => {
      setShowNudge(false);
    }, 3000);
  };

  const handleReplayAudio = () => {
    if (currentStep) {
      const audioField = `audio_${language}` as keyof typeof currentStep;
      const audioPath = (currentStep[audioField] as string) || currentStep.audio_en;
      const hintText = currentStep.hint_text[language] || currentStep.hint_text.en;

      setIsAudioPlaying(true);
      AudioService.playNarration(audioPath, language, hintText, () => {
        setIsAudioPlaying(false);
      });
    }
  };

  const handlePracticeAgain = () => {
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setShowNudge(false);
  };

  if (isCompleted) {
    return (
      <div className="h-full w-full bg-canvas flex flex-col justify-between p-lg select-none screen-enter overflow-y-auto">
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

          <div className="bg-success-soft border-2 border-success rounded-card p-lg w-full text-left flex items-start gap-md">
            <Sparkles className="w-7 h-7 text-success flex-shrink-0 mt-xs" aria-hidden="true" />
            <div>
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

  return (
    <div
      className="h-full w-full flex flex-col justify-between bg-canvas relative overflow-hidden select-none"
      onClick={handleWrongTap}
    >
      {/* Tutorial chrome: exit + repeat. The gentle nudge overlays this bar so the screen never shifts. */}
      <div className="relative bg-surface border-b-2 border-line px-sm py-sm z-30">
        <div className="grid grid-cols-2 gap-xs">
          <Button
            icon={X}
            label={t.exitTutorial}
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="!px-sm !py-sm !text-label !gap-xs min-w-0 [overflow-wrap:anywhere] [&>svg]:!w-6 [&>svg]:!h-6"
          />
          <Button
            icon={Volume2}
            label={t.replayAudio}
            variant={isAudioPlaying ? 'primary' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              handleReplayAudio();
            }}
            className="!px-sm !py-sm !text-label !gap-xs min-w-0 [overflow-wrap:anywhere] [&>svg]:!w-6 [&>svg]:!h-6"
          />
        </div>

        {/* Gentle Nudge (never a penalty or dead-end); taps pass through to the buttons underneath */}
        {showNudge && (
          <div className="screen-enter absolute top-0 left-0 right-0 min-h-full z-50 pointer-events-none bg-surface border-b-4 border-accent px-lg py-sm flex items-center gap-md" role="status">
            <Lightbulb className="w-8 h-8 text-accent-deep flex-shrink-0" aria-hidden="true" />
            <div className="text-label font-bold text-ink leading-snug">
              {t.gentleNudge}
            </div>
          </div>
        )}
      </div>

      {/* Screen Replica Container */}
      <div className="flex-1 relative overflow-y-auto bg-canvas flex flex-col">
        {task.app === 'whatsapp' ? (
          <WhatsAppReplica
            screen={currentStep.screen}
            highlightElement={currentStep.highlight_element}
            language={language}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
            nudgeKey={nudgeKey}
          />
        ) : (
          <GPayReplica
            screen={currentStep.screen}
            highlightElement={currentStep.highlight_element}
            language={language}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
            nudgeKey={nudgeKey}
          />
        )}
      </div>

      {/* In-language step instruction with progress and the practice badge */}
      <div className="bg-accent-soft border-t-4 border-accent px-lg pt-sm pb-sm z-20 space-y-sm" aria-live="polite">
        <div className="flex items-center justify-between gap-sm">
          <div className="text-label font-bold text-ink whitespace-nowrap" id="tutorial-progress-label">
            {stepLabel}
          </div>
          <div className="min-w-0 bg-accent-deep text-white rounded-lg px-sm text-label font-bold text-center">
            {t.practiceMode}
          </div>
        </div>

        <div
          className="h-3 w-full bg-surface border border-accent-deep rounded-full overflow-hidden"
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

        <div className="text-body font-extrabold text-ink leading-snug">
          {hint}
        </div>
      </div>
    </div>
  );
};
