import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TaskConfig, SupportedLanguage } from '../types/task';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';
import { I18N } from '../config/i18n';
import { WhatsAppReplica } from '../replicas/WhatsAppReplica';
import { GPayReplica } from '../replicas/GPayReplica';
import { Volume2, RotateCcw, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';

interface TaskEngineProps {
  task: TaskConfig;
  language: SupportedLanguage;
  onExit: () => void;
}

export const TaskEngine: React.FC<TaskEngineProps> = ({
  task,
  language,
  onExit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const currentStep = task.steps[currentStepIndex];
  const totalSteps = task.steps.length;
  const t = I18N[language] || I18N.en;

  // Play audio narration when step changes
  useEffect(() => {
    if (isCompleted) {
      AudioService.playCelebrationSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
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
      <div className="h-full w-full bg-slate-50 flex flex-col justify-between p-6 select-none animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-md">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {t.taskCompleted}
            </h2>
            <p className="text-xl text-gray-700 font-medium max-w-sm mx-auto">
              {t.taskCompletedSubtitle}
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 w-full text-left flex items-start space-x-3">
            <Sparkles className="w-7 h-7 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <div className="text-xl font-bold text-emerald-900">
                {task.title[language] || task.title.en}
              </div>
              <div className="text-lg text-emerald-800">
                {task.app === 'whatsapp' ? t.whatsAppTitle : t.gpayTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Min 64dp height for elderly touch targets */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handlePracticeAgain}
            className="w-full min-h-[64px] bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xl rounded-2xl shadow-lg border-2 border-amber-600 flex items-center justify-center space-x-3 transition-colors"
          >
            <RotateCcw className="w-7 h-7" />
            <span>{t.practiceAgain}</span>
          </button>

          <button
            onClick={onExit}
            className="w-full min-h-[64px] bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xl rounded-2xl shadow-md flex items-center justify-center space-x-3 transition-colors"
          >
            <ArrowLeft className="w-7 h-7" />
            <span>{t.backToMenu}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col justify-between bg-white relative overflow-hidden select-none"
      onClick={handleWrongTap}
    >
      {/* Top Tutorial Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg px-3 py-2 rounded-xl border border-slate-700 active:bg-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.exitTutorial}</span>
        </button>

        <div className="text-center font-bold text-lg text-amber-300">
          {t.stepOf} {currentStepIndex + 1} / {totalSteps}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReplayAudio();
          }}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-lg font-bold border ${
            isAudioPlaying
              ? 'bg-amber-500 text-slate-950 border-amber-600 animate-pulse'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
          }`}
          title={t.replayAudio}
        >
          <Volume2 className="w-6 h-6" />
          <span>{t.replayAudio}</span>
        </button>
      </div>

      {/* Screen Replica Container */}
      <div className="flex-1 relative overflow-y-auto bg-gray-100 flex flex-col">
        {task.app === 'whatsapp' ? (
          <WhatsAppReplica
            screen={currentStep.screen}
            highlightElement={currentStep.highlight_element}
            language={language}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
          />
        ) : (
          <GPayReplica
            screen={currentStep.screen}
            highlightElement={currentStep.highlight_element}
            language={language}
            onCorrectTap={handleCorrectTap}
            onWrongTap={handleWrongTap}
          />
        )}
      </div>

      {/* Gentle Nudge Toast (Never penalty or dead-end) */}
      {showNudge && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-amber-100 border-3 border-amber-500 text-amber-950 p-4 rounded-2xl shadow-2xl flex items-center space-x-3 shake-nudge animate-fade-in">
          <div className="w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black text-2xl flex-shrink-0">
            !
          </div>
          <div className="text-xl font-bold leading-snug">
            {t.gentleNudge}
          </div>
        </div>
      )}

      {/* In-language Step Instructional Banner at Bottom */}
      <div className="bg-amber-100 border-t-4 border-amber-400 p-4 shadow-xl z-20 flex items-center space-x-3">
        <div className="bg-amber-400 text-slate-950 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xl flex-shrink-0">
          {currentStepIndex + 1}
        </div>
        <div className="text-xl font-extrabold text-slate-900 leading-snug flex-1">
          {currentStep.hint_text[language] || currentStep.hint_text.en}
        </div>
      </div>
    </div>
  );
};
