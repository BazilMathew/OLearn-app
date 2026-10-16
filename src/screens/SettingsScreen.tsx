import React, { useState } from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { Globe, Volume2, RotateCcw, Check, Circle, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';

interface SettingsScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (on: boolean) => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  onLanguageChange,
  reduceMotion,
  onReduceMotionChange,
  onClose
}) => {
  const [speed, setSpeed] = useState<number>(AudioService.getSpeechRate());

  const t = I18N[language] || I18N.en;

  const languages: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ml', label: 'മലയാളം' }
  ];

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    AudioService.setSpeechRate(newSpeed);
  };

  const handleReset = () => {
    if (window.confirm('Reset all completed tutorial progress?')) {
      StorageService.resetProgress();
    }
  };

  const sectionTitle = 'flex items-center gap-md text-body font-bold text-ink';

  return (
    <div className="h-full w-full bg-canvas flex flex-col p-lg select-none overflow-y-auto">
      {/* Header */}
      <ScreenHeader title={t.settings} onBack={onClose} backLabel={t.back} />

      <div className="space-y-xl">
        {/* Language Selection */}
        <Card className="space-y-lg">
          <div className={sectionTitle}>
            <Globe className="w-7 h-7 text-[#1A73E8]" />
            <span>{t.chooseLanguage}</span>
          </div>

          <div className="space-y-md">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <Button
                  key={lang.code}
                  icon={isSelected ? Check : Circle}
                  label={lang.label}
                  selected={isSelected}
                  fullWidth
                  align="start"
                  onClick={() => onLanguageChange(lang.code)}
                />
              );
            })}
          </div>
        </Card>

        {/* Audio Narration Speed */}
        <Card className="space-y-lg">
          <div className={sectionTitle}>
            <Volume2 className="w-7 h-7 text-success" />
            <span>{t.soundSpeed}</span>
          </div>

          <div className="space-y-md">
            <Button
              icon={speed < 0.95 ? Check : Circle}
              label={t.slowSpeed}
              selected={speed < 0.95}
              fullWidth
              align="start"
              onClick={() => handleSpeedChange(0.85)}
            />
            <Button
              icon={speed >= 0.95 ? Check : Circle}
              label={t.normalSpeed}
              selected={speed >= 0.95}
              fullWidth
              align="start"
              onClick={() => handleSpeedChange(1.0)}
            />
          </div>
        </Card>

        {/* Reduce motion */}
        <div className="bg-surface rounded-card border-2 border-line shadow-card">
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            onClick={() => onReduceMotionChange(!reduceMotion)}
            className="w-full min-h-[72px] px-lg py-md flex items-center gap-md text-left rounded-card active:bg-canvas"
          >
            <Sparkles className="w-7 h-7 text-accent-deep flex-shrink-0" />
            <span className="flex-1 text-body font-bold text-ink">{t.reduceMotion}</span>
            <span
              className={`relative w-[68px] h-10 rounded-full border-2 flex-shrink-0 transition-colors ${
                reduceMotion ? 'bg-success border-success' : 'bg-line border-[#CDBFAE]'
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-[2px] left-[2px] w-8 h-8 rounded-full bg-surface flex items-center justify-center transition-transform duration-200 ${
                  reduceMotion ? 'translate-x-[28px]' : ''
                }`}
              >
                {reduceMotion && <Check className="w-5 h-5 text-success" strokeWidth={3} />}
              </span>
            </span>
          </button>
        </div>

        {/* Reset Progress */}
        <Button icon={RotateCcw} label={t.resetProgress} variant="danger" fullWidth onClick={handleReset} />
      </div>

      {/* Done Button */}
      <div className="pt-xl mt-auto">
        <Button icon={Check} label={t.continueBtn} variant="dark" fullWidth onClick={onClose} />
      </div>
    </div>
  );
};
