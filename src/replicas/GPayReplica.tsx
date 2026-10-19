import React, { useState } from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import {
  MOCK_TRANSACTIONS,
  MOCK_BANK_BALANCE,
  MockTransaction,
  UPI_PAYEES,
  RECHARGE_NUMBERS,
  RECHARGE_OPERATORS,
  RECHARGE_PLANS,
  PRACTICE_BANK
} from '../config/mockData';
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
  ArrowRight,
  CircleDot,
  Image as ImageIcon,
  Send,
  Contact,
  Info,
  Share2,
  CircleQuestionMark
} from 'lucide-react';

interface GPayReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  nudgeKey?: number;
  /** Running task, used only to pick the practice payee. */
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

// Practice payment amount (rupees) when nothing was typed (the Scan QR flow); the send-money flow uses
// the amount the learner types on the number pad
const DEFAULT_PAYMENT_AMOUNT = 200;
// Number pad on the send-money amount screen: at most 6 digits (₹9,99,999)
const MAX_AMOUNT_DIGITS = 6;
const KEYPAD_ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['back', '0', 'next']];
// Fictional UPI ID of the practice contact (not a real bank handle)
const CONTACT_UPI_ID = UPI_PAYEES.find((p) => p.key === 'ramesh')!.upiId;

// The sample people of Pay anyone and Mobile recharge ('me' is the learner's own number), in a string table
type PersonKey = 'shop' | 'ramesh' | 'priya' | 'me';
const personName = (s: ReplicaStrings, key: PersonKey) =>
  key === 'shop' ? s.shopName : key === 'ramesh' ? s.ramesh : key === 'priya' ? s.priya : s.myNumber;
const personInitial = (s: ReplicaStrings, key: PersonKey) =>
  key === 'shop' ? s.shopInitial : key === 'ramesh' ? s.rameshInitial : key === 'priya' ? s.priyaInitial : s.myNumber.charAt(0);

// Pay anyone: the payees whose name (screen language or English), UPI ID or phone digits contain what was
// typed. With no match every practice payee is listed, so whatever the learner types, they can go on.
const findPayees = (query: string, s: ReplicaStrings) => {
  const text = query.trim().toLowerCase();
  if (!text) return { rows: [], matched: false, digits: false };
  const digits = /^[\d\s+]+$/.test(text) ? text.replace(/\D/g, '') : '';
  const hits = UPI_PAYEES.filter((p) =>
    digits
      ? p.phone.replace(/\D/g, '').includes(digits)
      : [personName(s, p.key), personName(REPLICA_STRINGS.en, p.key), p.upiId].some((v) => v.toLowerCase().includes(text))
  );
  return { rows: hits.length ? hits : UPI_PAYEES, matched: hits.length > 0, digits: !!digits };
};

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

// One transaction row: letter avatar, "Paid to" or "Received from" and the name, then the date with the amount
// at the right (received amounts with + and in green), so the colour is never the only cue. The amount sits on the
// date line so the words get the full width (a list of three stays short enough to be seen whole).
const TransactionRow: React.FC<{ txn: MockTransaction; language: SupportedLanguage; r: ReplicaStrings }> = ({ txn, language, r }) => {
  const name = txn.merchant[language] || txn.merchant.en;
  return (
    <div className="min-h-[64px] px-sm py-xs flex items-center gap-lg">
      <LetterAvatar letter={name.charAt(0)} />
      <div className="flex-1 min-w-0">
        <div data-history-words className="text-body font-semibold text-[color:var(--gp-ink)] leading-tight break-words">
          {txn.isCredit ? r.receivedFrom(name) : r.paidTo(name)}
        </div>
        <div className="flex items-baseline justify-between gap-md">
          <span className="text-label font-normal text-[color:var(--gp-ink-muted)] min-w-0 break-words">{txn.date[language] || txn.date.en}</span>
          <span
            data-history-amount
            className={`text-body font-semibold flex-shrink-0 ${
              txn.isCredit ? 'text-[color:var(--gp-success)]' : 'text-[color:var(--gp-ink)]'
            }`}
          >
            {txn.isCredit ? `+ ${txn.amount}` : txn.amount}
          </span>
        </div>
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
  // Digits typed on the amount screen's number pad. Kept only while the practice runs (the replica
  // unmounts on the completion screen and on Exit); nothing is stored.
  const [typed, setTyped] = useState('');
  // Indian digit grouping, e.g. ₹1,000, ₹9,99,999 and ₹1,000.00
  const amountValue = typed ? Number(typed) : DEFAULT_PAYMENT_AMOUNT;
  const amount = '₹' + amountValue.toLocaleString('en-IN');
  const amountExact = '₹' + amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // What the learner types and picks in the Pay anyone, recharge, bank transfer and history practice. Like the
  // amount, kept only while the practice runs: never stored, logged or sent.
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<PersonKey | null>(null);
  const [bankForm, setBankForm] = useState({ account: false, bank: false });
  const [txnIndex, setTxnIndex] = useState(0);

  const payee = (taskId && PAYEES[taskId]) || SHOP_PAYEE;
  // Pay anyone and Mobile recharge pay whoever was picked; Bank transfer pays Ramesh's practice account
  const flowPerson: PersonKey | null =
    taskId === 'gpay_pay_upi_or_phone' ? picked || 'shop'
    : taskId === 'gpay_recharge_mobile' ? picked || 'me'
    : taskId === 'gpay_bank_transfer' ? 'ramesh'
    : null;
  const payeeName = flowPerson ? personName(r, flowPerson) : r[payee.nameKey];
  const payeeInitial = flowPerson ? personInitial(r, flowPerson) : r[payee.initialKey];
  // Who the amount screen names: the contact flow keeps its Ramesh header; Pay anyone shows the payee's UPI ID
  // (no banking-name line: a long shop name would push the number pad into scrolling), Bank transfer the
  // practice bank account
  const keypadPayee: { initial: string; title: string; banking?: string; detail: string } =
    taskId === 'gpay_pay_upi_or_phone'
      ? { initial: payeeInitial, title: r.paying(payeeName), detail: UPI_PAYEES.find((p) => p.key === flowPerson)?.upiId || '' }
      : taskId === 'gpay_bank_transfer'
        ? {
            initial: payeeInitial,
            title: r.paying(payeeName),
            banking: r.bankingName(payeeName),
            detail: `${PRACTICE_BANK.name} ${PRACTICE_BANK.accountMasked}`
          }
        : { initial: r.rameshInitial, title: r.payingRamesh, banking: r.bankingName(r.ramesh), detail: r.upiId(CONTACT_UPI_ID) };

  // "Select payment method" sheet over a dimmed screen: the mock bank, a balance link (inert) and the blue Pay button
  const paymentSheet = (
    <div className="absolute inset-0 bg-black/50 flex flex-col justify-end">
      <div className="screen-enter bg-[var(--gp-surface)] rounded-t-[28px] px-lg pt-sm pb-md space-y-md">
        <div className="w-10 h-1 bg-[var(--gp-border)] rounded-full mx-auto" aria-hidden="true" />
        <div className="text-[24px] leading-[30px] font-bold break-words">{r.selectPaymentMethod}</div>
        <div className="min-h-[64px] flex items-center gap-md">
          <div className="w-12 h-12 bg-[var(--gp-brand-blue-soft)] rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-[color:var(--gp-brand-blue-ink)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-normal leading-tight break-words">{MOCK_BANK_BALANCE.bankName}</div>
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">•••• 4829</div>
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)] break-words">
              {r.balanceLabel} <span className="font-bold text-[color:var(--gp-brand-blue-deep)]">{r.checkNow}</span>
            </div>
          </div>
          <CircleDot className="w-7 h-7 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" aria-hidden="true" />
        </div>
        <HighlightTarget elementId="paymethod_pay_button" {...tp} className="w-full rounded-full">
          <div className="w-full min-h-[64px] bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center px-lg text-center">
            {r.payAmount(amount)}
          </div>
        </HighlightTarget>
        <div className="flex items-center justify-center gap-sm text-label font-bold text-[color:var(--gp-ink-muted)]" aria-hidden="true">
          <Landmark className="w-5 h-5 flex-shrink-0" />
          <span>UPI</span>
        </div>
      </div>
    </div>
  );

  // A row of a ringed list: on the list's step any row completes it (after noting the choice); otherwise a nudge
  const listRow = (listId: string, choose: () => void) => () => {
    if (highlightElement !== listId) return onWrongTap();
    choose();
    onCorrectTap();
  };

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

  // 2. AMOUNT ENTRY SCREEN (Scan QR flow; fixed amount and Proceed to Pay)
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

  // 2a. SEND-MONEY AMOUNT SCREEN WITH THE NUMBER PAD, and 2b. its "Select payment method" sheet over it, dimmed
  if (screen === 'gpay_amount_keypad_screen' || screen === 'gpay_payment_method_sheet') {
    const sheet = screen === 'gpay_payment_method_sheet';
    // The arrow is the target only once an amount is typed; until then the ring stays on the keypad
    const keypadTp = {
      ...tp,
      activeHighlightId: sheet ? '' : highlightElement === 'amount_next_button' && !typed ? 'amount_keypad' : highlightElement
    };
    // Keys type silently on both amount steps (never a nudge); the first digit completes the "type" step.
    // No leading zero, at most 6 digits. Next is not the step's button: it nudges, only the arrow advances.
    const pressKey = (key: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (key === 'next') return onWrongTap();
      let next = typed;
      if (key === 'back') next = typed.slice(0, -1);
      else if (!(key === '0' && !typed) && typed.length < MAX_AMOUNT_DIGITS) next = typed + key;
      setTyped(next);
      if (highlightElement === 'amount_keypad' && next) onCorrectTap();
    };

    // overflow-hidden: the tall keypad's pulsing ring may not stretch the practice screen into scrolling
    return (
      <div className="relative min-h-full shrink-0 w-full overflow-hidden bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        {/* Close (inert), avatar, who is paid: name, banking name and UPI ID */}
        <div className="flex items-start gap-sm pl-xs pr-lg pt-xs">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <X className="w-7 h-7" aria-hidden="true" />
          </div>
          <LetterAvatar letter={keypadPayee.initial} />
          <div className="min-w-0 flex-1">
            <div data-keypad-payee className="text-body font-normal leading-tight break-words">{keypadPayee.title}</div>
            {keypadPayee.banking && (
              <div className="text-label font-normal text-[color:var(--gp-ink-muted)] flex items-center gap-xs">
                <ShieldCheck className="w-5 h-5 text-[color:var(--gp-success)] flex-shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{keypadPayee.banking}</span>
              </div>
            )}
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)] break-words">{keypadPayee.detail}</div>
          </div>
        </div>

        {/* The amount fills as digits are typed (a grey 0 while empty) */}
        <div className="text-[48px] leading-[56px] font-normal tracking-tight text-center px-lg pt-xs" data-amount={typed}>
          ₹{typed ? Number(typed).toLocaleString('en-IN') : <span className="text-[color:var(--gp-ink-muted)]">0</span>}
        </div>

        {/* Add note (inert) under the amount; the blue arrow at the right, grey and inactive until a digit is typed */}
        <div className="flex items-center gap-md px-lg pt-xs">
          <div className="w-16 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="bg-[var(--gp-surface-alt)] px-lg py-xs rounded-full text-label font-normal text-center break-words">{r.addNote}</div>
          </div>
          <HighlightTarget elementId="amount_next_button" {...keypadTp} className="rounded-[var(--gp-r-tile)] flex-shrink-0">
            <div
              aria-disabled={!typed}
              className={`w-16 h-16 rounded-[var(--gp-r-tile)] flex items-center justify-center ${
                typed ? 'bg-[var(--gp-brand-blue)] text-white' : 'bg-[var(--gp-surface-alt)] text-[color:var(--gp-ink-muted)]'
              }`}
            >
              <ArrowRight className="w-8 h-8 stroke-[2.5]" />
            </div>
          </HighlightTarget>
        </div>

        {/* Number pad at the bottom: rows share the room left, 52 to 64px each; below 52px the practice screen
            scrolls instead (16px at the sides keeps the pointer badge on screen) */}
        <div className="flex-1 flex flex-col justify-end px-lg pt-lg pb-lg">
          <HighlightTarget elementId="amount_keypad" {...keypadTp} className="flex-1 max-h-[276px] flex flex-col rounded-[var(--gp-r-tile)]">
            {/* Taps between keys do nothing (no nudge, no step) */}
            <div onClick={(e) => e.stopPropagation()} className="flex-1 flex flex-col gap-1 p-xs bg-[var(--gp-surface-alt)] rounded-[var(--gp-r-tile)]">
              {KEYPAD_ROWS.map((row) => (
                <div key={row.join()} className="flex-1 min-h-[52px] max-h-[64px] flex gap-1">
                  {row.map((key) => (
                    <div
                      key={key}
                      data-key={key}
                      onClick={pressKey(key)}
                      className={`flex-1 min-w-0 flex items-center justify-center rounded-xl cursor-pointer ${
                        key === 'next'
                          ? 'bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-brand-blue-ink)] text-label font-bold text-center'
                          : 'text-title font-normal'
                      }`}
                    >
                      {key === 'back' ? <Delete className="w-8 h-8" aria-hidden="true" /> : key === 'next' ? r.keyNext : key}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </HighlightTarget>
        </div>

        {/* 2b. Payment method sheet */}
        {sheet && paymentSheet}
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

  // 8. TRANSACTION HISTORY: a note on what "Received from" means (its Got it button only on the reading step),
  // then the payments. Any payment opens its details; on the reading step a payment is not the step (a nudge).
  if (screen === 'gpay_history_list_screen') {
    return (
      <div className="min-h-full shrink-0 w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <AppBar>
          <div className="text-title">
            {r.transactionHistory}
          </div>
        </AppBar>

        <div data-history-note className="mx-lg rounded-[var(--gp-r-card)] bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-brand-blue-ink)] px-md py-sm space-y-sm">
          <div className="flex items-start gap-sm">
            <Info className="w-6 h-6 flex-shrink-0 mt-[2px]" aria-hidden="true" />
            <p className="text-label font-normal leading-snug min-w-0 break-words">{r.historyNote}</p>
          </div>
          {highlightElement === 'history_note_ok' && (
            <div className="flex justify-end">
              <HighlightTarget elementId="history_note_ok" {...tp} className="rounded-full">
                <div className="min-h-[64px] min-w-[96px] px-lg bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center">
                  {r.gotIt}
                </div>
              </HighlightTarget>
            </div>
          )}
        </div>

        <div className="px-lg pt-sm pb-md">
          <HighlightTarget elementId="history_list" {...tp}>
            {/* Taps between rows do nothing */}
            <div onClick={(e) => e.stopPropagation()}>
              {MOCK_TRANSACTIONS.map((txn, i) => (
                <div
                  key={txn.id}
                  data-history-row={txn.id}
                  data-credit={txn.isCredit}
                  onClick={listRow('history_list', () => setTxnIndex(i))}
                  className="cursor-pointer"
                >
                  <TransactionRow txn={txn} language={language} r={r} />
                </div>
              ))}
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 9. PAYMENT DETAILS (result screen of the history task): who, which way, the amount, its status and date,
  // the reference and bank from the sample data. Read-only: the buttons are inert.
  if (screen === 'gpay_history_detail_screen') {
    const txn = MOCK_TRANSACTIONS[txnIndex];
    const name = txn.merchant[language] || txn.merchant.en;
    return (
      <div
        data-history-detail={txn.id}
        className="min-h-full shrink-0 w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col items-center px-lg pb-md text-center"
        style={GP_THEME}
      >
        <div className="w-full flex items-center justify-between py-sm" aria-hidden="true">
          <ArrowLeft className="w-7 h-7" />
          <MoreVertical className="w-7 h-7" />
        </div>
        <LetterAvatar letter={name.charAt(0)} size="lg" />
        <div data-detail-words className="text-body font-normal mt-sm break-words">
          {txn.isCredit ? r.receivedFrom(name) : r.paidTo(name)}
        </div>
        <div
          data-detail-amount
          className={`text-[48px] leading-[56px] font-normal tracking-tight ${
            txn.isCredit ? 'text-[color:var(--gp-success)]' : 'text-[color:var(--gp-ink)]'
          }`}
        >
          {txn.isCredit ? `+ ${txn.amount}` : txn.amount}
        </div>
        {!txn.isCredit && (
          <div className="mt-xs min-h-[64px] px-xl bg-[var(--gp-brand-blue)] text-white text-body font-bold rounded-full flex items-center justify-center">
            {r.payAgain}
          </div>
        )}
        <div className="mt-sm flex items-center justify-center gap-xs text-label font-normal">
          <CheckCircle2 className="w-6 h-6 text-[color:var(--gp-success)] flex-shrink-0" aria-hidden="true" />
          <span>{r.completed}</span>
        </div>
        <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{txn.date[language] || txn.date.en}</div>

        <div className="w-full mt-md bg-[var(--gp-surface-card)] rounded-[var(--gp-r-card)] border border-[color:var(--gp-border)] p-md space-y-sm text-left text-label font-normal">
          <div>
            <div className="text-[color:var(--gp-ink-muted)]">{r.upiRefNo}</div>
            <div className="font-bold break-words">{txn.upiRef}</div>
          </div>
          <div>
            <div className="text-[color:var(--gp-ink-muted)]">{txn.isCredit ? r.creditedTo : r.paidFrom}</div>
            <div className="font-bold break-words">{`${MOCK_BANK_BALANCE.bankName} ${MOCK_BANK_BALANCE.accountNumberMasked}`}</div>
          </div>
        </div>

        <div className="w-full mt-md flex flex-wrap gap-sm justify-center">
          <div className="min-h-[64px] px-lg rounded-full border border-[color:var(--gp-border)] text-[color:var(--gp-brand-blue-deep)] text-label font-bold flex items-center gap-sm">
            <Share2 className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{r.share}</span>
          </div>
          <div className="min-h-[64px] px-lg rounded-full border border-[color:var(--gp-border)] text-[color:var(--gp-brand-blue-deep)] text-label font-bold flex items-center gap-sm">
            <CircleQuestionMark className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{r.havingIssues}</span>
          </div>
        </div>
        <div className="mt-md text-label font-normal text-[color:var(--gp-ink-muted)]">{r.mockData}</div>
      </div>
    );
  }

  // 10. PAY ANYONE: a real text field, so the phone's own keyboard opens. Typing lists the practice payees by
  // name, UPI ID or phone digits (all of them when nothing matches); the first character completes the "type"
  // step and any payee in the list can be picked. Under 480px tall (keyboard open) the screen tightens.
  if (screen === 'gpay_pay_anyone_screen') {
    const found = findPayees(query, r);
    const typed = query.trim() !== '';
    // The ring is on the list once something is typed; with an empty box it goes back to the field
    const payTp = {
      ...tp,
      activeHighlightId: highlightElement === 'payanyone_results' && !typed ? 'payanyone_input' : highlightElement
    };
    const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (highlightElement === 'payanyone_input' && e.target.value.trim()) onCorrectTap();
    };

    return (
      <div className="h-full w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <div className="px-lg pt-md [@media(max-height:480px)]:pt-xs">
          <HighlightTarget elementId="payanyone_input" {...payTp} className="rounded-full">
            {/* Taps on the field only focus it: never a nudge, never a step */}
            <div onClick={(e) => e.stopPropagation()} className="min-h-[64px] rounded-full border border-[color:var(--gp-border)] bg-[var(--gp-surface)] flex items-center pl-xs">
              <div onClick={onWrongTap} className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-7 h-7" aria-hidden="true" />
              </div>
              <input
                data-payanyone-input
                type="text"
                inputMode="text"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                aria-label={r.payAnyoneField}
                placeholder={r.payAnyoneField}
                value={query}
                onChange={onType}
                className={`flex-1 min-w-0 min-h-[48px] bg-transparent outline-none select-text text-body text-[color:var(--gp-ink)] placeholder:text-[color:var(--gp-ink-muted)] ${query ? '' : 'pr-lg'}`}
              />
              {query && (
                // Keeps the keyboard open (focus stays in the field)
                <button
                  type="button"
                  aria-label={r.clearField}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setQuery('')}
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-7 h-7 text-[color:var(--gp-ink-muted)]" aria-hidden="true" />
                </button>
              )}
            </div>
          </HighlightTarget>
        </div>

        {/* Practice line (inert): any name or number will do. With the keyboard open it keeps to one line. */}
        <p
          data-payanyone-practice
          className="text-label font-normal text-[color:var(--gp-ink-muted)] px-lg pt-xs leading-snug [@media(max-height:480px)]:pt-0 [@media(max-height:480px)]:line-clamp-1"
        >
          {r.payAnyonePractice}
        </p>

        <div className="flex-1 min-h-0 flex flex-col px-lg pt-xs pb-md [@media(max-height:480px)]:pt-0 [@media(max-height:480px)]:pb-xs">
          {typed && (
            <HighlightTarget elementId="payanyone_results" {...payTp} className="flex-1 min-h-0 flex flex-col">
              {/* Any payee in the list can be picked; taps between rows do nothing */}
              <div onClick={(e) => e.stopPropagation()} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {found.matched ? (
                  <div className="text-label font-bold text-[color:var(--gp-ink-muted)] px-sm pt-xs [@media(max-height:480px)]:hidden">{r.payAnyoneResults}</div>
                ) : (
                  <div data-payanyone-nomatch className="text-label font-bold text-[color:var(--gp-ink-muted)] px-sm pt-xs">{r.payAnyoneNoMatch}</div>
                )}
                {found.rows.map((p) => (
                  <div
                    key={p.key}
                    data-payanyone-row={p.key}
                    onClick={listRow('payanyone_results', () => setPicked(p.key))}
                    className="min-h-[64px] px-sm py-xs flex items-center gap-lg cursor-pointer"
                  >
                    <LetterAvatar letter={personInitial(r, p.key)} />
                    <div className="min-w-0">
                      <div className="text-body font-semibold break-words">{personName(r, p.key)}</div>
                      <div className="text-label font-normal text-[color:var(--gp-ink-muted)] break-words">{found.digits ? p.phone : p.upiId}</div>
                    </div>
                  </div>
                ))}
              </div>
            </HighlightTarget>
          )}
        </div>
      </div>
    );
  }

  // 11. MOBILE RECHARGE: the number field (inert), "My recharges" (any number can be picked) and the invented
  // operators (inert)
  if (screen === 'gpay_recharge_screen') {
    return (
      <div className="min-h-full shrink-0 w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col pb-md" style={GP_THEME}>
        <AppBar>
          <div className="text-title">{r.mobileRecharge}</div>
        </AppBar>

        <div className="px-lg">
          <div className="text-label font-bold text-[color:var(--gp-ink-muted)] pb-xs">{r.enterMobileNumber}</div>
          <div onClick={onWrongTap} className="min-h-[64px] rounded-xl border border-[color:var(--gp-border)] px-md flex items-center gap-sm">
            <span className="text-body text-[color:var(--gp-ink-muted)] flex-1">+91</span>
            <Contact className="w-7 h-7 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" aria-hidden="true" />
          </div>
        </div>

        <SectionTitle>{r.myRecharges}</SectionTitle>
        <div className="px-lg">
          <HighlightTarget elementId="recharge_numbers" {...tp}>
            <div onClick={(e) => e.stopPropagation()}>
              {RECHARGE_NUMBERS.map((n) => (
                <div
                  key={n.key}
                  data-recharge-row={n.key}
                  onClick={listRow('recharge_numbers', () => setPicked(n.key))}
                  className="min-h-[76px] px-sm py-sm flex items-center gap-lg cursor-pointer"
                >
                  {n.key === 'me' ? (
                    <div className="w-12 h-12 rounded-full bg-[var(--gp-brand-blue-soft)] flex items-center justify-center flex-shrink-0">
                      <CircleUserRound className="w-7 h-7 text-[color:var(--gp-brand-blue-ink)]" aria-hidden="true" />
                    </div>
                  ) : (
                    <LetterAvatar letter={personInitial(r, n.key)} />
                  )}
                  <div className="min-w-0">
                    <div className="text-body font-semibold break-words">{personName(r, n.key)}</div>
                    <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{n.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </HighlightTarget>
        </div>

        <SectionTitle>{r.mobileOperators}</SectionTitle>
        <div className="px-lg space-y-xs">
          {RECHARGE_OPERATORS.map((op) => (
            <div key={op} onClick={onWrongTap} className="min-h-[64px] px-sm flex items-center gap-lg">
              <div className="w-12 h-12 rounded-full bg-[var(--gp-surface-alt)] flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7 text-[color:var(--gp-ink-muted)]" aria-hidden="true" />
              </div>
              <span className="text-body font-normal min-w-0 break-words">{r.prepaid(op)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11a. RECHARGE PLANS for the picked number (any plan can be picked; its price becomes the amount), and
  // 11b. the payment method sheet over them, dimmed
  if (screen === 'gpay_recharge_plans' || screen === 'gpay_recharge_paysheet') {
    const person = flowPerson || 'me';
    const number = RECHARGE_NUMBERS.find((n) => n.key === person) || RECHARGE_NUMBERS[0];
    const planName = { basic: r.planBasic, value: r.planValue, long: r.planLong };
    return (
      <div className="relative h-full w-full overflow-hidden bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <div className="flex items-center gap-md px-lg py-sm">
          <ArrowLeft className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div data-recharge-for className="text-body font-normal leading-tight break-words">{personName(r, person)}</div>
            <div className="text-label font-normal text-[color:var(--gp-ink-muted)] break-words">{`${number.phone} • ${r.prepaid(RECHARGE_OPERATORS[0])}`}</div>
          </div>
        </div>
        {/* Room under the label for the list's ring */}
        <div className="text-label font-bold text-[color:var(--gp-ink-muted)] px-lg pb-md">{r.recommendedPlans}</div>

        <div className="flex-1 min-h-0 flex flex-col px-lg pb-md">
          <HighlightTarget elementId="recharge_plans" {...tp} className="flex-1 min-h-0 flex flex-col">
            <div onClick={(e) => e.stopPropagation()} className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-sm p-xs">
              {RECHARGE_PLANS.map((plan) => (
                <div
                  key={plan.key}
                  data-recharge-plan={plan.key}
                  onClick={listRow('recharge_plans', () => setTyped(String(plan.price)))}
                  className="min-h-[64px] rounded-[var(--gp-r-card)] border border-[color:var(--gp-border)] px-md py-sm flex items-center gap-md cursor-pointer"
                >
                  <div className="text-title font-bold flex-shrink-0">{'₹' + plan.price}</div>
                  <div className="min-w-0">
                    <div className="text-body font-semibold break-words">{planName[plan.key]}</div>
                    <div className="text-label font-normal text-[color:var(--gp-ink-muted)] break-words">{r.planDetails(plan.days, plan.gbPerDay)}</div>
                  </div>
                </div>
              ))}
            </div>
          </HighlightTarget>
        </div>

        {screen === 'gpay_recharge_paysheet' && paymentSheet}
      </div>
    );
  }

  // 12. BANK TRANSFER, "To others": tapping the account field fills in the practice account (nothing is typed),
  // Search for IFSC opens the bank list, and Continue turns blue once both are filled. "To self" is inert.
  if (screen === 'gpay_bank_transfer_form') {
    const ready = bankForm.account && bankForm.bank;
    return (
      <div className="min-h-full shrink-0 w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col pb-md" style={GP_THEME}>
        <AppBar>
          <div className="text-title">{r.bankTransfer}</div>
        </AppBar>

        <div className="flex border-b border-[color:var(--gp-border)]">
          <div className="flex-1 min-w-0 min-h-[56px] px-sm flex items-center justify-center text-center text-label font-bold text-[color:var(--gp-brand-blue-deep)] border-b-[3px] border-[color:var(--gp-brand-blue-deep)]">
            {r.toOthers}
          </div>
          <div onClick={onWrongTap} data-bank-to-self className="flex-1 min-w-0 min-h-[56px] px-sm flex items-center justify-center text-center text-label font-normal text-[color:var(--gp-ink-muted)]">
            {r.toSelf}
          </div>
        </div>

        <div className="px-lg pt-md space-y-md">
          <div className="text-body font-bold">{r.receiver}</div>

          <HighlightTarget elementId="bank_account_field" {...tp} className="rounded-xl">
            <div
              data-bank-account
              onClick={() => highlightElement === 'bank_account_field' && setBankForm((f) => ({ ...f, account: true }))}
              className="min-h-[64px] rounded-xl border border-[color:var(--gp-border)] px-md py-xs flex flex-col justify-center"
            >
              {bankForm.account ? (
                <>
                  <span className="text-label font-normal text-[color:var(--gp-ink-muted)]">{r.accountNumberField}</span>
                  <span className="text-body font-normal">{PRACTICE_BANK.accountMasked}</span>
                </>
              ) : (
                <span className="text-body font-normal text-[color:var(--gp-ink-muted)]">{r.accountNumberField}</span>
              )}
            </div>
          </HighlightTarget>

          <div onClick={onWrongTap} className="min-h-[64px] rounded-xl border border-[color:var(--gp-border)] pl-md pr-xs flex items-center gap-sm">
            <div data-bank-ifsc className="flex-1 min-w-0">
              {bankForm.bank ? (
                <>
                  <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{r.ifscField}</div>
                  <div className="text-body font-normal">{PRACTICE_BANK.ifsc}</div>
                </>
              ) : (
                <span className="text-body font-normal text-[color:var(--gp-ink-muted)] break-words">{r.ifscField}</span>
              )}
            </div>
            <HighlightTarget elementId="ifsc_search_link" {...tp} className="rounded-full flex-shrink-0">
              <div className="min-h-[64px] px-sm rounded-full flex items-center text-center text-label font-bold text-[color:var(--gp-brand-blue-deep)]">
                {r.searchIfsc}
              </div>
            </HighlightTarget>
          </div>

          {bankForm.bank && (
            <div data-bank-chosen className="space-y-xs text-label font-normal">
              <div className="flex items-center gap-sm">
                <Building2 className="w-5 h-5 text-[color:var(--gp-brand-blue-deep)] flex-shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{PRACTICE_BANK.name}</span>
              </div>
              {bankForm.account && (
                <div className="flex items-center gap-sm">
                  <ShieldCheck className="w-5 h-5 text-[color:var(--gp-success)] flex-shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words">{r.bankingName(r.ramesh)}</span>
                </div>
              )}
            </div>
          )}

          <HighlightTarget elementId="bank_continue_button" {...tp} className="w-full rounded-full">
            <div
              aria-disabled={!ready}
              className={`w-full min-h-[64px] rounded-full flex items-center justify-center px-lg text-body font-bold ${
                ready ? 'bg-[var(--gp-brand-blue)] text-white' : 'bg-[var(--gp-surface-alt)] text-[color:var(--gp-ink-muted)]'
              }`}
            >
              {r.continueLabel}
            </div>
          </HighlightTarget>

          <p className="text-label font-normal text-[color:var(--gp-ink-muted)] text-center">{r.bankPracticeNote}</p>
        </div>
      </div>
    );
  }

  // 12a. BANK LIST (from Search for IFSC): the search box is inert; Practice Bank fills in the IFSC code
  if (screen === 'gpay_bank_list') {
    return (
      <div className="min-h-full shrink-0 w-full bg-[var(--gp-surface)] text-[color:var(--gp-ink)] flex flex-col" style={GP_THEME}>
        <AppBar>
          <div className="text-title">{r.chooseBank}</div>
        </AppBar>
        <div className="px-lg">
          <div onClick={onWrongTap} className="min-h-[64px] rounded-full bg-[var(--gp-surface-alt)] flex items-center gap-md px-lg">
            <Search className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
            <span className="text-body text-[color:var(--gp-ink-muted)] min-w-0 break-words">{r.searchBank}</span>
          </div>
        </div>
        <div className="px-lg pt-md">
          <HighlightTarget elementId="practice_bank_row" {...tp}>
            <div
              onClick={() => highlightElement === 'practice_bank_row' && setBankForm((f) => ({ ...f, bank: true }))}
              className="min-h-[76px] px-sm py-sm flex items-center gap-lg"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--gp-brand-blue-soft)] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-[color:var(--gp-brand-blue-ink)]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-body font-semibold break-words">{PRACTICE_BANK.name}</div>
                <div className="text-label font-normal text-[color:var(--gp-ink-muted)]">{PRACTICE_BANK.ifsc}</div>
              </div>
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 13. GPAY HOME SCREEN (Default)
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

          <HighlightTarget elementId="pay_anyone_button" {...tp}>
            <Shortcut icon={Send} label={r.payAnyone} />
          </HighlightTarget>

          <HighlightTarget elementId="bank_transfer_button" {...tp}>
            <Shortcut icon={Landmark} label={r.bankTransfer} />
          </HighlightTarget>
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

        {/* Pay bills: soft-blue circles with dark icons; Mobile recharge opens the recharge, the others are inert.
            Columns are at least 120px so the widest single word (Malayalam മൊബൈൽ, 119px) never breaks */}
        <SectionTitle>{r.sectionBills}</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-xs gap-y-sm px-lg">
          <HighlightTarget elementId="mobile_recharge_button" {...tp} className="min-w-0">
            <RoundItem circleClass="bg-[var(--gp-brand-blue-soft)] text-[color:var(--gp-ink)]" label={r.mobileRecharge}>
              <Smartphone className="w-8 h-8" aria-hidden="true" />
            </RoundItem>
          </HighlightTarget>
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
