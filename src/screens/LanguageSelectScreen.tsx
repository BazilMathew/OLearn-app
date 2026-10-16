import React from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface LanguageSelectScreenProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  isFirstLaunch?: boolean;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  isFirstLaunch = false
}) => {
  const languages: Array<{ code: SupportedLanguage; nativeName: string; englishName: string }> = [
    { code: 'en', nativeName: 'English', englishName: 'English' },
    { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
    { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' }
  ];

  const t = I18N[currentLanguage] || I18N.en;

  return (
    <div className="h-full w-full bg-canvas flex flex-col p-lg select-none overflow-y-auto">
      {/* Header */}
      <div className="space-y-md pt-xl text-center">
        <div className="w-16 h-16 bg-accent text-ink rounded-btn mx-auto flex items-center justify-center font-black text-display border-2 border-accent-deep shadow-[0_4px_0_0_#8A5207]">
          OL
        </div>
        <h1 className="text-display text-ink">
          {t.selectLanguageTitle}
        </h1>
        <p className="text-body text-ink-muted max-w-xs mx-auto">
          {t.selectLanguageSubtitle}
        </p>
      </div>

      {/* 3 Tiles Only: English / हिन्दी / മലയാളം */}
      <div className="space-y-lg my-auto py-xl">
        {languages.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <Card
              key={lang.code}
              onClick={() => onSelectLanguage(lang.code)}
              ariaPressed={isSelected}
              shade={isSelected ? '#8A5207' : undefined}
              className={`min-h-[80px] flex items-center gap-lg ${
                isSelected ? 'bg-accent-soft border-accent-deep active:bg-[#F8DDB0]' : 'border-line active:bg-canvas'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  isSelected ? 'bg-ink border-ink text-surface' : 'bg-surface border-line text-ink-muted'
                }`}
              >
                {isSelected ? <Check className="w-7 h-7" strokeWidth={3} /> : <Circle className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-title text-ink">{lang.nativeName}</div>
                <div className="text-label text-ink-muted">{lang.englishName}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Continue CTA */}
      <div className="pb-sm">
        <Button
          icon={ArrowRight}
          iconEnd
          label={t.continueBtn}
          variant="dark"
          fullWidth
          onClick={() => onSelectLanguage(currentLanguage)}
        />
      </div>
    </div>
  );
};
