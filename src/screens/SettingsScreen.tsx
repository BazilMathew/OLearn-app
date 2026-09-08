import React, { useState } from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { ArrowLeft, Globe, Volume2, Key, RotateCcw, Check } from 'lucide-react';

interface SettingsScreenProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  language,
  onLanguageChange,
  onClose
}) => {
  const profile = StorageService.getProfile();
  const [apiKeyInput, setApiKeyInput] = useState<string>(profile.apiKey || '');
  const [speed, setSpeed] = useState<number>(AudioService.getSpeechRate());
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const t = I18N[language] || I18N.en;

  const languages: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ml', label: 'മലയാളം' }
  ];

  const handleSaveApiKey = () => {
    StorageService.setApiKey(apiKeyInput);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    AudioService.setSpeechRate(newSpeed);
  };

  const handleReset = () => {
    if (window.confirm('Reset all completed tutorial progress?')) {
      StorageService.resetProgress();
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col justify-between p-5 select-none animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2.5 bg-gray-200 hover:bg-gray-300 rounded-2xl text-gray-900"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-black text-gray-900">
            {t.settings}
          </h1>
        </div>
      </div>

      <div className="space-y-6 my-4">
        {/* Language Selection Tiles */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center space-x-3 text-xl font-bold text-gray-900">
            <Globe className="w-7 h-7 text-[#1A73E8]" />
            <span>{t.chooseLanguage}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`py-3 px-2 rounded-2xl font-bold text-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-amber-400 border-amber-600 text-slate-950 ring-2 ring-amber-300'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Narration Speed */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center space-x-3 text-xl font-bold text-gray-900">
            <Volume2 className="w-7 h-7 text-emerald-600" />
            <span>{t.soundSpeed}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSpeedChange(0.85)}
              className={`py-3 px-4 rounded-2xl font-bold text-xl border-2 ${
                speed < 0.95
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              {t.slowSpeed}
            </button>
            <button
              onClick={() => handleSpeedChange(1.0)}
              className={`py-3 px-4 rounded-2xl font-bold text-xl border-2 ${
                speed >= 0.95
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              {t.normalSpeed}
            </button>
          </div>
        </div>

        {/* Optional OpenAI API Key */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-3">
          <div className="flex items-center space-x-3 text-xl font-bold text-gray-900">
            <Key className="w-7 h-7 text-purple-600" />
            <span>OpenAI API Key</span>
          </div>
          <p className="text-base text-gray-600 font-semibold">
            {t.apiKeyLabel}
          </p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-..."
            className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl font-mono focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleSaveApiKey}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl flex items-center justify-center space-x-2"
          >
            {savedNotice ? <Check className="w-5 h-5" /> : null}
            <span>{savedNotice ? 'Saved!' : t.save}</span>
          </button>
        </div>

        {/* Reset Progress */}
        <div className="pt-2">
          <button
            onClick={handleReset}
            className="w-full min-h-[58px] bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 font-bold text-xl rounded-2xl flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-6 h-6" />
            <span>{t.resetProgress}</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="pt-4">
        <button
          onClick={onClose}
          className="w-full min-h-[64px] bg-slate-900 hover:bg-slate-800 text-white text-2xl font-bold rounded-2xl shadow-xl flex items-center justify-center"
        >
          {t.continueBtn}
        </button>
      </div>
    </div>
  );
};
