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
  Lock
} from 'lucide-react';

interface GPayReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
}

export const GPayReplica: React.FC<GPayReplicaProps> = ({
  screen,
  highlightElement,
  language,
  onCorrectTap,
  onWrongTap
}) => {
  // 1. QR SCANNER VIEWFINDER SCREEN
  if (screen === 'gpay_qr_scanner_viewfinder') {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col justify-between items-center p-6">
        <div className="w-full flex items-center justify-between pt-2">
          <ArrowLeft className="w-7 h-7 text-white" />
          <span className="text-xl font-bold">
            {language === 'hi' ? 'दुकान का क्यूआर स्कैन करें' : language === 'ml' ? 'ക്യുആർ സ്കാൻ ചെയ്യുക' : 'Scan Shop QR'}
          </span>
          <div className="w-7" />
        </div>

        {/* Viewfinder Frame with Shop QR Code */}
        <div className="flex flex-col items-center">
          <HighlightTarget
            elementId="qr_target_box"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
            className="p-3"
          >
            <div className="w-64 h-64 border-4 border-dashed border-amber-400 rounded-3xl bg-slate-900 flex flex-col items-center justify-center p-4 relative shadow-2xl">
              <QrCode className="w-40 h-40 text-white" />
              <div className="bg-blue-600 text-white text-base font-bold px-3 py-1 rounded-full mt-2">
                Sharma Kirana Store
              </div>
            </div>
          </HighlightTarget>

          <p className="text-xl text-amber-300 font-bold mt-4 text-center">
            {language === 'hi' ? 'कैमरा क्यूआर कोड के सामने रखें' : language === 'ml' ? 'ക്യാമറ ക്യുആർ കോഡിന് നേരെ പിടിക്കുക' : 'Point camera at shop QR code'}
          </p>
        </div>

        <div className="text-center text-slate-400 text-lg mb-4">
          Google Pay UPI Sandbox
        </div>
      </div>
    );
  }

  // 2. AMOUNT ENTRY SCREEN
  if (screen === 'gpay_amount_entry_screen') {
    return (
      <div className="h-full w-full bg-white text-gray-900 flex flex-col justify-between p-6">
        <div className="flex items-center space-x-3 pt-2">
          <ArrowLeft className="w-7 h-7 text-gray-800" />
          <div>
            <div className="text-2xl font-bold">
              {highlightElement === 'proceed_to_pay_button' && screen.includes('contact')
                ? (language === 'hi' ? 'रमेश (बेटा)' : language === 'ml' ? 'രമേഷ് (മകൻ)' : 'Ramesh (Son)')
                : 'Sharma Groceries'}
            </div>
            <div className="text-base text-gray-500 font-semibold">Banking Name Verified</div>
          </div>
        </div>

        <div className="flex flex-col items-center my-auto space-y-4">
          <span className="text-xl text-gray-600 font-semibold">
            {language === 'hi' ? 'भुगतान राशि' : language === 'ml' ? 'നൽകേണ്ട തുക' : 'Paying Amount'}
          </span>
          <div className="text-6xl font-extrabold text-[#1A73E8] tracking-tight">
            ₹200
          </div>
          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-lg font-medium">
            State Bank of India •••• 4829
          </div>
        </div>

        {/* Proceed to Pay Button (Min 64dp height) */}
        <HighlightTarget
          elementId="proceed_to_pay_button"
          activeHighlightId={highlightElement}
          onCorrectTap={onCorrectTap}
          onWrongTap={onWrongTap}
          className="w-full mb-2"
        >
          <div className="w-full min-h-[64px] bg-[#1A73E8] hover:bg-[#1557b0] text-white text-2xl font-bold rounded-2xl flex items-center justify-center shadow-lg">
            {language === 'hi' ? 'भुगतान करें (₹200)' : language === 'ml' ? 'പണം നൽകുക (₹200)' : 'Proceed to Pay (₹200)'}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 3. SECURE UPI PIN ENTRY SCREEN
  if (screen === 'gpay_upi_pin_screen') {
    return (
      <div className="h-full w-full bg-slate-900 text-white flex flex-col justify-between p-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-6 h-6 text-amber-400" />
            <span className="text-xl font-bold tracking-wider">UPI PIN</span>
          </div>
          <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">
            SBI Bank
          </span>
        </div>

        <div className="flex flex-col items-center my-6 space-y-4 text-center">
          <div className="text-2xl font-bold text-slate-100">
            {language === 'hi' ? 'अपना 4-अंकों का गुप्त यूपीआई पिन डालें' : language === 'ml' ? 'നിങ്ങളുടെ 4 അക്ക യുപിഐ പിൻ നൽകുക' : 'Enter 4-Digit Secret UPI PIN'}
          </div>

          {/* 4 Masked PIN Dots */}
          <div className="flex space-x-6 py-4">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-lg animate-pulse"
              />
            ))}
          </div>

          <p className="text-base text-slate-400 font-semibold">
            {language === 'hi' ? 'यूपीआई पिन कभी किसी को न बताएं' : language === 'ml' ? 'യുപിഐ പിൻ ആരുമായും പങ്കിടരുത്' : 'Never share your UPI PIN with anyone'}
          </p>
        </div>

        {/* Numpad Simulator with Blue Checkmark */}
        <div className="bg-slate-800 rounded-3xl p-4 shadow-xl border border-slate-700">
          <div className="grid grid-cols-3 gap-3 text-center text-2xl font-bold">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <div
                key={num}
                onClick={onWrongTap}
                className="py-3 bg-slate-700/60 rounded-xl hover:bg-slate-700 cursor-pointer text-slate-200"
              >
                {num}
              </div>
            ))}
            <div onClick={onWrongTap} className="py-3 text-rose-400 text-xl font-bold cursor-pointer">
              ✕
            </div>
            <div onClick={onWrongTap} className="py-3 bg-slate-700/60 rounded-xl text-slate-200">
              0
            </div>

            {/* Checkmark Button */}
            <HighlightTarget
              elementId="pin_keypad_submit"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
            >
              <div className="py-3 bg-[#1A73E8] hover:bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <Check className="w-8 h-8 text-white stroke-[3]" />
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
      <div className="h-full w-full bg-[#1A73E8] text-white flex flex-col justify-between items-center p-6 text-center">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <Check className="w-16 h-16 text-[#1A73E8] stroke-[3]" />
          </div>

          <div className="space-y-2">
            <div className="text-4xl font-extrabold tracking-tight">₹200.00</div>
            <div className="text-2xl font-bold">
              {language === 'hi' ? 'भुगतान सफल रहा!' : language === 'ml' ? 'പേയ്മെന്റ് വിജയകരം!' : 'Paid Successfully!'}
            </div>
            <div className="text-lg text-blue-100 font-semibold">
              Sharma Groceries • UPI Ref 428901847192
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-left w-full max-w-xs space-y-1">
            <div className="text-sm text-blue-200 font-bold">DEBITED FROM</div>
            <div className="text-lg font-bold">State Bank of India •••• 4829</div>
          </div>
        </div>

        <HighlightTarget
          elementId="success_done_button"
          activeHighlightId={highlightElement}
          onCorrectTap={onCorrectTap}
          onWrongTap={onWrongTap}
          className="w-full mb-4"
        >
          <div className="w-full min-h-[64px] bg-white text-[#1A73E8] text-2xl font-black rounded-2xl flex items-center justify-center shadow-xl border-2 border-white">
            {language === 'hi' ? 'समाप्त (डन)' : language === 'ml' ? 'പൂർത്തിയായി (ഡൺ)' : 'Done'}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 5. CONTACT LIST SCREEN
  if (screen === 'gpay_contact_list_screen') {
    return (
      <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col p-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
          <ArrowLeft className="w-7 h-7 text-gray-800" />
          <div className="text-2xl font-bold">
            {language === 'hi' ? 'संपर्क चुनें' : language === 'ml' ? 'കോൺടാക്റ്റ് തിരഞ്ഞെടുക്കുക' : 'Select Contact'}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <HighlightTarget
            elementId="contact_son_ramesh"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-4">
              <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                R
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">
                  {language === 'hi' ? 'रमेश' : language === 'ml' ? 'രമേഷ്' : 'Ramesh'}
                </div>
                <div className="text-lg text-emerald-700 font-semibold">
                  {language === 'hi' ? 'बेटा • +91 98765 43210' : language === 'ml' ? 'മകൻ • +91 98765 43210' : 'Son • +91 98765 43210'}
                </div>
              </div>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-4 opacity-75"
          >
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              P
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900">
                {language === 'hi' ? 'प्रिया' : language === 'ml' ? 'പ്രിയ' : 'Priya'}
              </div>
              <div className="text-lg text-indigo-700 font-semibold">
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
      <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col justify-between p-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
          <ArrowLeft className="w-7 h-7 text-gray-800" />
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            R
          </div>
          <div>
            <div className="text-2xl font-bold">
              {language === 'hi' ? 'रमेश (बेटा)' : language === 'ml' ? 'രമേഷ് (മകൻ)' : 'Ramesh (Son)'}
            </div>
            <div className="text-sm text-gray-500 font-semibold">+91 98765 43210</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center max-w-xs shadow-sm">
            <ShieldCheck className="w-8 h-8 text-[#1A73E8] mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-800">
              {language === 'hi' ? 'सुरक्षित यूपीआई भुगतान' : language === 'ml' ? 'സുരക്ഷിത യുപിഐ പേയ്മെന്റ്' : 'Secure UPI Direct Transfer'}
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <HighlightTarget
            elementId="contact_pay_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
            className="flex-1"
          >
            <div className="w-full min-h-[64px] bg-[#1A73E8] hover:bg-[#1557b0] text-white text-2xl font-bold rounded-2xl flex items-center justify-center shadow-lg">
              {language === 'hi' ? 'पैसे भेजें (पे)' : language === 'ml' ? 'പണം അയക്കുക (പേ)' : 'Pay Money'}
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="flex-1 min-h-[64px] bg-gray-200 text-gray-700 text-xl font-bold rounded-2xl flex items-center justify-center opacity-60"
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
      <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col justify-between p-6">
        <div className="flex items-center space-x-3 pt-2">
          <ArrowLeft className="w-7 h-7 text-gray-800" />
          <div className="text-2xl font-bold">
            {language === 'hi' ? 'बैंक बैलेंस' : language === 'ml' ? 'ബാങ്ക് ബാലൻസ്' : 'Account Balance'}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 space-y-4 my-auto">
          <div className="flex items-center space-x-3">
            <Building2 className="w-10 h-10 text-[#1A73E8]" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {MOCK_BANK_BALANCE.bankName}
              </div>
              <div className="text-lg text-gray-600 font-semibold">
                {MOCK_BANK_BALANCE.accountNumberMasked}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-lg text-gray-600 font-semibold">
              {language === 'hi' ? 'उपलब्ध शेष राशि' : language === 'ml' ? 'ലഭ്യമായ ബാലൻസ്' : 'Available Balance'}
            </div>
            <div className="text-5xl font-black text-emerald-600 mt-1">
              {MOCK_BANK_BALANCE.balanceAmount}
            </div>
          </div>
        </div>

        <HighlightTarget
          elementId="balance_done_button"
          activeHighlightId={highlightElement}
          onCorrectTap={onCorrectTap}
          onWrongTap={onWrongTap}
          className="w-full mb-4"
        >
          <div className="w-full min-h-[64px] bg-[#1A73E8] hover:bg-[#1557b0] text-white text-2xl font-bold rounded-2xl flex items-center justify-center shadow-lg">
            {language === 'hi' ? 'पूर्ण (डन)' : language === 'ml' ? 'മടങ്ങുക (ഡൺ)' : 'Done'}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 8. TRANSACTION HISTORY LIST SCREEN
  if (screen === 'gpay_history_list_screen') {
    return (
      <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col p-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
          <ArrowLeft className="w-7 h-7 text-gray-800" />
          <div className="text-2xl font-bold">
            {language === 'hi' ? 'लेन-देन इतिहास' : language === 'ml' ? 'ഇടപാട് ചരിത്രം' : 'Transaction History'}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <HighlightTarget
            elementId="history_item_1"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#1A73E8]">
                  <ArrowUpRight className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {MOCK_TRANSACTIONS[0].merchant[language] || MOCK_TRANSACTIONS[0].merchant.en}
                  </div>
                  <div className="text-base text-gray-500 font-semibold">
                    {MOCK_TRANSACTIONS[0].date[language] || MOCK_TRANSACTIONS[0].date.en}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {MOCK_TRANSACTIONS[0].amount}
              </div>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between opacity-70"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {MOCK_TRANSACTIONS[1].merchant[language] || MOCK_TRANSACTIONS[1].merchant.en}
                </div>
                <div className="text-base text-gray-500 font-semibold">
                  {MOCK_TRANSACTIONS[1].date[language] || MOCK_TRANSACTIONS[1].date.en}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
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
      <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col justify-between p-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <HighlightTarget
            elementId="receipt_back_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
            className="p-2"
          >
            <div className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              <ArrowLeft className="w-7 h-7 text-gray-800" />
            </div>
          </HighlightTarget>
          <span className="text-xl font-bold">
            {language === 'hi' ? 'भुगतान रसीद' : language === 'ml' ? 'പേയ്മെന്റ് രസീത്' : 'Payment Receipt'}
          </span>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 space-y-6 my-auto">
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <div className="text-2xl font-bold text-gray-900">
              {MOCK_TRANSACTIONS[0].merchant[language] || MOCK_TRANSACTIONS[0].merchant.en}
            </div>
            <div className="text-4xl font-extrabold text-gray-900">
              {MOCK_TRANSACTIONS[0].amount}
            </div>
            <div className="text-base text-emerald-700 font-bold bg-emerald-50 py-1 px-3 rounded-full inline-block">
              {language === 'hi' ? 'सफल भुगतान' : language === 'ml' ? 'വിജയകരം' : 'Completed'}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3 text-lg font-medium text-gray-700">
            <div className="flex justify-between">
              <span>UPI Ref No</span>
              <span className="font-bold text-gray-900">428901847192</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode</span>
              <span className="font-bold text-gray-900">SBI Bank •••• 4829</span>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-lg mb-2">
          OLearn Sandboxed Mock Data
        </div>
      </div>
    );
  }

  // 10. GPAY HOME SCREEN (Default)
  return (
    <div className="h-full w-full bg-[#F8F9FA] text-gray-900 flex flex-col justify-between p-4 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 pt-1 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#1A73E8] rounded-xl flex items-center justify-center font-black text-white text-xl">
            G
          </div>
          <span className="text-2xl font-black text-gray-800 tracking-tight">Google Pay</span>
        </div>
        <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          👵
        </div>
      </div>

      <div className="space-y-6 my-4">
        {/* Large Action Tiles: Minimum 64dp high */}
        <div className="space-y-4">
          <HighlightTarget
            elementId="scan_qr_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="min-h-[72px] bg-[#1A73E8] text-white p-4 rounded-2xl shadow-md flex items-center space-x-4 border-2 border-blue-600">
              <QrCode className="w-10 h-10 flex-shrink-0" />
              <div className="text-2xl font-bold leading-tight">
                {language === 'hi' ? 'कोई भी क्यूआर स्कैन करें' : language === 'ml' ? 'ഏതെങ്കിലും ക്യുആർ സ്കാൻ ചെയ്യുക' : 'Scan any QR code'}
              </div>
            </div>
          </HighlightTarget>

          <HighlightTarget
            elementId="pay_contacts_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="min-h-[72px] bg-white text-gray-900 p-4 rounded-2xl shadow-sm flex items-center space-x-4 border-2 border-gray-200 hover:border-blue-400">
              <Users className="w-10 h-10 text-[#1A73E8] flex-shrink-0" />
              <div className="text-2xl font-bold leading-tight">
                {language === 'hi' ? 'संपर्कों को पैसे भेजें' : language === 'ml' ? 'കോൺടാക്റ്റുകൾക്ക് പണം നൽകുക' : 'Pay contacts'}
              </div>
            </div>
          </HighlightTarget>
        </div>

        {/* Banking and History Links */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200 space-y-4">
          <HighlightTarget
            elementId="check_balance_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="min-h-[64px] p-3 rounded-xl flex items-center space-x-3 hover:bg-gray-50 border border-gray-100">
              <Building2 className="w-8 h-8 text-[#1A73E8] flex-shrink-0" />
              <span className="text-xl font-bold text-gray-900">
                {language === 'hi' ? 'बैंक बैलेंस चेक करें' : language === 'ml' ? 'ബാങ്ക് ബാലൻസ് പരിശോധിക്കുക' : 'Check bank balance'}
              </span>
            </div>
          </HighlightTarget>

          <div className="border-t border-gray-200" />

          <HighlightTarget
            elementId="transaction_history_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="min-h-[64px] p-3 rounded-xl flex items-center space-x-3 hover:bg-gray-50 border border-gray-100">
              <Receipt className="w-8 h-8 text-[#1A73E8] flex-shrink-0" />
              <span className="text-xl font-bold text-gray-900">
                {language === 'hi' ? 'लेन-देन का इतिहास देखें' : language === 'ml' ? 'ഇടപാട് ചരിത്രം കാണുക' : 'See transaction history'}
              </span>
            </div>
          </HighlightTarget>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm font-semibold pb-2">
        Mock Google Pay Replica • No real money is used
      </div>
    </div>
  );
};
