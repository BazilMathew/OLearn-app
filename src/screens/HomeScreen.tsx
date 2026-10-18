import React from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { MessageCircle, CreditCard, Mic, ChevronRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Mascot } from '../components/Mascot';

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
    <div className="h-full w-full bg-canvas flex flex-col p-lg select-none overflow-y-auto">
      {/* App Header with Mitra; at large text sizes the tagline wraps below Mitra rather than past the edge */}
      <div className="flex flex-wrap items-center gap-lg pt-sm">
        <Mascot size={88} />
        <div className="flex-1 min-w-[min(100%,min-content)]">
          <h1 className="text-display text-ink">
            {t.appName}
          </h1>
          <p className="text-label text-ink-muted">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Exactly 2 Large Square App Icons (>=120dp) with Name Printed Underneath.
          The text column is never narrower than its longest word; when that does not fit beside the icon
          (Malayalam WhatsApp at 360px), the text wraps below the icon, left-aligned, like the Ask card. */}
      <div className="space-y-lg my-auto py-xl">
        {/* WhatsApp Big Tile */}
        <Card
          onClick={() => onSelectApp('whatsapp')}
          shade="#075E54"
          className="bg-white border-[#075E54] active:bg-emerald-50 flex flex-wrap items-center gap-lg"
        >
          <div className="w-[120px] h-[120px] bg-[#25D366] text-white rounded-card flex items-center justify-center flex-shrink-0 border-2 border-[#128C7E]">
            <MessageCircle className="w-16 h-16" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-[min(100%,min-content)]">
            <div className="text-title font-extrabold text-[#075E54]">
              {t.whatsAppTitle}
            </div>
            <div className="text-label text-ink-muted mt-xs">
              {language === 'hi' ? 'मैसेज और कॉल सीखें' : language === 'ml' ? 'സന്ദേശങ്ങളും കോളുകളും' : 'Message & Call Tutorials'}
            </div>
          </div>
        </Card>

        {/* Google Pay Big Tile */}
        <Card
          onClick={() => onSelectApp('gpay')}
          shade="#1A73E8"
          className="bg-white border-[#1A73E8] active:bg-blue-50 flex flex-wrap items-center gap-lg"
        >
          <div className="w-[120px] h-[120px] bg-[#1A73E8] text-white rounded-card flex items-center justify-center flex-shrink-0 border-2 border-blue-700">
            <CreditCard className="w-16 h-16" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-[min(100%,min-content)]">
            <div className="text-title font-extrabold text-[#1A73E8]">
              {t.gpayTitle}
            </div>
            <div className="text-label text-ink-muted mt-xs">
              {language === 'hi' ? 'सुरक्षित भुगतान सीखें' : language === 'ml' ? 'പണം നൽകാൻ പഠിക്കുക' : 'Digital Payment Tutorials'}
            </div>
          </div>
        </Card>
      </div>

      {/* Ask Me / Chatbot Router Banner with Mic.
          One rule for every language: icon and text stay on one line each where they can; when they and the
          Start button do not fit one row, the button wraps below at full width (flex-wrap, no measuring). */}
      <Card
        onClick={onOpenAskMe}
        shade="#8A5207"
        className="bg-accent border-accent-deep active:bg-[#E59A2A] flex flex-wrap items-center gap-md"
      >
        {/* Never narrower than its text on one line (unless that is wider than the card), so nothing overlaps */}
        <div className="flex flex-wrap items-center gap-lg min-w-[min(100%,max-content)] [flex:999_1_auto]">
          <div className="w-14 h-14 bg-ink text-accent rounded-btn flex items-center justify-center flex-shrink-0">
            <Mic className="w-8 h-8" strokeWidth={2.5} />
          </div>
          {/* Below the mic icon when its longest word does not fit beside it (large text in Malayalam) */}
          <div className="flex-1 min-w-[min(100%,min-content)]">
            <div className="text-title font-extrabold text-ink break-words">
              {t.askMe}
            </div>
            <div className="text-label text-ink break-words mt-xs">
              {t.tapAndSpeak}
            </div>
          </div>
        </div>
        {/* Grows to full width when it wraps onto its own line; at least 64px tall */}
        <div className="min-h-[64px] [flex:1_0_auto] bg-ink text-surface text-label font-bold pl-md pr-sm py-sm rounded-btn flex items-center justify-center gap-xs">
          <span>{t.askStart}</span>
          <ChevronRight className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
        </div>
      </Card>
    </div>
  );
};
