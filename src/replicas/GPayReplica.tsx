import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { MOCK_CONTACTS, MOCK_TRANSACTIONS, MOCK_BANK_BALANCE } from '../config/mockData';
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
}

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
  nudgeKey
}) => {
  const tp = { activeHighlightId: highlightElement, onCorrectTap, onWrongTap, nudgeKey };

  // 1. QR SCANNER VIEWFINDER SCREEN
  if (screen === 'gpay_qr_scanner_viewfinder') {
    return (
      <div className="h-full w-full bg-[#202124] text-white flex flex-col justify-between items-center p-xl">
        <div className="w-full flex items-center justify-between">
          <ArrowLeft className="w-7 h-7 text-white" aria-hidden="true" />
          <span className="text-body font-bold">
            {language === 'hi' ? 'दुकान का क्यूआर स्कैन करें' : language === 'ml' ? 'ക്യുആർ സ്കാൻ ചെയ്യുക' : 'Scan Shop QR'}
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
                Sharma Kirana Store
              </div>
            </div>
          </HighlightTarget>

          <p className="text-body text-white font-bold mt-xl text-center">
            {language === 'hi' ? 'कैमरा क्यूआर कोड के सामने रखें' : language === 'ml' ? 'ക്യാമറ ക്യുആർ കോഡിന് നേരെ പിടിക്കുക' : 'Point camera at shop QR code'}
          </p>
        </div>

        <div className="text-center text-white/70 text-label font-normal">
          Google Pay UPI Sandbox
        </div>
      </div>
    );
  }

  // 2. AMOUNT ENTRY SCREEN
  if (screen === 'gpay_amount_entry_screen') {
    return (
      <div className="h-full w-full bg-white text-ink flex flex-col justify-between">
        <AppBar>
          <div className="w-12 h-12 bg-[#E37400] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            S
          </div>
          <div className="min-w-0">
            <div className="text-body font-bold leading-tight">
              {highlightElement === 'proceed_to_pay_button' && screen.includes('contact')
                ? (language === 'hi' ? 'रमेश (बेटा)' : language === 'ml' ? 'രമേഷ് (മകൻ)' : 'Ramesh (Son)')
                : 'Sharma Groceries'}
            </div>
            <div className="text-label font-normal text-ink-muted flex items-center gap-xs">
              <BadgeCheck className="w-5 h-5 text-gpay-blue flex-shrink-0" aria-hidden="true" />
              <span>Banking Name Verified</span>
            </div>
          </div>
        </AppBar>

        <div className="flex flex-col items-center my-auto gap-md px-xl">
          <span className="text-body text-ink-muted">
            {language === 'hi' ? 'भुगतान राशि' : language === 'ml' ? 'നൽകേണ്ട തുക' : 'Paying Amount'}
          </span>
          <div className="text-6xl font-bold text-ink tracking-tight">
            ₹200
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
              {language === 'hi' ? 'भुगतान करें (₹200)' : language === 'ml' ? 'പണം നൽകുക (₹200)' : 'Proceed to Pay (₹200)'}
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
            <span className="text-body font-bold tracking-wide">UPI PIN</span>
          </div>
          <span className="text-label bg-gpay-light-blue text-gpay-dark-blue px-md py-xs rounded-full">
            SBI Bank
          </span>
        </div>

        <div className="flex flex-col items-center gap-xs text-center px-lg py-sm">
          <div className="text-body font-bold text-ink">
            {language === 'hi' ? 'अपना 4-अंकों का गुप्त यूपीआई पिन डालें' : language === 'ml' ? 'നിങ്ങളുടെ 4 അക്ക യുപിഐ പിൻ നൽകുക' : 'Enter 4-Digit Secret UPI PIN'}
          </div>

          {/* 4 Masked PIN Dots (dummy, nothing is typed) */}
          <div className="flex gap-xl" aria-hidden="true">
            {[1, 2, 3, 4].map((dot) => (
              <div key={dot} className="w-5 h-5 rounded-full bg-ink" />
            ))}
          </div>

          <p className="text-label font-normal text-ink-muted">
            {language === 'hi' ? 'यूपीआई पिन कभी किसी को न बताएं' : language === 'ml' ? 'യുപിഐ പിൻ ആരുമായും പങ്കിടരുത്' : 'Never share your UPI PIN with anyone'}
          </p>
        </div>

        {/* Numpad Simulator with Blue Checkmark */}
        <div className="bg-[#F1F3F4] px-sm py-xs border-t border-[#DADCE0]">
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
      <div className="h-full w-full bg-gpay-blue text-white flex flex-col justify-between items-center p-lg text-center">
        <div className="flex-1 flex flex-col items-center justify-center gap-md">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-gpay-blue stroke-[3]" />
          </div>

          <div className="space-y-sm">
            <div className="text-4xl font-bold tracking-tight">₹200.00</div>
            <div className="text-title">
              {language === 'hi' ? 'भुगतान सफल रहा!' : language === 'ml' ? 'പേയ്മെന്റ് വിജയകരം!' : 'Paid Successfully!'}
            </div>
            <div className="text-label font-normal text-white/90">
              Sharma Groceries • UPI Ref 428901847192
            </div>
          </div>

          <div className="bg-white/15 rounded-card px-lg py-md border-2 border-white/30 text-left w-full max-w-xs space-y-xs">
            <div className="text-label text-white/85 tracking-wide">DEBITED FROM</div>
            <div className="text-body font-bold">State Bank of India •••• 4829</div>
          </div>
        </div>

        <HighlightTarget elementId="success_done_button" {...tp} className="w-full rounded-full mt-md">
          <div className="w-full min-h-[64px] bg-white text-gpay-blue text-body font-bold rounded-full flex items-center justify-center">
            {language === 'hi' ? 'समाप्त (डन)' : language === 'ml' ? 'പൂർത്തിയായി (ഡൺ)' : 'Done'}
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
            {language === 'hi' ? 'संपर्क चुनें' : language === 'ml' ? 'കോൺടാക്റ്റ് തിരഞ്ഞെടുക്കുക' : 'Select Contact'}
          </div>
        </AppBar>

        <div className="p-lg space-y-sm">
          <HighlightTarget elementId="contact_son_ramesh" {...tp}>
            <div className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center gap-lg">
              <div className="w-14 h-14 bg-[#1E8E3E] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                R
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body font-bold text-ink">
                  {language === 'hi' ? 'रमेश' : language === 'ml' ? 'രമേഷ്' : 'Ramesh'}
                </div>
                <div className="text-label font-normal text-ink-muted">
                  {language === 'hi' ? 'बेटा • +91 98765 43210' : language === 'ml' ? 'മകൻ • +91 98765 43210' : 'Son • +91 98765 43210'}
                </div>
              </div>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="min-h-[80px] bg-white px-md py-md rounded-2xl flex items-center gap-lg"
          >
            <div className="w-14 h-14 bg-[#8430CE] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-bold text-ink">
                {language === 'hi' ? 'प्रिया' : language === 'ml' ? 'പ്രിയ' : 'Priya'}
              </div>
              <div className="text-label font-normal text-ink-muted">
                {language === 'hi' ? 'बेटी' : language === 'ml' ? 'മകൾ' : 'Daughter'}
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
            R
          </div>
          <div className="min-w-0">
            <div className="text-body font-bold leading-tight">
              {language === 'hi' ? 'रमेश (बेटा)' : language === 'ml' ? 'രമേഷ് (മകൻ)' : 'Ramesh (Son)'}
            </div>
            <div className="text-label font-normal text-ink-muted">+91 98765 43210</div>
          </div>
        </AppBar>

        <div className="flex-1 flex flex-col justify-center items-center p-xl">
          <div className="bg-white border border-[#DADCE0] rounded-card p-lg text-center max-w-xs">
            <ShieldCheck className="w-9 h-9 text-gpay-blue mx-auto mb-sm" aria-hidden="true" />
            <div className="text-body font-bold text-ink">
              {language === 'hi' ? 'सुरक्षित यूपीआई भुगतान' : language === 'ml' ? 'സുരക്ഷിത യുപിഐ പേയ്മെന്റ്' : 'Secure UPI Direct Transfer'}
            </div>
          </div>
        </div>

        <div className="flex gap-md p-lg bg-white border-t border-[#DADCE0]">
          <HighlightTarget elementId="contact_pay_button" {...tp} className="flex-1 rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center px-md">
              {language === 'hi' ? 'पैसे भेजें (पे)' : language === 'ml' ? 'പണം അയക്കുക (പേ)' : 'Pay Money'}
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="flex-1 min-h-[64px] bg-white text-gpay-blue border-2 border-[#DADCE0] text-body font-bold rounded-full flex items-center justify-center"
          >
            Request
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
            {language === 'hi' ? 'बैंक बैलेंस' : language === 'ml' ? 'ബാങ്ക് ബാലൻസ്' : 'Account Balance'}
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
              {language === 'hi' ? 'उपलब्ध शेष राशि' : language === 'ml' ? 'ലഭ്യമായ ബാലൻസ്' : 'Available Balance'}
            </div>
            <div className="text-5xl font-bold text-[#137333] mt-xs">
              {MOCK_BANK_BALANCE.balanceAmount}
            </div>
          </div>
        </div>

        <div className="p-lg">
          <HighlightTarget elementId="balance_done_button" {...tp} className="w-full rounded-full">
            <div className="w-full min-h-[64px] bg-gpay-blue text-white text-body font-bold rounded-full flex items-center justify-center">
              {language === 'hi' ? 'पूर्ण (डन)' : language === 'ml' ? 'മടങ്ങുക (ഡൺ)' : 'Done'}
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
            {language === 'hi' ? 'लेन-देन इतिहास' : language === 'ml' ? 'ഇടപാട് ചരിത്രം' : 'Transaction History'}
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
            {language === 'hi' ? 'भुगतान रसीद' : language === 'ml' ? 'പേയ്മെന്റ് രസീത്' : 'Payment Receipt'}
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
              {language === 'hi' ? 'सफल भुगतान' : language === 'ml' ? 'വിജയകരം' : 'Completed'}
            </div>
          </div>

          <div className="border-t border-[#DADCE0] pt-lg space-y-md text-label font-normal text-ink-muted">
            <div className="flex justify-between gap-md">
              <span>UPI Ref No</span>
              <span className="font-bold text-ink">428901847192</span>
            </div>
            <div className="flex justify-between gap-md">
              <span>Payment Mode</span>
              <span className="font-bold text-ink text-right">SBI Bank •••• 4829</span>
            </div>
          </div>
        </div>

        <div className="text-center text-ink-muted text-label font-normal pb-lg">
          OLearn Sandboxed Mock Data
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
                {language === 'hi' ? 'कोई भी क्यूआर स्कैन करें' : language === 'ml' ? 'ഏതെങ്കിലും ക്യുആർ സ്കാൻ ചെയ്യുക' : 'Scan any QR code'}
              </div>
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="pay_contacts_button" {...tp}>
            <div className="min-h-[80px] bg-white text-ink px-lg py-md rounded-2xl flex items-center gap-lg border border-[#DADCE0]">
              <div className="w-12 h-12 bg-gpay-light-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-gpay-blue" />
              </div>
              <div className="text-body font-bold leading-tight">
                {language === 'hi' ? 'संपर्कों को पैसे भेजें' : language === 'ml' ? 'കോൺടാക്റ്റുകൾക്ക് പണം നൽകുക' : 'Pay contacts'}
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
                {language === 'hi' ? 'बैंक बैलेंस चेक करें' : language === 'ml' ? 'ബാങ്ക് ബാലൻസ് പരിശോധിക്കുക' : 'Check bank balance'}
              </span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>

          <div className="border-t border-[#DADCE0] mx-md" />

          <HighlightTarget elementId="transaction_history_button" {...tp}>
            <div className="min-h-[64px] px-md py-sm rounded-xl flex items-center gap-md">
              <Receipt className="w-7 h-7 text-gpay-blue flex-shrink-0" />
              <span className="text-body font-bold text-ink flex-1">
                {language === 'hi' ? 'लेन-देन का इतिहास देखें' : language === 'ml' ? 'ഇടപാട് ചരിത്രം കാണുക' : 'See transaction history'}
              </span>
              <ChevronRight className="w-6 h-6 text-ink-muted flex-shrink-0" aria-hidden="true" />
            </div>
          </HighlightTarget>
        </div>
      </div>

      <div className="text-center text-ink-muted text-label font-normal px-lg pb-lg">
        Mock Google Pay Replica • No real money is used
      </div>
    </div>
  );
};
