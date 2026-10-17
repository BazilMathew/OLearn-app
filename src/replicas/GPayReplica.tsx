import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { MOCK_CONTACTS, MOCK_TRANSACTIONS, MOCK_BANK_BALANCE } from '../config/mockData';
import { REPLICA_STRINGS, ReplicaStrings } from './replicaStrings';
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
  ChevronRight,
  Delete,
  BadgeCheck
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

  // 1. QR SCANNER VIEWFINDER SCREEN
  if (screen === 'gpay_qr_scanner_viewfinder') {
    return (
      <div className="h-full w-full bg-[#202124] text-white flex flex-col justify-between items-center p-xl">
        <div className="w-full flex items-center justify-between">
          <ArrowLeft className="w-7 h-7 text-white" aria-hidden="true" />
          <span className="text-body font-bold">
            {r.scanShopQr}
          </span>
          <div className="w-7" />
        </div>

        {/* Viewfinder Frame with Shop QR Code */}
        <div className="flex flex-col items-center">
          <HighlightTarget elementId="qr_target_box" {...tp} className="rounded-[28px]">
            <div className="w-64 h-64 rounded-[28px] bg-[#303134] flex flex-col items-center justify-center p-lg relative">
              {/* Viewfinder corners */}
              <span className="absolute top-3 left-3 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl" aria-hidden="true" />
              <span className="absolute top-3 right-3 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl" aria-hidden="true" />
              <span className="absolute bottom-3 left-3 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl" aria-hidden="true" />
              <span className="absolute bottom-3 right-3 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl" aria-hidden="true" />
              <div className="bg-white rounded-xl p-sm">
                <QrCode className="w-32 h-32 text-ink" />
              </div>
              <div className="bg-gpay-blue text-white text-label px-md py-xs rounded-full mt-md">
                {r.shopName}
              </div>
            </div>
          </HighlightTarget>

          <p className="text-body text-white font-bold mt-xl text-center">
            {r.pointCamera}
          </p>
        </div>

        <div className="text-center text-white/70 text-label font-normal">
          {r.sandboxFooter}
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
        <div className="bg-[#F1F3F4] px-sm pt-xs pb-lg border-t border-[#DADCE0]">
          <div className="grid grid-cols-3 gap-1 text-center text-title">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <div
                key={num}
                onClick={onWrongTap}
                className="min-h-[64px] flex items-center justify-center bg-white rounded-xl cursor-pointer text-ink"
              >
                {num}
              </div>
            ))}
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center cursor-pointer text-ink">
              <Delete className="w-8 h-8" aria-hidden="true" />
            </div>
            <div onClick={onWrongTap} className="min-h-[64px] flex items-center justify-center bg-white rounded-xl text-ink">
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
          <div className="min-w-0">
            <div className="text-body font-bold leading-tight">
              {r.rameshSon}
            </div>
            <div className="text-label font-normal text-ink-muted">+91 98765 43210</div>
          </div>
        </AppBar>

        <div className="flex-1 flex flex-col justify-center items-center p-xl">
          <div className="bg-white border border-[#DADCE0] rounded-card p-lg text-center max-w-xs">
            <ShieldCheck className="w-9 h-9 text-gpay-blue mx-auto mb-sm" aria-hidden="true" />
            <div className="text-body font-bold text-ink">
              {r.secureTransfer}
            </div>
          </div>
        </div>

        <div className="flex gap-md p-lg bg-white border-t border-[#DADCE0]">
          <HighlightTarget elementId="contact_pay_button" {...tp} className="flex-1 rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center px-md">
              {r.payMoney}
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="flex-1 min-w-0 min-h-[64px] px-sm bg-white text-gpay-blue border-2 border-[#DADCE0] text-label font-bold rounded-full flex items-center justify-center text-center"
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
    <div className="h-full w-full bg-gpay-bg text-ink flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white flex items-center justify-between px-lg py-md border-b border-[#DADCE0]">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 bg-gpay-blue rounded-xl flex items-center justify-center font-bold text-white text-xl">
            G
          </div>
          <span className="text-title text-ink">Google Pay</span>
        </div>
        <div className="w-12 h-12 bg-gpay-light-blue rounded-full flex items-center justify-center text-2xl">
          👵
        </div>
      </div>

      <div className="space-y-lg p-lg my-auto">
        {/* Large Action Tiles: Minimum 64dp high */}
        <div className="space-y-md">
          <HighlightTarget elementId="scan_qr_button" {...tp}>
            <div className="min-h-[80px] bg-gpay-blue text-white px-lg py-md rounded-2xl flex items-center gap-lg">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <QrCode className="w-7 h-7" />
              </div>
              <div className="text-body font-bold leading-tight">
                {r.scanAnyQr}
              </div>
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="pay_contacts_button" {...tp}>
            <div className="min-h-[80px] bg-white text-ink px-lg py-md rounded-2xl flex items-center gap-lg border border-[#DADCE0]">
              <div className="w-12 h-12 bg-gpay-light-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-gpay-blue" />
              </div>
              <div className="text-body font-bold leading-tight">
                {r.payContacts}
              </div>
            </div>
          </HighlightTarget>
        </div>

        {/* Banking and History Links */}
        <div className="bg-white rounded-card p-sm border border-[#DADCE0] space-y-xs">
          <HighlightTarget elementId="check_balance_button" {...tp}>
            <div className="min-h-[64px] px-md py-sm rounded-xl flex items-center gap-md">
              <Building2 className="w-7 h-7 text-gpay-blue flex-shrink-0" />
              <span className="text-body font-bold text-ink flex-1">
                {r.checkBalance}
              </span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>

          <div className="border-t border-[#DADCE0] mx-md" />

          <HighlightTarget elementId="transaction_history_button" {...tp}>
            <div className="min-h-[64px] px-md py-sm rounded-xl flex items-center gap-md">
              <Receipt className="w-7 h-7 text-gpay-blue flex-shrink-0" />
              <span className="text-body font-bold text-ink flex-1">
                {r.seeHistory}
              </span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>
        </div>
      </div>

      <div className="text-center text-ink-muted text-label font-normal px-lg pb-lg">
        {r.mockFooter}
      </div>
    </div>
  );
};
