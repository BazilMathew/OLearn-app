import React, { useState } from 'react';
import { SupportedLanguage, TextScale } from '../types/task';
import { I18N } from '../config/i18n';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { Globe, Volume2, RotateCcw, Check, Circle, Sparkles, Languages, ALargeSmall } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';

interface SettingsScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (on: boolean) => void;
  textScale: TextScale;
  onTextScaleChange: (scale: TextScale) => void;
  replicaLanguage: 'en' | 'follow';
  onReplicaLanguageChange: (mode: 'en' | 'follow') => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  onLanguageChange,
  reduceMotion,
  onReduceMotionChange,
  textScale,
  onTextScaleChange,
  replicaLanguage,
  onReplicaLanguageChange,
  onClose
}) => {
  const [speed, setSpeed] = useState<number>(AudioService.getSpeechRate());

  const t = I18N[language] || I18N.en;

  const languages: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ml', label: 'മലയാളം' }
  ];

  const textSizes: Array<{ scale: TextScale; label: string }> = [
    { scale: 1, label: t.textSizeNormal },
    { scale: 1.15, label: t.textSizeLarge },
    { scale: 1.3, label: t.textSizeLarger },
    { scale: 1.5, label: t.textSizeLargest }
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

  // Rows wrap (icon above, switch below) only when the longest word does not fit beside them
  const sectionTitle = 'flex flex-wrap items-center gap-md text-body font-bold text-ink';
  const wordWide = 'flex-1 min-w-[min(100%,min-content)]';

  return (
    <div className="h-full w-full bg-canvas flex flex-col p-lg select-none overflow-y-auto">
      {/* Header */}
      <ScreenHeader title={t.settings} onBack={onClose} backLabel={t.back} />

      <div className="space-y-xl">
        {/* Text size: first, so the choices stay in place while the rest of the screen grows or shrinks.
            The change applies at once; the sample sentence shows the chosen size. */}
        <Card className="space-y-lg">
          <div className={sectionTitle}>
            <ALargeSmall className="w-7 h-7 text-accent-deep flex-shrink-0" />
            <span className={wordWide}>{t.textSize}</span>
          </div>

          <div className="space-y-md">
            {textSizes.map((size) => {
              const isSelected = textScale === size.scale;
              return (
                <Button
                  key={size.scale}
                  icon={isSelected ? Check : Circle}
                  label={size.label}
                  selected={isSelected}
                  fullWidth
                  align="start"
                  onClick={() => onTextScaleChange(size.scale)}
                />
              );
            })}
          </div>

          <p className="bg-canvas rounded-btn border-2 border-line px-lg py-md text-body text-ink" aria-live="polite">
            {t.textSizePreview}
          </p>
        </Card>

        {/* Language Selection */}
        <Card className="space-y-lg">
          <div className={sectionTitle}>
            <Globe className="w-7 h-7 text-[#1A73E8] flex-shrink-0" />
            <span className={wordWide}>{t.chooseLanguage}</span>
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
            <Volume2 className="w-7 h-7 text-success flex-shrink-0" />
            <span className={wordWide}>{t.soundSpeed}</span>
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
            className="w-full min-h-[72px] px-lg py-md flex flex-wrap items-center gap-md text-left rounded-card active:bg-canvas"
          >
            <Sparkles className="w-7 h-7 text-accent-deep flex-shrink-0" />
            <span className={`${wordWide} text-body font-bold text-ink`}>{t.reduceMotion}</span>
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

        {/* Practice screens language: mock WhatsApp / Google Pay in English or in my language */}
        <div className="bg-surface rounded-card border-2 border-line shadow-card">
          <button
            type="button"
            role="switch"
            aria-checked={replicaLanguage === 'follow'}
            onClick={() => onReplicaLanguageChange(replicaLanguage === 'follow' ? 'en' : 'follow')}
            className="w-full min-h-[72px] px-lg py-md flex flex-wrap items-center gap-md text-left rounded-card active:bg-canvas"
          >
            <Languages className="w-7 h-7 text-[#1A73E8] flex-shrink-0" />
            <span className={wordWide}>
              <span className="block text-body font-bold text-ink">{t.practiceScreens}</span>
              <span className="block text-label text-ink-muted">
                {replicaLanguage === 'follow' ? t.practiceScreensMine : t.practiceScreensEnglish}
              </span>
            </span>
            <span
              className={`relative w-[68px] h-10 rounded-full border-2 flex-shrink-0 transition-colors ${
                replicaLanguage === 'follow' ? 'bg-success border-success' : 'bg-line border-[#CDBFAE]'
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-[2px] left-[2px] w-8 h-8 rounded-full bg-surface flex items-center justify-center transition-transform duration-200 ${
                  replicaLanguage === 'follow' ? 'translate-x-[28px]' : ''
                }`}
              >
                {replicaLanguage === 'follow' && <Check className="w-5 h-5 text-success" strokeWidth={3} />}
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
