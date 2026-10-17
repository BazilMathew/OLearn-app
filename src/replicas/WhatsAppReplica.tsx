import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { REPLICA_STRINGS } from './replicaStrings';
import {
  Phone,
  Video,
  Paperclip,
  Camera,
  Mic,
  MicOff,
  Send,
  Image,
  FileText,
  PhoneOff,
  Smile,
  ArrowLeft,
  CheckCheck,
  Volume2,
  VideoOff,
  X,
  Trash2,
  Lock
} from 'lucide-react';

interface WhatsAppReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  nudgeKey?: number;
}

// Round, inert call control (mute, speaker, camera): taps fall through to the gentle nudge
const CallControl: React.FC<{ icon: React.ElementType }> = ({ icon: Icon }) => (
  <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center">
    <Icon className="w-8 h-8 text-white" aria-hidden="true" />
  </div>
);

export const WhatsAppReplica: React.FC<WhatsAppReplicaProps> = ({
  screen,
  highlightElement,
  language,
  onCorrectTap,
  onWrongTap,
  nudgeKey
}) => {
  const r = REPLICA_STRINGS[language] || REPLICA_STRINGS.en;
  const contactName = r.rameshSon;
  const tp = { activeHighlightId: highlightElement, onCorrectTap, onWrongTap, nudgeKey };

  // 1. ACTIVE VOICE CALL SCREEN
  if (screen === 'whatsapp_active_voice_call') {
    return (
      <div className="h-full w-full bg-gradient-to-b from-wa-teal to-[#0B2E2A] text-white flex flex-col justify-between items-center pt-2xl pb-xl px-xl">
        <div className="flex flex-col items-center gap-md text-center">
          <div className="flex items-center gap-xs text-label text-white/80">
            <Lock className="w-4 h-4" aria-hidden="true" />
            <span>WhatsApp</span>
          </div>
          <div className="w-28 h-28 bg-wa-green rounded-full flex items-center justify-center text-5xl font-bold border-4 border-white/30 mt-md">
            {r.rameshInitial}
          </div>
          <div className="text-title text-white">{contactName}</div>
          <div className="text-body text-[#D9FDD3] font-semibold tracking-wider">
            00:14
          </div>
          <div className="text-label text-white/85 font-normal">
            {r.voiceCallInProgress}
          </div>
        </div>

        <div className="w-full bg-black/25 rounded-card px-lg py-lg flex items-center justify-around gap-md">
          <CallControl icon={Volume2} />
          <CallControl icon={Video} />
          <CallControl icon={MicOff} />
          <HighlightTarget elementId="end_call_button" {...tp} className="rounded-full">
            <div className="w-[72px] h-[72px] bg-[#E5253B] rounded-full flex items-center justify-center">
              <PhoneOff className="w-9 h-9 text-white" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 2. ACTIVE VIDEO CALL SCREEN
  if (screen === 'whatsapp_active_video_call') {
    return (
      <div className="h-full w-full bg-[#0B141A] text-white relative flex flex-col justify-between items-center p-xl">
        {/* Mock Remote Video Stream */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F3B37] to-[#0B141A] flex flex-col items-center justify-center">
          <div className="w-36 h-36 bg-wa-green rounded-full flex items-center justify-center text-6xl border-4 border-white/30 mb-lg">
            👨
          </div>
          <div className="text-title text-white">{contactName}</div>
          <div className="text-body text-[#D9FDD3] font-semibold mt-xs">00:22</div>
        </div>

        {/* Self View Floating Window */}
        <div className="absolute top-lg right-lg w-28 h-36 bg-[#3B4A54] border-2 border-white rounded-card flex flex-col items-center justify-center overflow-hidden z-20">
          <span className="text-4xl">👵</span>
          <span className="text-label text-white mt-xs">{r.you}</span>
        </div>

        {/* Bottom Call Controls */}
        <div className="w-full z-30 mt-auto bg-black/40 rounded-card px-lg py-lg flex items-center justify-around gap-md">
          <CallControl icon={Camera} />
          <CallControl icon={VideoOff} />
          <CallControl icon={MicOff} />
          <HighlightTarget elementId="end_call_button" {...tp} className="rounded-full">
            <div className="w-[72px] h-[72px] bg-[#E5253B] rounded-full flex items-center justify-center">
              <PhoneOff className="w-9 h-9 text-white" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 3. PHOTO PREVIEW SCREEN
  if (screen === 'whatsapp_photo_preview') {
    return (
      <div className="h-full w-full bg-black text-white flex flex-col justify-between p-lg relative">
        <div className="flex items-center gap-md py-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-bold leading-tight">{contactName}</div>
            <div className="text-label text-[#D9FDD3] font-normal">
              {r.photoPreview}
            </div>
          </div>
        </div>

        {/* Large Mock Photo in Preview */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-md">
          <div className="w-full max-w-[300px] h-full max-h-[380px] min-h-[200px] bg-gradient-to-br from-amber-300 to-orange-500 rounded-card flex flex-col items-center justify-center text-center p-xl">
            <span className="text-7xl mb-md">🌸</span>
            <div className="text-title text-ink">
              {r.beautifulFlower}
            </div>
            <div className="text-label text-ink mt-xs">
              {r.familyPhoto}
            </div>
          </div>
        </div>

        {/* Bottom Preview Controls */}
        <div className="flex items-center gap-md pt-sm">
          <div className="bg-[#1F2C34] text-white/80 px-lg min-h-[64px] flex items-center rounded-full text-body flex-1 min-w-0">
            {r.addCaption}
          </div>

          <HighlightTarget elementId="preview_send_button" {...tp} className="rounded-full flex-shrink-0">
            <div className="w-16 h-16 bg-wa-green rounded-full flex items-center justify-center">
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
      <div className="h-full w-full bg-[#0B141A] text-white flex flex-col">
        <div className="bg-[#1F2C34] flex items-center gap-md px-lg py-md">
          <ArrowLeft className="w-7 h-7 text-white flex-shrink-0" aria-hidden="true" />
          <div className="text-title text-white">
            {r.allPhotos}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-lg p-lg">
          <HighlightTarget elementId="photo_thumbnail_1" {...tp}>
            <div className="h-40 bg-gradient-to-br from-amber-300 to-orange-500 rounded-2xl p-md flex flex-col items-center justify-center text-center">
              <span className="text-5xl mb-sm">🌸</span>
              <span className="text-body font-bold text-ink">{r.flower}</span>
            </div>
          </HighlightTarget>

          <div
            onClick={onWrongTap}
            className="h-40 bg-gradient-to-br from-sky-400 to-indigo-700 rounded-2xl p-md flex flex-col items-center justify-center text-center"
          >
            <span className="text-5xl mb-sm">🛕</span>
            <span className="text-body font-bold text-white">{r.temple}</span>
          </div>

          <div
            onClick={onWrongTap}
            className="h-40 bg-gradient-to-br from-emerald-400 to-teal-700 rounded-2xl p-md flex flex-col items-center justify-center text-center"
          >
            <span className="text-5xl mb-sm">👶</span>
            <span className="text-body font-bold text-white">{r.grandchild}</span>
          </div>

          <div
            onClick={onWrongTap}
            className="h-40 bg-gradient-to-br from-rose-400 to-pink-700 rounded-2xl p-md flex flex-col items-center justify-center text-center"
          >
            <span className="text-5xl mb-sm">🎂</span>
            <span className="text-body font-bold text-white">{r.birthday}</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. STANDARD CHAT SCREEN / ATTACHMENT SHEET / DIALOGS
  return (
    <div className="h-full w-full flex flex-col justify-between bg-wa-bg relative">
      {/* WhatsApp Header */}
      <div className="bg-wa-teal text-white pl-md pr-sm py-md flex items-center justify-between gap-sm z-10">
        <div className="flex items-center gap-sm min-w-0">
          <ArrowLeft className="w-7 h-7 text-white flex-shrink-0" aria-hidden="true" />
          <div className="w-11 h-11 bg-wa-green rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
            {r.rameshInitial}
          </div>
          <div className="min-w-0">
            <div className="text-body font-bold leading-tight">{contactName}</div>
            <div className="text-label text-white/85 font-normal">{r.online}</div>
          </div>
        </div>

        {/* Call and Video Call Icons in Header */}
        <div className="flex items-center gap-xs flex-shrink-0">
          <HighlightTarget elementId="video_call_icon" {...tp} className="rounded-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="voice_call_icon" {...tp} className="rounded-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-white" />
            </div>
          </HighlightTarget>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 px-lg py-lg space-y-md overflow-y-auto">
        <div className="flex justify-center">
          <span className="bg-[#FFF5C4] text-ink text-label px-lg py-xs rounded-xl border border-[#E9DA9A]">
            {r.today}
          </span>
        </div>

        {/* Received Message Bubble */}
        <div className="flex justify-start">
          <div className="relative bg-white text-ink rounded-2xl rounded-tl-none px-md pt-sm pb-xs max-w-[85%] shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            <span className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-white border-l-[10px] border-l-transparent" aria-hidden="true" />
            <p className="text-body leading-snug">
              {r.chatReceived}
            </p>
            <div className="text-label font-normal text-ink-muted text-right mt-xs">10:15 AM</div>
          </div>
        </div>

        {/* Typed message preview when in step 2 of sending text */}
        {screen === 'whatsapp_chat_screen_typed' && (
          <div className="flex justify-end">
            <div className="relative bg-[#D9FDD3] text-ink rounded-2xl rounded-tr-none px-md pt-sm pb-xs max-w-[85%] shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
              <span className="absolute -right-2 top-0 w-0 h-0 border-t-[12px] border-t-[#D9FDD3] border-r-[10px] border-r-transparent" aria-hidden="true" />
              <p className="text-body leading-snug">
                {r.chatSent}
              </p>
              <div className="text-label font-normal text-ink-muted text-right mt-xs flex items-center justify-end gap-xs">
                <span>10:16 AM</span>
                <CheckCheck className="w-5 h-5 text-[#027EB5]" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attachment Tray Popup */}
      {screen === 'whatsapp_attachment_sheet' && (
        <div className="bg-white rounded-t-[28px] px-lg pt-lg pb-xl border-t-2 border-line z-30 screen-enter">
          <div className="w-12 h-1.5 bg-line rounded-full mx-auto mb-lg" aria-hidden="true" />
          <div className="text-body font-bold text-ink mb-lg text-center">
            {r.shareContent}
          </div>
          <div className="grid grid-cols-3 gap-sm">
            <HighlightTarget elementId="gallery_icon" {...tp}>
              <div className="flex flex-col items-center py-xs">
                <div className="w-16 h-16 bg-[#BF59CF] rounded-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-white" />
                </div>
                <span className="text-label text-ink mt-sm text-center leading-tight [overflow-wrap:anywhere]">
                  {r.gallery}
                </span>
              </div>
            </HighlightTarget>

            <div onClick={onWrongTap} className="flex flex-col items-center py-xs">
              <div className="w-16 h-16 bg-[#FF2E74] rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <span className="text-label text-ink mt-sm text-center leading-tight [overflow-wrap:anywhere]">{r.camera}</span>
            </div>

            <div onClick={onWrongTap} className="flex flex-col items-center py-xs">
              <div className="w-16 h-16 bg-[#7F66FF] rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <span className="text-label text-ink mt-sm text-center leading-tight [overflow-wrap:anywhere]">{r.document}</span>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Confirmation Dialog */}
      {screen === 'whatsapp_call_confirm_dialog' && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center p-xl">
          <div className="bg-white rounded-card p-xl w-full max-w-sm space-y-xl text-center screen-enter">
            <div className="w-16 h-16 bg-[#D9FDD3] rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-wa-teal" />
            </div>
            <div className="text-title text-ink">
              {r.voiceCallQuestion}
            </div>
            <div className="flex gap-md">
              <button
                onClick={onWrongTap}
                className="flex-1 min-h-[64px] text-body font-bold text-wa-teal bg-white border-2 border-line rounded-full"
              >
                {r.cancel}
              </button>
              <HighlightTarget elementId="dialog_call_button" {...tp} className="flex-1 rounded-full">
                <div className="w-full min-h-[64px] bg-wa-teal text-white rounded-full font-bold text-body flex items-center justify-center">
                  {r.call}
                </div>
              </HighlightTarget>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Confirmation Dialog */}
      {screen === 'whatsapp_video_confirm_dialog' && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center p-xl">
          <div className="bg-white rounded-card p-xl w-full max-w-sm space-y-xl text-center screen-enter">
            <div className="w-16 h-16 bg-[#D9FDD3] rounded-full flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-wa-teal" />
            </div>
            <div className="text-title text-ink">
              {r.videoCallQuestion}
            </div>
            <div className="flex gap-md">
              <button
                onClick={onWrongTap}
                className="flex-1 min-h-[64px] text-body font-bold text-wa-teal bg-white border-2 border-line rounded-full"
              >
                {r.cancel}
              </button>
              <HighlightTarget elementId="dialog_video_button" {...tp} className="flex-1 rounded-full">
                <div className="w-full min-h-[64px] bg-wa-teal text-white rounded-full font-bold text-body flex items-center justify-center px-sm">
                  {r.startCall}
                </div>
              </HighlightTarget>
            </div>
          </div>
        </div>
      )}

      {/* Voice Note Recording Simulator */}
      {screen === 'whatsapp_voice_recording_screen' && (
        <div className="bg-white px-md py-md flex items-center justify-between gap-md border-t-2 border-line z-30">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-7 h-7 text-ink-muted" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-sm">
              <span className="w-3.5 h-3.5 bg-[#E5253B] rounded-full flex-shrink-0" aria-hidden="true" />
              <span className="text-body font-bold text-ink">00:04</span>
            </div>
            <div className="text-label text-ink-muted font-normal leading-snug">
              {r.recordingNote}
            </div>
          </div>

          <HighlightTarget elementId="send_voice_note_button" {...tp} className="rounded-full flex-shrink-0">
            <div className="w-16 h-16 bg-wa-green rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-white ml-0.5" />
            </div>
          </HighlightTarget>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      {screen !== 'whatsapp_voice_recording_screen' && (
        <div className="bg-wa-bg px-sm pt-xs pb-md flex items-end gap-sm z-20">
          <div className="flex-1 min-w-0 bg-white rounded-[32px] flex items-center pl-md pr-xs shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            <Smile className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />

            <HighlightTarget elementId="chat_input" {...tp} className="flex-1 min-w-0 mx-sm">
              <div className="min-h-[64px] flex items-center text-body text-ink select-none min-w-0">
                <span className={`line-clamp-2 leading-tight [overflow-wrap:anywhere] ${screen === 'whatsapp_chat_screen_typed' ? '' : 'text-ink-muted'}`}>
                  {screen === 'whatsapp_chat_screen_typed'
                    ? (r.chatTyped)
                    : (r.messagePlaceholder)}
                </span>
              </div>
            </HighlightTarget>

            <HighlightTarget elementId="attachment_icon" {...tp} className="rounded-full flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <Paperclip className="w-7 h-7 text-ink-muted -rotate-45" />
              </div>
            </HighlightTarget>
          </div>

          {/* Action Button: Send or Mic */}
          {screen === 'whatsapp_chat_screen_typed' ? (
            <HighlightTarget elementId="send_button" {...tp} className="rounded-full flex-shrink-0">
              <div className="w-16 h-16 bg-wa-green rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-white ml-0.5" />
              </div>
            </HighlightTarget>
          ) : (
            <HighlightTarget elementId="mic_record_button" {...tp} className="rounded-full flex-shrink-0">
              <div className="w-16 h-16 bg-wa-green rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </HighlightTarget>
          )}
        </div>
      )}
    </div>
  );
};
