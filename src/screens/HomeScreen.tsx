import React from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { MessageCircle, CreditCard, Mic, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  language: SupportedLanguage;
  onSelectApp: (app: 'whatsapp' | 'gpay') => void;
  onOpenAskMe: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onSelectApp,
  onOpenAskMe
}) => {
  const t = I18N[language] || I18N.en;

  return (
    <div className="h-full w-full bg-slate-100 flex flex-col justify-between p-5 select-none animate-fade-in">
      {/* App Header */}
      <div className="pt-2 text-center space-y-1">
        <div className="inline-flex items-center space-x-2 bg-amber-200 text-amber-950 font-bold px-4 py-1.5 rounded-full text-base border border-amber-400">
          <Sparkles className="w-5 h-5 text-amber-800" />
          <span>{t.tagline}</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mt-2">
          {t.appName}
        </h1>
      </div>

      {/* Exactly 2 Large Square App Icons (>=120dp) with Name Printed Underneath */}
      <div className="space-y-6 my-auto">
        {/* WhatsApp Big Tile */}
        <button
          onClick={() => onSelectApp('whatsapp')}
          className="w-full min-h-[140px] bg-white hover:bg-emerald-50 active:bg-emerald-100 rounded-3xl p-5 flex items-center space-x-5 shadow-lg border-3 border-[#075E54] transition-transform active:scale-[0.98]"
        >
          <div className="w-24 h-24 bg-[#25D366] text-white rounded-3xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-[#128C7E]">
            <MessageCircle className="w-14 h-14" />
          </div>
          <div className="text-left flex-1">
            <div className="text-3xl font-black text-[#075E54]">
              {t.whatsAppTitle}
            </div>
            <div className="text-xl font-bold text-gray-700 mt-1">
              {language === 'hi' ? 'मैसेज और कॉल सीखें' : language === 'ml' ? 'സന്ദേശങ്ങളും കോളുകളും' : 'Message & Call Tutorials'}
            </div>
          </div>
        </button>

        {/* Google Pay Big Tile */}
        <button
          onClick={() => onSelectApp('gpay')}
          className="w-full min-h-[140px] bg-white hover:bg-blue-50 active:bg-blue-100 rounded-3xl p-5 flex items-center space-x-5 shadow-lg border-3 border-[#1A73E8] transition-transform active:scale-[0.98]"
        >
          <div className="w-24 h-24 bg-[#1A73E8] text-white rounded-3xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-blue-700">
            <CreditCard className="w-14 h-14" />
          </div>
          <div className="text-left flex-1">
            <div className="text-3xl font-black text-[#1A73E8]">
              {t.gpayTitle}
            </div>
            <div className="text-xl font-bold text-gray-700 mt-1">
              {language === 'hi' ? 'सुरक्षित भुगतान सीखें' : language === 'ml' ? 'പണം നൽകാൻ പഠിക്കുക' : 'Digital Payment Tutorials'}
            </div>
          </div>
        </button>
      </div>

      {/* Ask Me / Chatbot Router Banner with Mic */}
      <div className="pb-2">
        <button
          onClick={onOpenAskMe}
          className="w-full min-h-[80px] bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-3xl p-4 shadow-xl border-3 border-amber-600 flex items-center justify-between transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center shadow-md">
              <Mic className="w-8 h-8" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black leading-tight">
                {t.askMe}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {t.tapAndSpeak}
              </div>
            </div>
          </div>
          <div className="bg-slate-950 text-white font-bold text-lg px-4 py-2 rounded-xl">
            {language === 'hi' ? 'पूछें' : language === 'ml' ? 'തുടങ്ങുക' : 'Start'}
          </div>
        </button>
      </div>
    </div>
  );
};
