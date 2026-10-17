import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { MOCK_CONTACTS, MOCK_TRANSACTIONS, MOCK_BANK_BALANCE } from '../config/mockData';
import { REPLICA_STRINGS, ReplicaStrings } from './replicaStrings';
import { PhoneHomeScreen } from './WhatsAppReplica';
import {
  QrCode,
  Users,
  Building2,
  Receipt,
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
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
  Phone
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

// Practice payment amount (rupees) per task, matching its narration; other flows use the default
const PAYMENT_AMOUNTS: Record<string, number> = { gpay_send_contact: 1000 };
const DEFAULT_PAYMENT_AMOUNT = 200;

// Who the practice payment goes to, per task; other flows pay the shop.
// The shop shows a "Banking Name Verified" line; a contact shows their phone number instead.
// Names and initials come from the replica string table, so they follow the practice-screen language.
interface Payee {
  nameKey: 'shopName' | 'rameshSon';
  initialKey: 'shopInitial' | 'rameshInitial';
  color: string;
  phone?: string;
}
const SHOP_PAYEE: Payee = { nameKey: 'shopName', initialKey: 'shopInitial', color: '#E37400' };
const PAYEES: Record<string, Payee> = {
  gpay_send_contact: { nameKey: 'rameshSon', initialKey: 'rameshInitial', color: '#1E8E3E', phone: '+91 98765 43210' }
};

// Home shortcut: light-blue rounded square with a dark-blue icon and its name below
const Shortcut: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-sm px-xs py-sm text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#D3E3FD] flex items-center justify-center">
      <Icon className="w-8 h-8 text-[#0B57D0]" aria-hidden="true" />
    </div>
    <span className="text-label font-semibold text-ink leading-tight">{label}</span>
  </div>
);

// Simple light app bar used by most Google Pay screens
const AppBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white flex items-center gap-md px-lg py-md border-b border-[#DADCE0]">
    <ArrowLeft className="w-7 h-7 text-ink flex-shrink-0" aria-hidden="true" />
    {children}
  </div>
);

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

  // 1. QR SCANNER VIEWFINDER SCREEN
  if (screen === 'gpay_qr_scanner_viewfinder') {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col justify-between items-center">
        {/* Top: close, torch and menu (inert) */}
        <div className="w-full flex items-center justify-between px-sm">
          <div className="w-16 h-16 flex items-center justify-center">
            <X className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <Flashlight className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <MoreVertical className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Viewfinder Frame with Shop QR Code: four coloured corner brackets */}
        <div className="flex flex-col items-center px-lg">
          <HighlightTarget elementId="qr_target_box" {...tp} className="rounded-[28px]">
            <div className="w-64 h-64 rounded-[28px] bg-[#121212] flex flex-col items-center justify-center p-lg relative">
              <span className="absolute top-2 left-2 w-11 h-11 border-t-[5px] border-l-[5px] border-[#EA4335] rounded-tl-2xl" aria-hidden="true" />
              <span className="absolute top-2 right-2 w-11 h-11 border-t-[5px] border-r-[5px] border-[#FBBC04] rounded-tr-2xl" aria-hidden="true" />
              <span className="absolute bottom-2 left-2 w-11 h-11 border-b-[5px] border-l-[5px] border-[#4285F4] rounded-bl-2xl" aria-hidden="true" />
              <span className="absolute bottom-2 right-2 w-11 h-11 border-b-[5px] border-r-[5px] border-[#34A853] rounded-br-2xl" aria-hidden="true" />
              <div className="bg-white rounded-xl p-sm">
                <QrCode className="w-32 h-32 text-ink" />
              </div>
              <div className="bg-gpay-blue text-white text-label px-md py-xs rounded-full mt-md">
                {r.shopName}
              </div>
            </div>
          </HighlightTarget>

          <p className="text-body text-white font-bold mt-lg text-center">
            {r.pointCamera}
          </p>
        </div>

        {/* Bottom sheet with a handle */}
        <div className="w-full bg-[#303134] rounded-t-[28px] px-lg pt-sm pb-lg text-center">
          <div className="w-10 h-1 bg-white/60 rounded-full mx-auto mb-sm" aria-hidden="true" />
          <div className="text-body font-bold text-white">{r.scanShopQr}</div>
          <div className="text-label font-normal text-white/80">{r.sandboxFooter}</div>
        </div>
      </div>
    );
  }

  // 2. AMOUNT ENTRY SCREEN
  if (screen === 'gpay_amount_entry_screen') {
    return (
      <div className="h-full w-full bg-white text-ink flex flex-col justify-between">
        <AppBar>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: payee.color }}
          >
            {payeeInitial}
          </div>
          <div className="min-w-0">
            <div className="text-body font-bold leading-tight">
              {payeeName}
            </div>
            {payee.phone ? (
              <div className="text-label font-normal text-ink-muted">{payee.phone}</div>
            ) : (
              <div className="text-label font-normal text-ink-muted flex items-center gap-xs">
                <BadgeCheck className="w-5 h-5 text-gpay-blue flex-shrink-0" aria-hidden="true" />
                <span>{r.bankingNameVerified}</span>
              </div>
            )}
          </div>
        </AppBar>

        <div className="flex flex-col items-center my-auto gap-md px-xl">
          <span className="text-body text-ink-muted">
            {r.payingAmount}
          </span>
          <div className="text-6xl font-bold text-ink tracking-tight">
            {amount}
          </div>
          <div className="bg-gpay-light-blue text-ink px-lg py-sm rounded-full text-label flex items-center gap-sm">
            <Building2 className="w-5 h-5 text-gpay-blue flex-shrink-0" aria-hidden="true" />
            <span>State Bank of India •••• 4829</span>
          </div>
        </div>

        {/* Proceed to Pay Button (Min 64dp height) */}
        <div className="p-lg">
          <HighlightTarget elementId="proceed_to_pay_button" {...tp} className="w-full rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center px-lg">
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
      <div className="h-full w-full bg-white text-ink flex flex-col justify-between">
        <div className="flex items-center justify-between px-lg py-xs border-b border-[#DADCE0]">
          <div className="flex items-center gap-sm">
            <Lock className="w-6 h-6 text-gpay-blue" aria-hidden="true" />
            <span className="text-body font-bold tracking-wide">{r.upiPin}</span>
          </div>
          <span className="text-label bg-gpay-light-blue text-gpay-dark-blue px-md py-xs rounded-full">
            SBI Bank
          </span>
        </div>

        <div className="flex flex-col items-center gap-xs text-center px-lg py-sm">
          <div className="text-body font-bold text-ink">
            {r.enterUpiPin}
          </div>

          {/* 4 Masked PIN Dots (dummy, nothing is typed) */}
          <div className="flex gap-xl" aria-hidden="true">
            {[1, 2, 3, 4].map((dot) => (
              <div key={dot} className="w-5 h-5 rounded-full bg-ink" />
            ))}
          </div>

          <p className="text-label font-normal text-ink-muted">
            {r.neverSharePin}
          </p>
        </div>

        {/* Numpad Simulator with Blue Checkmark */}
        {/* 16px at the sides keeps the check button's pointer badge on screen */}
        <div className="bg-[#F1F3F4] px-lg pt-xs pb-lg border-t border-[#DADCE0]">
          <div className="grid grid-cols-3 gap-1 text-center text-title">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <div
                key={num}
                onClick={onWrongTap}
                className="min-h-[64px] flex items-center justify-center rounded-xl cursor-pointer text-ink"
              >
                {num}
              </div>
            ))}
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center cursor-pointer text-ink">
              <Delete className="w-8 h-8" aria-hidden="true" />
            </div>
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center rounded-xl text-ink">
              0
            </div>

            {/* Checkmark Button */}
            <HighlightTarget elementId="pin_keypad_submit" {...tp} className="rounded-xl">
              <div className="min-h-[64px] bg-gpay-blue rounded-xl flex items-center justify-center">
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
      <div className="min-h-full shrink-0 w-full bg-gpay-blue text-white flex flex-col justify-between items-center p-lg text-center">
        <div className="flex-1 flex flex-col items-center justify-center gap-md">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-gpay-blue stroke-[3]" />
          </div>

          <div className="space-y-sm">
            <div className="text-4xl font-bold tracking-tight">{amountExact}</div>
            <div className="text-title">
              {r.paidSuccessfully}
            </div>
            <div className="text-label font-normal text-white/90">
              {payeeName} • {r.upiRef} 428901847192
            </div>
          </div>

          <div className="bg-white/15 rounded-card px-lg py-md border-2 border-white/30 text-left w-full max-w-xs space-y-xs">
            <div className="text-label text-white/85 tracking-wide">{r.debitedFrom}</div>
            <div className="text-body font-bold">State Bank of India •••• 4829</div>
          </div>
        </div>

        <HighlightTarget elementId="success_done_button" {...tp} className="w-full rounded-full mt-md">
          <div className="w-full min-h-[64px] bg-white text-gpay-blue text-body font-bold rounded-full flex items-center justify-center">
            {r.doneSuccess}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 5. CONTACT LIST SCREEN
  if (screen === 'gpay_contact_list_screen') {
    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <AppBar>
          <div className="text-title">
            {r.selectContact}
          </div>
        </AppBar>

        <div className="p-lg space-y-sm">
          <HighlightTarget elementId="contact_son_ramesh" {...tp}>
            <div className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center gap-lg">
              <div className="w-14 h-14 bg-[#1E8E3E] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {r.rameshInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body font-bold text-ink">
                  {r.ramesh}
                </div>
                <div className="text-label font-normal text-ink-muted">
                  {`${r.son} • +91 98765 43210`}
                </div>
              </div>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center gap-lg"
          >
            <div className="w-14 h-14 bg-[#8430CE] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {r.priyaInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-bold text-ink">
                {r.priya}
              </div>
              <div className="text-label font-normal text-ink-muted">
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
      <div className="h-full w-full bg-gpay-bg text-ink flex flex-col justify-between">
        <AppBar>
          <div className="w-12 h-12 bg-[#1E8E3E] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {r.rameshInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold leading-tight">
              {r.rameshSon}
            </div>
            <div className="text-label font-normal text-ink-muted">+91 98765 43210</div>
          </div>
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <Phone className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
        </AppBar>

        <div className="flex items-center justify-center gap-xs px-lg pt-md text-label font-normal text-ink">
          <ShieldCheck className="w-5 h-5 text-[#1E8E3E] flex-shrink-0" aria-hidden="true" />
          <span>{r.bankingNameVerified}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-xl">
          <div className="bg-white border border-[#DADCE0] rounded-[28px] p-lg text-center max-w-xs">
            <ShieldCheck className="w-9 h-9 text-gpay-blue mx-auto mb-sm" aria-hidden="true" />
            <div className="text-body font-bold text-ink">
              {r.secureTransfer}
            </div>
          </div>
        </div>

        {/* Pay and Request pills, each as wide as its name; they stack when both do not fit one row */}
        <div className="flex flex-wrap gap-sm p-lg bg-white border-t border-[#DADCE0]">
          <HighlightTarget elementId="contact_pay_button" {...tp} className="flex-auto rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center px-xl whitespace-nowrap">
              {r.payMoney}
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="flex-auto min-h-[64px] px-lg bg-white text-[#0B57D0] border-2 border-[#DADCE0] text-body font-bold rounded-full flex items-center justify-center text-center whitespace-nowrap"
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
      <div className="h-full w-full bg-gpay-bg text-ink flex flex-col justify-between">
        <AppBar>
          <div className="text-title">
            {r.accountBalance}
          </div>
        </AppBar>

        <div className="bg-white rounded-card p-xl border border-[#DADCE0] space-y-lg mx-lg my-auto">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 bg-gpay-light-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-gpay-blue" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-body font-bold text-ink">
                {MOCK_BANK_BALANCE.bankName}
              </div>
              <div className="text-label font-normal text-ink-muted">
                {MOCK_BANK_BALANCE.accountNumberMasked}
              </div>
            </div>
          </div>

          <div className="border-t border-[#DADCE0] pt-lg">
            <div className="text-label font-normal text-ink-muted">
              {r.availableBalance}
            </div>
            <div className="text-5xl font-bold text-[#137333] mt-xs">
              {MOCK_BANK_BALANCE.balanceAmount}
            </div>
          </div>
        </div>

        <div className="p-lg">
          <HighlightTarget elementId="balance_done_button" {...tp} className="w-full rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center">
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
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <AppBar>
          <div className="text-title">
            {r.transactionHistory}
          </div>
        </AppBar>

        <div className="p-lg space-y-sm">
          <HighlightTarget elementId="history_item_1" {...tp}>
            <div className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center justify-between gap-md">
              <div className="flex items-center gap-md min-w-0">
                <div className="w-12 h-12 bg-gpay-light-blue rounded-full flex items-center justify-center text-gpay-blue flex-shrink-0">
                  <ArrowUpRight className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="text-body font-bold text-ink">
                    {MOCK_TRANSACTIONS[0].merchant[language] || MOCK_TRANSACTIONS[0].merchant.en}
                  </div>
                  <div className="text-label font-normal text-ink-muted">
                    {MOCK_TRANSACTIONS[0].date[language] || MOCK_TRANSACTIONS[0].date.en}
                  </div>
                </div>
              </div>
              <div className="text-body font-bold text-ink flex-shrink-0">
                {MOCK_TRANSACTIONS[0].amount}
              </div>
            </div>
          </HighlightTarget>

          <div className="border-t border-[#DADCE0] mx-md" aria-hidden="true" />

          <div
            onClick={onWrongTap}
            className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center justify-between gap-md"
          >
            <div className="flex items-center gap-md min-w-0">
              <div className="w-12 h-12 bg-[#E6F4EA] rounded-full flex items-center justify-center text-[#137333] flex-shrink-0">
                <ArrowDownLeft className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-body font-bold text-ink">
                  {MOCK_TRANSACTIONS[1].merchant[language] || MOCK_TRANSACTIONS[1].merchant.en}
                </div>
                <div className="text-label font-normal text-ink-muted">
                  {MOCK_TRANSACTIONS[1].date[language] || MOCK_TRANSACTIONS[1].date.en}
                </div>
              </div>
            </div>
            <div className="text-body font-bold text-[#137333] flex-shrink-0">
              +{MOCK_TRANSACTIONS[1].amount}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. RECEIPT DETAIL SCREEN
  if (screen === 'gpay_receipt_detail_screen') {
    return (
      <div className="h-full w-full bg-gpay-bg text-ink flex flex-col justify-between">
        <div className="bg-white flex items-center justify-between gap-md px-md py-md border-b border-[#DADCE0]">
          <HighlightTarget elementId="receipt_back_button" {...tp} className="rounded-full">
            <div className="w-16 h-16 bg-gpay-light-blue rounded-full flex items-center justify-center">
              <ArrowLeft className="w-8 h-8 text-ink" />
            </div>
          </HighlightTarget>
          <span className="text-body font-bold">
            {r.paymentReceipt}
          </span>
          <div className="w-16" />
        </div>

        <div className="bg-white rounded-card p-xl border border-[#DADCE0] space-y-xl mx-lg my-auto">
          <div className="text-center space-y-sm">
            <CheckCircle2 className="w-16 h-16 text-[#137333] mx-auto" aria-hidden="true" />
            <div className="text-body font-bold text-ink">
              {MOCK_TRANSACTIONS[0].merchant[language] || MOCK_TRANSACTIONS[0].merchant.en}
            </div>
            <div className="text-5xl font-bold text-ink">
              {MOCK_TRANSACTIONS[0].amount}
            </div>
            <div className="text-label text-[#137333] bg-[#E6F4EA] py-xs px-md rounded-full inline-block">
              {r.completed}
            </div>
          </div>

          <div className="border-t border-[#DADCE0] pt-lg space-y-md text-label font-normal text-ink-muted">
            <div className="flex justify-between gap-md">
              <span>{r.upiRefNo}</span>
              <span className="font-bold text-ink">428901847192</span>
            </div>
            <div className="flex justify-between gap-md">
              <span>{r.paymentMode}</span>
              <span className="font-bold text-ink text-right">SBI Bank •••• 4829</span>
            </div>
          </div>
        </div>

        <div className="text-center text-ink-muted text-label font-normal pb-lg">
          {r.mockData}
        </div>
      </div>
    );
  }

  // 10. GPAY HOME SCREEN (Default)
  return (
    <div className="h-full w-full bg-white text-ink flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Top: search (inert) and the learner's profile picture */}
        <div className="flex items-center gap-sm px-lg pt-md pb-sm">
          <div onClick={onWrongTap} className="flex-1 min-w-0 min-h-[64px] rounded-full bg-[#F1F3F4] flex items-center gap-md px-lg">
            <Search className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <span className="text-body text-ink-muted truncate">{r.search}</span>
          </div>
          <div className="w-12 h-12 bg-gpay-light-blue rounded-full flex items-center justify-center text-2xl flex-shrink-0">
            👵
          </div>
        </div>

        {/* Shortcuts at the top, two per row so 18px names fit in every language */}
        <div className="grid grid-cols-2 gap-x-md px-lg py-md">
          <HighlightTarget elementId="scan_qr_button" {...tp}>
            <Shortcut icon={QrCode} label={r.scanAnyQr} />
          </HighlightTarget>

          <HighlightTarget elementId="pay_contacts_button" {...tp}>
            <Shortcut icon={Users} label={r.payContacts} />
          </HighlightTarget>
        </div>

        {/* Bank balance and history rows further down (the narration places them at the bottom) */}
        <div className="px-lg pb-sm space-y-xs">
          <HighlightTarget elementId="check_balance_button" {...tp}>
            <div className="min-h-[64px] px-sm py-sm flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-[#D3E3FD] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-[#0B57D0]" />
              </div>
              <span className="text-body font-semibold text-ink flex-1 min-w-0">{r.checkBalance}</span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="transaction_history_button" {...tp}>
            <div className="min-h-[64px] px-sm py-sm flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-[#D3E3FD] flex items-center justify-center flex-shrink-0">
                <Receipt className="w-7 h-7 text-[#0B57D0]" />
              </div>
              <span className="text-body font-semibold text-ink flex-1 min-w-0">{r.seeHistory}</span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>
        </div>

        <div className="mt-auto text-center text-ink-muted text-label font-normal px-lg pb-md">
          {r.mockFooter}
        </div>
      </div>

      {/* Bottom bar (inert): Main selected */}
      <div className="flex border-t border-[#DADCE0] bg-white px-xs">
        {([
          [House, r.tabMain],
          [Landmark, r.tabBank],
          [CircleUserRound, r.tabProfile]
        ] as [React.ElementType, string][]).map(([Icon, label], i) => (
          <div key={label} onClick={onWrongTap} className="flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-xs py-xs">
            <div className={`w-16 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#D3E3FD]' : ''}`}>
              <Icon className={`w-6 h-6 ${i === 0 ? 'text-[#0B57D0]' : 'text-ink'}`} aria-hidden="true" />
            </div>
            <span className={`text-label text-ink text-center leading-tight ${i === 0 ? 'font-bold' : 'font-normal'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
