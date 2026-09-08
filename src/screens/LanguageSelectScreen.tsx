import React from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { Check } from 'lucide-react';

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
    <div className="h-full w-full bg-slate-50 flex flex-col justify-between p-6 select-none animate-fade-in">
      {/* Header */}
      <div className="space-y-3 pt-6 text-center">
        <div className="w-16 h-16 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center font-black text-3xl text-slate-950 shadow-md">
          OL
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {t.selectLanguageTitle}
        </h1>
        <p className="text-xl text-gray-700 font-medium max-w-xs mx-auto">
          {t.selectLanguageSubtitle}
        </p>
      </div>

      {/* 3 Tiles Only: English / हिन्दी / മലയാളം */}
      <div className="space-y-4 my-auto">
        {languages.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onSelectLanguage(lang.code)}
              className={`w-full min-h-[76px] rounded-3xl p-5 flex items-center justify-between border-3 transition-all duration-200 shadow-md ${
                isSelected
                  ? 'bg-amber-400 border-amber-600 text-slate-950 ring-4 ring-amber-300/60'
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900 active:bg-gray-100'
              }`}
            >
              <div className="text-left">
                <div className="text-3xl font-extrabold tracking-tight">
                  {lang.nativeName}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {lang.englishName}
                </div>
              </div>

              {isSelected && (
                <div className="w-10 h-10 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Continue CTA */}
      <div className="pb-4">
        <button
          onClick={() => onSelectLanguage(currentLanguage)}
          className="w-full min-h-[64px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-2xl font-bold rounded-2xl shadow-xl flex items-center justify-center transition-colors"
        >
          {t.continueBtn}
        </button>
      </div>
    </div>
  );
};
