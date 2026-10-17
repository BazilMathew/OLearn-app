import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { MOCK_TRANSACTIONS, MOCK_BANK_BALANCE, MockTransaction } from '../config/mockData';
import { REPLICA_STRINGS, ReplicaStrings } from './replicaStrings';
import { PhoneHomeScreen } from './WhatsAppReplica';
import {
  QrCode,
  ScanQrCode,
  Users,
  Building2,
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Delete,
  BadgeCheck,
  ChevronRight,
  Search,
  House,
  Landmark,
  CircleUserRound,
  X,
  Flashlight,
  MoreVertical,
  Phone,
  Smartphone,
  Lightbulb,
  Droplet,
  Pill,
  History,
  Image as ImageIcon
} from 'lucide-react';

interface GPayReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  nudgeKey?: number;
  /** Running task, used only to pick the practice payment amount. */
  taskId?: string;
}

/**
 * Google Pay light palette and radii, all in one place. Every screen's root sets these CSS variables and
 * the classes read them (e.g. bg-[var(--gp-surface-alt)]), so a dark palette can later swap the values here.
 */
const GP_THEME = {
  '--gp-surface': '#FFFFFF', // page
  '--gp-surface-alt': '#F0F3F8', // search pill, bottom bar, keypad, secondary pills
  '--gp-surface-card': '#F9FAFE', // borderless cards
  '--gp-surface-header': '#F2F7FD', // contact chat and amount headers
  '--gp-band': '#E3F0FC', // soft band behind the home search
  '--gp-border': '#E3E3E3',
  '--gp-ink': '#1F1F1F',
  '--gp-ink-muted': '#444746',
  '--gp-chevron': '#383838',
  '--gp-brand-blue': '#1A73E8', // filled buttons and the success screen (OLearn's Google Pay colour)
  '--gp-brand-blue-deep': '#0B57D0', // glyphs, links and the unread dot
  '--gp-brand-blue-soft': '#D2E4FC', // tiles, bill circles, the Scan QR card
  '--gp-brand-blue-ink': '#0842A0', // icons and text on the soft blue
  '--gp-avatar': '#00589F', // letter avatars (white letter)
  '--gp-nav-pill': '#C3E7FF',
  '--gp-nav-icon': '#004B76',
  '--gp-success': '#146C2E',
  '--gp-success-soft': '#C4EED0',
  '--gp-scan-sheet': '#323232',
  '--gp-scan-pill': '#E3E3E3',
  '--gp-scan-red': '#EA4335',
  '--gp-scan-yellow': '#FBBC04',
  '--gp-scan-blue': '#4285F4',
  '--gp-scan-green': '#34A853',
  '--gp-r-card': '16px',
  '--gp-r-tile': '16px',
  '--gp-r-bubble': '24px'
} as React.CSSProperties;

const SOFT_SHADOW = 'shadow-[0_1px_3px_rgba(0,0,0,0.15)]';

// Practice payment amount (rupees) per task, matching its narration; other flows use the default
const PAYMENT_AMOUNTS: Record<string, number> = { gpay_send_contact: 1000 };
const DEFAULT_PAYMENT_AMOUNT = 200;

// Who the practice payment goes to, per task; other flows pay the shop.
// The shop shows a "Banking Name Verified" line; a contact shows their phone number instead.
// Names and initials come from the replica string table, so they follow the practice-screen language.
interface Payee {
  nameKey: 'shopName' | 'rameshSon';
  initialKey: 'shopInitial' | 'rameshInitial';
  phone?: string;
}
const SHOP_PAYEE: Payee = { nameKey: 'shopName', initialKey: 'shopInitial' };
const PAYEES: Record<string, Payee> = {
  gpay_send_contact: { nameKey: 'rameshSon', initialKey: 'rameshInitial', phone: '+91 98765 43210' }
};

// Round letter avatar in Google Pay's dark blue with a white letter
const LetterAvatar: React.FC<{ letter: string; size?: 'md' | 'lg' }> = ({ letter, size = 'md' }) => (
  <div
    className={`rounded-full bg-[var(--gp-avatar)] text-white flex items-center justify-center flex-shrink-0 font-normal ${
      size === 'lg' ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'
    }`}
  >
    {letter}
  </div>
);

// Home shortcut: soft-blue rounded square with a dark-blue icon, its name beside it
const Shortcut: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="min-h-[72px] flex items-center gap-md px-sm py-xs">
    <div className="w-16 h-16 rounded-[var(--gp-r-tile)] bg-[var(--gp-brand-blue-soft)] flex items-center justify-center flex-shrink-0">
      <Icon className="w-8 h-8 text-[color:var(--gp-brand-blue-ink)]" aria-hidden="true" />
    </div>
    <span className="text-label font-normal text-[color:var(--gp-ink)] leading-tight break-words min-w-0">{label}</span>
  </div>
);

// Section heading on the Google Pay home (24px bold: the closest the header rule allows to the app's light headings)
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[24px] leading-[30px] font-bold text-[color:var(--gp-ink)] px-lg pt-xl pb-md">{children}</div>
);

// Round 64px picture (initial or icon) with a name below; used for people, shops and bills on the home
const RoundItem: React.FC<{
  circleClass: string;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  dot?: boolean;
}> = ({ circleClass, label, children, onClick, dot }) => (
  <div onClick={onClick} className="min-w-0 flex flex-col items-center gap-xs py-xs text-center">
    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-3xl font-normal flex-shrink-0 ${circleClass}`}>
      {children}
      {/* Unread dot, as on the app's people row */}
      {dot && (
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--gp-brand-blue-deep)] border-2 border-[color:var(--gp-surface)]"
          aria-hidden="true"
        />
      )}
    </div>
    <span className="text-label font-normal text-[color:var(--gp-ink)] leading-tight break-words max-w-full">{label}</span>
  </div>
);

// Simple light app bar used by most Google Pay screens
const AppBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[var(--gp-surface)] flex items-center gap-md px-lg py-md">
    <ArrowLeft className="w-7 h-7 text-[color:var(--gp-ink)] flex-shrink-0" aria-hidden="true" />
    {children}
  </div>
);

// One transaction row: letter avatar, name and date, amount on the right (received amounts in green)
const TransactionRow: React.FC<{ txn: MockTransaction; language: SupportedLanguage }> = ({ txn, language }) => {
  const name = txn.merchant[language] || txn.merchant.en;
  return (
    <div className="min-h-[76px] px-sm py-sm flex items-center justify-between gap-md">
      <div className="flex items-center gap-lg min-w-0">
        <LetterAvatar letter={name.charAt(0)} />
        <div className="min-w-0">
          <div className="text-body font-semibold text-[color:var(--gp-ink)] break-words">{name}</div>
          <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{txn.date[language] || txn.date.en}</div>
        </div>
      </div>
      <div
        className={`text-body font-semibold flex-shrink-0 ${
          txn.isCredit ? 'text-[color:var(--gp-success)]' : 'text-[color:var(--gp-ink)]'
        }`}
      >
        {txn.isCredit ? `+ ${txn.amount}` : txn.amount}
      </div>
    </div>
  );
};

export const GPayReplica: React.FC<GPayReplicaProps> = ({
  screen,
  highlightElement,
  language,
  onCorrectTap,
  onWrongTap,
  nudgeKey,
  taskId
}) => {
  const tp = { activeHighlightId: highlightElement, onCorrectTap, onWrongTap, nudgeKey };
  const r: ReplicaStrings = REPLICA_STRINGS[language] || REPLICA_STRINGS.en;
  // Indian digit grouping, e.g. ₹1,000 and ₹1,000.00
  const amountValue = (taskId && PAYMENT_AMOUNTS[taskId]) || DEFAULT_PAYMENT_AMOUNT;
  const amount = '₹' + amountValue.toLocaleString('en-IN');
  const amountExact = '₹' + amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const payee = (taskId && PAYEES[taskId]) || SHOP_PAYEE;
  const payeeName = r[payee.nameKey];
  const payeeInitial = r[payee.initialKey];

  // 0. PHONE HOME SCREEN (every tutorial starts here; shared with the WhatsApp replica)
  if (screen === 'phone_home_screen') {
    return <PhoneHomeScreen r={r} tp={tp} />;
  }

  // 1. QR SCANNER VIEWFINDER SCREEN (black camera view in light mode too, as in the app)
  if (screen === 'gpay_qr_scanner_viewfinder') {
    return (
      <div className="min-h-full shrink-0 w-full bg-black text-white flex flex-col justify-between items-center" style={GP_THEME}>
        {/* Top: close, then torch, my QR code and menu (inert) */}
        <div className="w-full flex items-center justify-between px-sm">
          <div className="w-16 h-16 flex items-center justify-center">
            <X className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <Flashlight className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <ScanQrCode className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <MoreVertical className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Square viewfinder frame with the shop QR code: four coloured, rounded corner brackets */}
        <div className="flex flex-col items-center px-lg">
          <HighlightTarget elementId="qr_target_box" {...tp} className="rounded-[28px]">
            <div className="w-64 h-64 rounded-[28px] bg-black flex flex-col items-center justify-center p-lg relative">
              <span className="absolute top-1 left-1 w-14 h-14 border-t-[5px] border-l-[5px] border-[color:var(--gp-scan-red)] rounded-tl-[26px]" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-14 h-14 border-t-[5px] border-r-[5px] border-[color:var(--gp-scan-yellow)] rounded-tr-[26px]" aria-hidden="true" />
              <span className="absolute bottom-1 left-1 w-14 h-14 border-b-[5px] border-l-[5px] border-[color:var(--gp-scan-blue)] rounded-bl-[26px]" aria-hidden="true" />
              <span className="absolute bottom-1 right-1 w-14 h-14 border-b-[5px] border-r-[5px] border-[color:var(--gp-scan-green)] rounded-br-[26px]" aria-hidden="true" />
              <div className="bg-white rounded-xl p-sm">
                <QrCode className="w-32 h-32 text-[color:var(--gp-ink)]" />
              </div>
              <div className="bg-[var(--gp-brand-blue)] text-white text-label px-md py-xs rounded-full mt-md">
                {r.shopName}
              </div>
            </div>
          </HighlightTarget>

          <p className="text-body text-white font-bold mt-md text-center">
            {r.pointCamera}
          </p>

          {/* Pick a QR photo instead (inert) */}
          <div
            onClick={onWrongTap}
            className="mt-md min-h-[64px] px-lg rounded-full bg-[var(--gp-scan-pill)] text-[color:var(--gp-ink)] flex items-center justify-center gap-sm text-center"
          >
            <ImageIcon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            <span className="text-label font-normal leading-tight break-words min-w-0">{r.choosePhoto}</span>
          </div>
        </div>

        {/* Bottom sheet with a handle */}
        <div className="w-full mt-md bg-[var(--gp-scan-sheet)] rounded-t-[28px] px-lg pt-sm pb-lg text-center">
          <div className="w-10 h-1 bg-white/70 rounded-full mx-auto mb-sm" aria-hidden="true" />
          <div className="text-body font-normal text-white">{r.scanShopQr}</div>
          <div className="text-label font-normal text-white/80">{r.sandboxFooter}</div>
        </div>
      </div>
    );
  }

  // 2. AMOUNT ENTRY SCREEN
  if (screen === 'gpay_amount_entry_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col justify-between" style={GP_THEME}>
        <div className="bg-[var(--gp-surface-header)] flex items-center gap-md px-lg py-md">
          <ArrowLeft className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <LetterAvatar letter={payeeInitial} />
          <div className="min-w-0">
            <div className="text-body font-normal leading-tight break-words">
              {payeeName}
            </div>
            {payee.phone ? (
              <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{payee.phone}</div>
            ) : (
              <div className="text-label font-normal text-[color:var(--gp-ink-muted)] flex items-center gap-xs">
                <BadgeCheck className="w-5 h-5 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" aria-hidden="true" />
                <span>{r.bankingNameVerified}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center my-auto gap-md px-xl">
          <span className="text-body text-[color:var(--gp-ink-muted)]">
            {r.payingAmount}
          </span>
          <div className="text-[56px] leading-none font-normal tracking-tight">
            {amount}
          </div>
          <div className="bg-[var(--gp-surface-alt)] px-lg py-sm rounded-full text-label font-normal flex items-center gap-sm">
            <Building2 className="w-5 h-5 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" aria-hidden="true" />
            <span>State Bank of India •••• 4829</span>
          </div>
        </div>

        {/* Proceed to Pay Button (Min 64dp height), filled blue as narrated */}
        <div className="p-lg">
          <HighlightTarget elementId="proceed_to_pay_button" {...tp} className="w-full rounded-full">
            <div className="w-full min-h-[64px] bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center px-lg">
              {r.proceedToPay(amount)}
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 3. SECURE UPI PIN ENTRY SCREEN
  if (screen === 'gpay_upi_pin_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col justify-between" style={GP_THEME}>
        <div className="flex items-center justify-between px-lg py-xs border-b border-[color:var(--gp-border)]">
          <div className="flex items-center gap-sm">
            <Lock className="w-6 h-6 text-[color:var(--gp-brand-blue-deep)]" aria-hidden="true" />
            <span className="text-body font-bold tracking-wide">{r.upiPin}</span>
          </div>
          <span className="text-label bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-brand-blue-ink)] px-md py-xs rounded-full">
            SBI Bank
          </span>
        </div>

        <div className="flex flex-col items-center gap-xs text-center px-lg py-sm">
          <div className="text-body font-bold">
            {r.enterUpiPin}
          </div>

          {/* 4 Masked PIN Dots (dummy, nothing is typed) */}
          <div className="flex gap-xl" aria-hidden="true">
            {[1, 2, 3, 4].map((dot) => (
              <div key={dot} className="w-5 h-5 rounded-full bg-[var(--gp-ink)]" />
            ))}
          </div>

          <p className="text-label font-normal text-[color:var(--gp-ink-muted)]">
            {r.neverSharePin}
          </p>
        </div>

        {/* Numpad Simulator with Blue Checkmark */}
        {/* 16px at the sides keeps the check button's pointer badge on screen */}
        <div className="bg-[var(--gp-surface-alt)] px-lg pt-xs pb-lg">
          <div className="grid grid-cols-3 gap-1 text-center text-title">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <div
                key={num}
                onClick={onWrongTap}
                className="min-h-[64px] flex items-center justify-center rounded-xl cursor-pointer font-normal"
              >
                {num}
              </div>
            ))}
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center cursor-pointer">
              <Delete className="w-8 h-8" aria-hidden="true" />
            </div>
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center rounded-xl font-normal">
              0
            </div>

            {/* Checkmark Button */}
            <HighlightTarget elementId="pin_keypad_submit" {...tp} className="rounded-[var(--gp-r-tile)]">
              <div className="min-h-[64px] bg-[var(--gp-brand-blue)] rounded-[var(--gp-r-tile)] flex items-center justify-center">
                <Check className="w-9 h-9 text-white stroke-[3]" />
              </div>
            </HighlightTarget>
          </div>
        </div>
      </div>
    );
  }

  // 4. PAYMENT SUCCESS SCREEN
  if (screen === 'gpay_payment_success_screen') {
    return (
      <div
        className="min-h-full shrink-0 w-full bg-[var(--gp-brand-blue)] text-white flex flex-col justify-between items-center p-lg text-center"
        style={GP_THEME}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-lg">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <Check className="w-12 h-12 text-[color:var(--gp-brand-blue)] stroke-[3]" />
          </div>

          <div className="space-y-sm">
            <div className="text-[44px] leading-none font-normal tracking-tight">{amountExact}</div>
            <div className="text-title">
              {r.paidSuccessfully}
            </div>
            <div className="text-label font-normal text-white/90">
              {payeeName} • {r.upiRef} 428901847192
            </div>
          </div>

          <div className="bg-white/15 rounded-[var(--gp-r-card)] px-lg py-md text-left w-full max-w-xs space-y-xs">
            <div className="text-label text-white/85 tracking-wide">{r.debitedFrom}</div>
            <div className="text-body font-bold">State Bank of India •••• 4829</div>
          </div>
        </div>

        <HighlightTarget elementId="success_done_button" {...tp} className="w-full rounded-full mt-md">
          <div className="w-full min-h-[64px] bg-white text-[color:var(--gp-brand-blue)] text-body font-bold rounded-full flex items-center justify-center">
            {r.doneSuccess}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 5. CONTACT LIST SCREEN (rows styled like the app's transaction rows)
  if (screen === 'gpay_contact_list_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <AppBar>
          <div className="text-title">
            {r.selectContact}
          </div>
        </AppBar>

        <div className="px-lg pt-sm space-y-xs">
          <HighlightTarget elementId="contact_son_ramesh" {...tp}>
            <div className="min-h-[76px] px-sm py-sm flex items-center gap-lg">
              <LetterAvatar letter={r.rameshInitial} />
              <div className="flex-1 min-w-0">
                <div className="text-body font-semibold">
                  {r.ramesh}
                </div>
                <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">
                  {`${r.son} • +91 98765 43210`}
                </div>
              </div>
            </div>
          </HighlightTarget>

          <div onClick={onWrongTap} className="min-h-[76px] px-sm py-sm flex items-center gap-lg">
            <LetterAvatar letter={r.priyaInitial} />
            <div className="flex-1 min-w-0">
              <div className="text-body font-semibold">
                {r.priya}
              </div>
              <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">
                {r.daughter}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. CONTACT CHAT SCREEN
  if (screen === 'gpay_contact_chat_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col justify-between" style={GP_THEME}>
        {/* Tinted header: back, avatar, name and number, call (inert) */}
        <div className="bg-[var(--gp-surface-header)] flex items-center gap-md pl-lg pr-xs py-xs">
          <ArrowLeft className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <LetterAvatar letter={r.rameshInitial} />
          <div className="min-w-0 flex-1">
            <div className="text-body font-normal leading-tight break-words">
              {r.rameshSon}
            </div>
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">+91 98765 43210</div>
          </div>
          <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
            <Phone className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-lg py-md space-y-md">
          <div className="text-center space-y-xs">
            <div className="flex items-center justify-center gap-xs text-label font-normal">
              <ShieldCheck className="w-5 h-5 text-[color:var(--gp-success)] flex-shrink-0" aria-hidden="true" />
              <span>{r.bankingNameVerified}</span>
            </div>
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{r.secureTransfer}</div>
          </div>

          {/* Date separator */}
          <div className="flex items-center gap-sm" aria-hidden="true">
            <span className="flex-1 h-px bg-[var(--gp-border)]" />
            <span className="text-label font-normal text-[color:var(--gp-ink-muted)]">{r.today}</span>
            <span className="flex-1 h-px bg-[var(--gp-border)]" />
          </div>

          {/* An earlier payment from Ramesh, as a chat bubble (inert) */}
          <div
            onClick={onWrongTap}
            className={`max-w-[85%] bg-[var(--gp-surface)] rounded-[var(--gp-r-bubble)] border border-[color:var(--gp-border)] ${SOFT_SHADOW} px-lg py-md space-y-sm`}
          >
            <div className="text-body font-normal break-words">{r.moneyReceived}</div>
            <div className="text-[40px] leading-none font-normal">{'₹' + DEFAULT_PAYMENT_AMOUNT.toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-sm">
              <CheckCircle2 className="w-6 h-6 text-[color:var(--gp-success)] flex-shrink-0" aria-hidden="true" />
              <span className="text-label font-semibold flex-1 min-w-0 break-words">{`${r.completed} • ${r.today}`}</span>
              <ChevronRight className="w-5 h-5 text-[color:var(--gp-chevron)] flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Blue Pay pill and a grey Request pill, each as wide as its name; they stack when both do not fit one row */}
        <div className="flex flex-wrap gap-sm px-lg py-md bg-[var(--gp-surface)]">
          <HighlightTarget elementId="contact_pay_button" {...tp} className="flex-auto rounded-full">
            <div className="w-full min-h-[64px] bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center px-xl whitespace-nowrap">
              {r.payMoney}
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="flex-auto min-h-[64px] px-lg bg-[var(--gp-surface-alt)] text-[color:var(--gp-brand-blue-deep)] text-body font-bold rounded-full flex items-center justify-center text-center whitespace-nowrap"
          >
            {r.request}
          </div>
        </div>
      </div>
    );
  }

  // 7. BANK BALANCE DISPLAY SCREEN
  if (screen === 'gpay_balance_display_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col justify-between" style={GP_THEME}>
        <AppBar>
          <div className="text-title">
            {r.accountBalance}
          </div>
        </AppBar>

        <div className="bg-[var(--gp-surface-card)] rounded-[var(--gp-r-card)] p-xl space-y-lg mx-lg my-auto">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 bg-[var(--gp-brand-blue-soft)] rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-[color:var(--gp-brand-blue-ink)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-body font-normal">
                {MOCK_BANK_BALANCE.bankName}
              </div>
              <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">
                {MOCK_BANK_BALANCE.accountNumberMasked}
              </div>
            </div>
          </div>

          <div className="border-t border-[color:var(--gp-border)] pt-lg">
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">
              {r.availableBalance}
            </div>
            <div className="text-5xl font-normal text-[color:var(--gp-success)] mt-xs">
              {MOCK_BANK_BALANCE.balanceAmount}
            </div>
          </div>
        </div>

        <div className="p-lg">
          <HighlightTarget elementId="balance_done_button" {...tp} className="w-full rounded-full">
            <div className="w-full min-h-[64px] bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center">
              {r.doneBalance}
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 8. TRANSACTION HISTORY LIST SCREEN
  if (screen === 'gpay_history_list_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <AppBar>
          <div className="text-title">
            {r.transactionHistory}
          </div>
        </AppBar>

        <div className="px-lg pt-sm space-y-xs">
          <HighlightTarget elementId="history_item_1" {...tp}>
            <TransactionRow txn={MOCK_TRANSACTIONS[0]} language={language} />
          </HighlightTarget>

          <div onClick={onWrongTap}>
            <TransactionRow txn={MOCK_TRANSACTIONS[1]} language={language} />
          </div>
        </div>
      </div>
    );
  }

  // 9. RECEIPT DETAIL SCREEN
  if (screen === 'gpay_receipt_detail_screen') {
    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col justify-between" style={GP_THEME}>
        <div className="flex items-center justify-between gap-md px-md py-md border-b border-[color:var(--gp-border)]">
          <HighlightTarget elementId="receipt_back_button" {...tp} className="rounded-full">
            <div className="w-16 h-16 bg-[var(--gp-surface-alt)] rounded-full flex items-center justify-center">
              <ArrowLeft className="w-8 h-8" />
            </div>
          </HighlightTarget>
          <span className="text-body font-bold">
            {r.paymentReceipt}
          </span>
          <div className="w-16" />
        </div>

        <div className="bg-[var(--gp-surface-card)] rounded-[var(--gp-r-card)] p-xl space-y-xl mx-lg my-auto">
          <div className="text-center space-y-sm">
            <CheckCircle2 className="w-16 h-16 text-[color:var(--gp-success)] mx-auto" aria-hidden="true" />
            <div className="text-body font-normal">
              {MOCK_TRANSACTIONS[0].merchant[language] || MOCK_TRANSACTIONS[0].merchant.en}
            </div>
            <div className="text-5xl font-normal">
              {MOCK_TRANSACTIONS[0].amount}
            </div>
            <div className="text-label text-[color:var(--gp-success)] bg-[var(--gp-success-soft)] py-xs px-md rounded-full inline-block">
              {r.completed}
            </div>
          </div>

          <div className="border-t border-[color:var(--gp-border)] pt-lg space-y-md text-label font-normal text-[color:var(--gp-ink-muted)]">
            <div className="flex justify-between gap-md">
              <span>{r.upiRefNo}</span>
              <span className="font-bold text-[color:var(--gp-ink)]">428901847192</span>
            </div>
            <div className="flex justify-between gap-md">
              <span>{r.paymentMode}</span>
              <span className="font-bold text-[color:var(--gp-ink)] text-right">SBI Bank •••• 4829</span>
            </div>
          </div>
        </div>

        <div className="text-center text-[color:var(--gp-ink-muted)] text-label font-normal pb-lg">
          {r.mockData}
        </div>
      </div>
    );
  }

  // 10. GPAY HOME SCREEN (Default)
  return (
    <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Top: search (inert) and the learner's profile picture, on a soft band (CSS only, no image) */}
        <div
          className="flex items-center gap-sm px-lg pt-md pb-lg"
          style={{ background: 'linear-gradient(180deg, var(--gp-band) 0%, var(--gp-surface) 100%)' }}
        >
          <div
            onClick={onWrongTap}
            className={`flex-1 min-w-0 min-h-[64px] rounded-full bg-[var(--gp-surface-alt)] ${SOFT_SHADOW} flex items-center gap-md px-lg`}
          >
            <Search className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
            <span className="text-body text-[color:var(--gp-ink-muted)] truncate">{r.search}</span>
          </div>
          <div className="w-12 h-12 bg-[var(--gp-brand-blue-soft)] rounded-full flex items-center justify-center text-2xl flex-shrink-0">
            👵
          </div>
        </div>

        {/* The large Scan any QR code card at the top (the narration calls it large and at the top),
            soft blue like the app's Scan QR button */}
        <div className="px-lg">
          <HighlightTarget elementId="scan_qr_button" {...tp}>
            <div
              className={`min-h-[96px] bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-brand-blue-ink)] rounded-[var(--gp-r-tile)] ${SOFT_SHADOW} px-lg py-md flex items-center gap-lg`}
            >
              <QrCode className="w-10 h-10 flex-shrink-0" />
              <span className="text-body font-bold leading-tight break-words min-w-0">{r.scanAnyQr}</span>
            </div>
          </HighlightTarget>
        </div>

        {/* Shortcuts as full-width rows, so long single words (e.g. Malayalam കോൺടാക്റ്റുകൾക്ക്) never break */}
        <div className="px-lg pt-sm space-y-xs">
          <HighlightTarget elementId="pay_contacts_button" {...tp}>
            <Shortcut icon={Users} label={r.payContacts} />
          </HighlightTarget>

          <div onClick={onWrongTap} className="min-w-0">
            <Shortcut icon={Landmark} label={r.sendToBank} />
          </div>
        </div>

        {/* People (inert): Ramesh first. Columns are at least 88px so names wrap by word (3 per row at 360px,
            4 at 412px); the grid wraps, it never scrolls sideways */}
        <SectionTitle>{r.sectionPeople}</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-x-xs gap-y-sm px-lg">
          <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.rameshSon} onClick={onWrongTap}>
            {r.rameshInitial}
          </RoundItem>
          <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.priya} onClick={onWrongTap} dot>
            {r.priyaInitial}
          </RoundItem>
          <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.chatListDoctor} onClick={onWrongTap} dot>
            {r.chatListDoctor.charAt(0)}
          </RoundItem>
          <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.chatListFamily} onClick={onWrongTap}>
            <Users className="w-8 h-8" aria-hidden="true" />
          </RoundItem>
        </div>

        {/* Shops (inert): borderless soft cards */}
        <SectionTitle>{r.sectionShops}</SectionTitle>
        <div className="grid grid-cols-2 gap-md px-lg">
          <div onClick={onWrongTap} className="min-w-0 rounded-[var(--gp-r-card)] bg-[var(--gp-surface-card)] px-sm py-sm">
            <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.shopName}>{r.shopInitial}</RoundItem>
          </div>
          <div onClick={onWrongTap} className="min-w-0 rounded-[var(--gp-r-card)] bg-[var(--gp-surface-card)] px-sm py-sm">
            <RoundItem circleClass="bg-[var(--gp-avatar)] text-white" label={r.chatListPharmacy}>
              <Pill className="w-8 h-8" aria-hidden="true" />
            </RoundItem>
          </div>
        </div>

        {/* Pay bills (inert): soft-blue circles with dark icons */}
        <SectionTitle>{r.sectionBills}</SectionTitle>
        <div className="grid grid-cols-3 gap-x-xs px-lg">
          <RoundItem circleClass="bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-ink)]" label={r.billPhone} onClick={onWrongTap}>
            <Smartphone className="w-8 h-8" aria-hidden="true" />
          </RoundItem>
          <RoundItem circleClass="bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-ink)]" label={r.billElectricity} onClick={onWrongTap}>
            <Lightbulb className="w-8 h-8" aria-hidden="true" />
          </RoundItem>
          <RoundItem circleClass="bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-ink)]" label={r.billWater} onClick={onWrongTap}>
            <Droplet className="w-8 h-8" aria-hidden="true" />
          </RoundItem>
        </div>

        {/* Your money: history, then Check bank balance last, near the bottom (as in the app; the narration
            places the balance at the bottom and scrolls down to the history) */}
        <SectionTitle>{r.sectionMoney}</SectionTitle>
        <div className="px-lg pb-sm space-y-xs">
          <HighlightTarget elementId="transaction_history_button" {...tp}>
            <div className="min-h-[64px] px-sm py-sm flex items-center gap-lg">
              <History className="w-7 h-7 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" />
              <span className="text-body font-normal flex-1 min-w-0 break-words">{r.seeHistory}</span>
              <ChevronRight className="w-6 h-6 text-[color:var(--gp-chevron)] flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="check_balance_button" {...tp}>
            <div className="min-h-[64px] px-sm py-sm flex items-center gap-lg">
              <Landmark className="w-7 h-7 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" />
              <span className="text-body font-normal flex-1 min-w-0 break-words">{r.checkBalance}</span>
              <ChevronRight className="w-6 h-6 text-[color:var(--gp-chevron)] flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>
        </div>

        <div className="mt-auto text-center text-[color:var(--gp-ink-muted)] text-label font-normal px-lg pt-sm pb-md">
          {r.mockFooter}
        </div>
      </div>

      {/* Bottom bar (inert): Main selected */}
      <div className="flex bg-[var(--gp-surface-alt)] px-xs py-xs">
        {([
          [House, r.tabMain],
          [Landmark, r.tabBank],
          [CircleUserRound, r.tabProfile]
        ] as [React.ElementType, string][]).map(([Icon, label], i) => (
          <div key={label} onClick={onWrongTap} className="flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-xs py-xs">
            <div className={`w-16 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[var(--gp-nav-pill)]' : ''}`}>
              <Icon
                className={`w-6 h-6 ${i === 0 ? 'text-[color:var(--gp-nav-icon)]' : 'text-[color:var(--gp-ink)]'}`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`text-label text-center leading-tight ${
                i === 0 ? 'font-bold text-[color:var(--gp-ink)]' : 'font-normal text-[color:var(--gp-ink-muted)]'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
