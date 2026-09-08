import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import {
  Phone,
  Video,
  Paperclip,
  Camera,
  Mic,
  Send,
  Image,
  FileText,
  Headphones,
  MapPin,
  User,
  PhoneOff,
  Smile,
  ArrowLeft,
  CheckCheck
} from 'lucide-react';

interface WhatsAppReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
}

export const WhatsAppReplica: React.FC<WhatsAppReplicaProps> = ({
  screen,
  highlightElement,
  language,
  onCorrectTap,
  onWrongTap
}) => {
  const contactName = language === 'hi' ? 'रमेश (बेटा)' : language === 'ml' ? 'രമേഷ് (മകൻ)' : 'Ramesh (Son)';

  // 1. ACTIVE VOICE CALL SCREEN
  if (screen === 'whatsapp_active_voice_call') {
    return (
      <div className="h-full w-full bg-slate-900 text-white flex flex-col justify-between items-center py-10 px-6">
        <div className="flex flex-col items-center space-y-4 text-center mt-6">
          <div className="w-28 h-28 bg-emerald-700 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-emerald-500 shadow-xl">
            R
          </div>
          <div className="text-2xl font-bold">{contactName}</div>
          <div className="text-xl text-emerald-400 font-semibold tracking-wider animate-pulse">
            00:14
          </div>
          <div className="text-lg text-slate-300">
            {language === 'hi' ? 'व्हाट्सएप वॉइस कॉल जारी है' : language === 'ml' ? 'വോയ്സ് കോൾ നടക്കുന്നു' : 'WhatsApp Voice Call in progress'}
          </div>
        </div>

        <HighlightTarget
          elementId="end_call_button"
          activeHighlightId={highlightElement}
          onCorrectTap={onCorrectTap}
          onWrongTap={onWrongTap}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <PhoneOff className="w-10 h-10 text-white" />
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 2. ACTIVE VIDEO CALL SCREEN
  if (screen === 'whatsapp_active_video_call') {
    return (
      <div className="h-full w-full bg-slate-900 text-white relative flex flex-col justify-between items-center p-6">
        {/* Mock Remote Video Stream */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center opacity-90">
          <div className="w-36 h-36 bg-emerald-800 rounded-full flex items-center justify-center text-5xl font-bold border-4 border-emerald-400 mb-4 shadow-2xl">
            👨
          </div>
          <div className="text-2xl font-bold text-white">{contactName}</div>
          <div className="text-xl text-emerald-400 font-semibold mt-1">00:22</div>
        </div>

        {/* Self View Floating Window */}
        <div className="absolute top-6 right-6 w-28 h-36 bg-slate-700 border-2 border-white rounded-2xl shadow-xl flex flex-col items-center justify-center overflow-hidden z-20">
          <span className="text-3xl">👵</span>
          <span className="text-xs text-white font-bold mt-1">You</span>
        </div>

        {/* Bottom Call Controls */}
        <div className="w-full flex justify-center z-30 mt-auto mb-6">
          <HighlightTarget
            elementId="end_call_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="w-20 h-20 bg-rose-600 hover:bg-rose-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <PhoneOff className="w-10 h-10 text-white" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 3. PHOTO PREVIEW SCREEN
  if (screen === 'whatsapp_photo_preview') {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col justify-between p-4 relative">
        <div className="flex items-center justify-between py-2 border-b border-gray-800">
          <span className="text-xl font-bold">{contactName}</span>
          <span className="text-lg text-emerald-400">
            {language === 'hi' ? 'फोटो पूर्वावलोकन' : language === 'ml' ? 'ഫോട്ടോ കാഴ്ച്ച' : 'Photo Preview'}
          </span>
        </div>

        {/* Large Mock Photo in Preview */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-72 h-80 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center p-6 border-4 border-white/80">
            <span className="text-6xl mb-3">🌸</span>
            <div className="text-2xl font-black text-slate-950">
              {language === 'hi' ? 'सुंदर फूल' : language === 'ml' ? 'സുന്ദരമായ പൂവ്' : 'Beautiful Flower'}
            </div>
            <div className="text-lg text-slate-900 font-semibold mt-1">
              Family Photo 1
            </div>
          </div>
        </div>

        {/* Bottom Preview Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="bg-gray-800 text-gray-300 px-4 py-3 rounded-full text-lg flex-1 mr-3">
            {language === 'hi' ? 'कैप्शन जोड़ें...' : language === 'ml' ? 'വിവരണം നൽകുക...' : 'Add a caption...'}
          </div>

          <HighlightTarget
            elementId="preview_send_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <Send className="w-8 h-8 text-white ml-0.5" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 4. GALLERY SELECTION SCREEN
  if (screen === 'whatsapp_gallery_screen') {
    return (
      <div className="h-full w-full bg-slate-900 text-white flex flex-col p-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
          <ArrowLeft className="w-7 h-7 text-white" />
          <div className="text-2xl font-bold">
            {language === 'hi' ? 'सभी तस्वीरें (गैलरी)' : language === 'ml' ? 'എല്ലാ ഫോട്ടോകളും' : 'All Photos (Gallery)'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <HighlightTarget
            elementId="photo_thumbnail_1"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="h-44 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md border-2 border-white">
              <span className="text-5xl mb-2">🌸</span>
              <span className="text-xl font-bold text-slate-950">Flower</span>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="h-44 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md opacity-80"
          >
            <span className="text-5xl mb-2">🛕</span>
            <span className="text-xl font-bold text-white">Temple</span>
          </div>

          <div
            onClick={onWrongTap}
            className="h-44 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md opacity-80"
          >
            <span className="text-5xl mb-2">👶</span>
            <span className="text-xl font-bold text-white">Grandchild</span>
          </div>

          <div
            onClick={onWrongTap}
            className="h-44 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md opacity-80"
          >
            <span className="text-5xl mb-2">🎂</span>
            <span className="text-xl font-bold text-white">Birthday</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. STANDARD CHAT SCREEN / ATTACHMENT SHEET / DIALOGS
  return (
    <div className="h-full w-full flex flex-col justify-between bg-[#EFEAE2] relative">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] text-white px-3 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center space-x-2.5">
          <ArrowLeft className="w-6 h-6 text-white" />
          <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center text-2xl font-bold border border-emerald-300">
            R
          </div>
          <div>
            <div className="text-xl font-bold leading-tight">{contactName}</div>
            <div className="text-sm text-emerald-200 font-semibold">online</div>
          </div>
        </div>

        {/* Call and Video Call Icons in Header */}
        <div className="flex items-center space-x-4">
          <HighlightTarget
            elementId="video_call_icon"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
            className="p-1.5"
          >
            <div className="w-11 h-11 bg-emerald-800/80 rounded-full flex items-center justify-center hover:bg-emerald-700">
              <Video className="w-7 h-7 text-white" />
            </div>
          </HighlightTarget>

          <HighlightTarget
            elementId="voice_call_icon"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
            className="p-1.5"
          >
            <div className="w-11 h-11 bg-emerald-800/80 rounded-full flex items-center justify-center hover:bg-emerald-700">
              <Phone className="w-7 h-7 text-white" />
            </div>
          </HighlightTarget>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex justify-center">
          <span className="bg-amber-100 text-gray-800 text-base font-semibold px-4 py-1.5 rounded-xl shadow-sm border border-amber-300">
            {language === 'hi' ? 'आज' : language === 'ml' ? 'ഇന്ന്' : 'Today'}
          </span>
        </div>

        {/* Received Message Bubble */}
        <div className="flex justify-start">
          <div className="bg-white text-gray-900 rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[85%] border border-gray-200">
            <p className="text-xl font-medium leading-snug">
              {language === 'hi'
                ? 'नमस्ते माँ / पिताजी! आप कैसे हैं?'
                : language === 'ml'
                ? 'നമസ്കാരം, സുഖമാണോ?'
                : 'Hello! How are you doing today?'}
            </p>
            <div className="text-xs text-gray-500 text-right mt-1 font-semibold">10:15 AM</div>
          </div>
        </div>

        {/* Typed message preview when in step 2 of sending text */}
        {screen === 'whatsapp_chat_screen_typed' && (
          <div className="flex justify-end">
            <div className="bg-[#D9FDD3] text-gray-900 rounded-2xl rounded-tr-none p-3.5 shadow-sm max-w-[85%] border border-emerald-200">
              <p className="text-xl font-semibold leading-snug">
                {language === 'hi'
                  ? 'मैं ठीक हूँ बेटा, सब कुशल है।'
                  : language === 'ml'
                  ? 'ഞാൻ ഇവിടെ സുഖമായിരിക്കുന്നു മകനേ.'
                  : 'I am doing well son, all good!'}
              </p>
              <div className="text-xs text-emerald-800 text-right mt-1 font-bold flex items-center justify-end space-x-1">
                <span>10:16 AM</span>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attachment Tray Popup */}
      {screen === 'whatsapp_attachment_sheet' && (
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 border-t-2 border-gray-300 z-30 animate-fade-in">
          <div className="text-xl font-bold text-gray-800 mb-4 text-center">
            {language === 'hi' ? 'अटैच करें' : language === 'ml' ? 'തിരഞ്ഞെടുക്കുക' : 'Share Content'}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <HighlightTarget
              elementId="gallery_icon"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Image className="w-9 h-9 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 mt-2">
                  {language === 'hi' ? 'गैलरी' : language === 'ml' ? 'ഗ്യാലറി' : 'Gallery'}
                </span>
              </div>
            </HighlightTarget>

            <div onClick={onWrongTap} className="flex flex-col items-center opacity-60">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-700 mt-2">Camera</span>
            </div>

            <div onClick={onWrongTap} className="flex flex-col items-center opacity-60">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-700 mt-2">Document</span>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Confirmation Dialog */}
      {screen === 'whatsapp_call_confirm_dialog' && (
        <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center border-2 border-emerald-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-9 h-9 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {language === 'hi' ? 'रमेश को वॉइस कॉल करें?' : language === 'ml' ? 'രമേഷിനെ കോൾ ചെയ്യണോ?' : 'Voice Call Ramesh?'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onWrongTap}
                className="flex-1 py-3 text-xl font-bold text-gray-700 bg-gray-200 rounded-2xl min-h-[56px]"
              >
                Cancel
              </button>
              <HighlightTarget
                elementId="dialog_call_button"
                activeHighlightId={highlightElement}
                onCorrectTap={onCorrectTap}
                onWrongTap={onWrongTap}
                className="flex-1"
              >
                <div className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xl min-h-[56px] flex items-center justify-center shadow-lg">
                  {language === 'hi' ? 'कॉल करें' : language === 'ml' ? 'കോൾ' : 'Call'}
                </div>
              </HighlightTarget>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Confirmation Dialog */}
      {screen === 'whatsapp_video_confirm_dialog' && (
        <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center border-2 border-emerald-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-9 h-9 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {language === 'hi' ? 'रमेश को वीडियो कॉल करें?' : language === 'ml' ? 'വീഡിയോ കോൾ ചെയ്യണോ?' : 'Start Video Call?'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onWrongTap}
                className="flex-1 py-3 text-xl font-bold text-gray-700 bg-gray-200 rounded-2xl min-h-[56px]"
              >
                Cancel
              </button>
              <HighlightTarget
                elementId="dialog_video_button"
                activeHighlightId={highlightElement}
                onCorrectTap={onCorrectTap}
                onWrongTap={onWrongTap}
                className="flex-1"
              >
                <div className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xl min-h-[56px] flex items-center justify-center shadow-lg">
                  {language === 'hi' ? 'शुरू करें' : language === 'ml' ? 'തുടങ്ങുക' : 'Start Call'}
                </div>
              </HighlightTarget>
            </div>
          </div>
        </div>
      )}

      {/* Voice Note Recording Simulator */}
      {screen === 'whatsapp_voice_recording_screen' && (
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shadow-2xl border-t-2 border-emerald-600 z-30">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping" />
            <span className="text-xl font-bold text-emerald-200">00:04</span>
            <span className="text-lg text-white font-semibold">
              {language === 'hi' ? 'आवाज़ रिकॉर्ड हो रही है...' : language === 'ml' ? 'ശബ്ദം റെക്കോർഡ് ചെയ്യുന്നു...' : 'Recording audio note...'}
            </span>
          </div>

          <HighlightTarget
            elementId="send_voice_note_button"
            activeHighlightId={highlightElement}
            onCorrectTap={onCorrectTap}
            onWrongTap={onWrongTap}
          >
            <div className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <Send className="w-7 h-7 text-white ml-0.5" />
            </div>
          </HighlightTarget>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      {screen !== 'whatsapp_voice_recording_screen' && (
        <div className="bg-[#EFEAE2] p-2 flex items-center space-x-2 z-20">
          <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2.5 shadow-md border border-gray-300">
            <Smile className="w-7 h-7 text-gray-500 mr-2" />

            <HighlightTarget
              elementId="chat_input"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
              className="flex-1"
            >
              <div className="text-xl text-gray-800 font-medium select-none">
                {screen === 'whatsapp_chat_screen_typed'
                  ? (language === 'hi' ? 'मैं ठीक हूँ बेटा...' : language === 'ml' ? 'ഞാൻ സുഖമായിരിക്കുന്നു...' : 'I am doing well son...')
                  : (language === 'hi' ? 'संदेश लिखें' : language === 'ml' ? 'സന്ദേശം എഴുതുക' : 'Message')}
              </div>
            </HighlightTarget>

            <HighlightTarget
              elementId="attachment_icon"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
              className="ml-2"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100">
                <Paperclip className="w-7 h-7 text-gray-600" />
              </div>
            </HighlightTarget>
          </div>

          {/* Action Button: Send or Mic */}
          {screen === 'whatsapp_chat_screen_typed' ? (
            <HighlightTarget
              elementId="send_button"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
            >
              <div className="w-14 h-14 bg-[#128C7E] hover:bg-[#075E54] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <Send className="w-7 h-7 text-white ml-0.5" />
              </div>
            </HighlightTarget>
          ) : (
            <HighlightTarget
              elementId="mic_record_button"
              activeHighlightId={highlightElement}
              onCorrectTap={onCorrectTap}
              onWrongTap={onWrongTap}
            >
              <div className="w-14 h-14 bg-[#128C7E] hover:bg-[#075E54] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <Mic className="w-7 h-7 text-white" />
              </div>
            </HighlightTarget>
          )}
        </div>
      )}
    </div>
  );
};
