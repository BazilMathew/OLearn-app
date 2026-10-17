import React from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { REPLICA_STRINGS, ReplicaStrings } from './replicaStrings';
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
  Lock,
  Search,
  MoreVertical,
  IndianRupee,
  MessageSquarePlus,
  MessageSquareText,
  MessageCircle,
  CircleDashed,
  Users,
  Plus
} from 'lucide-react';

interface WhatsAppReplicaProps {
  screen: string;
  highlightElement: string;
  language: SupportedLanguage;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  nudgeKey?: number;
  /** Scroll step only: the swipe hint and "Show me" button, drawn over the chat list. */
  scrollHint?: React.ReactNode;
}

// Round, inert call control (mute, speaker, camera): taps fall through to the gentle nudge
const CallControl: React.FC<{ icon: React.ElementType }> = ({ icon: Icon }) => (
  <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center">
    <Icon className="w-8 h-8 text-white" aria-hidden="true" />
  </div>
);

type TapProps = { activeHighlightId: string; onCorrectTap: () => void; onWrongTap: () => void; nudgeKey?: number };

// One app on the mock phone dock: a plain coloured tile and its name (no real logos)
const DockApp: React.FC<{ icon: React.ElementType; color: string; label: string }> = ({ icon: Icon, color, label }) => (
  <div className="flex flex-col items-center gap-xs py-xs">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: color }}>
      <Icon className="w-9 h-9 text-white" aria-hidden="true" />
    </div>
    <span className="text-label text-white text-center leading-tight">{label}</span>
  </div>
);

/**
 * Mock phone home screen where every tutorial starts. Shared by the WhatsApp and Google Pay replicas:
 * the WhatsApp and Google Pay icons are targets (only the task's own app is highlighted), Phone and Camera are inert.
 */
export const PhoneHomeScreen: React.FC<{ r: ReplicaStrings; tp: TapProps }> = ({ r, tp }) => (
  <div
    className="h-full w-full text-white flex flex-col justify-between"
    style={{ background: 'linear-gradient(180deg, #14243B 0%, #2B3D60 45%, #6E5475 75%, #B9775F 100%)' }}
  >
    <div className="px-xl pt-2xl text-right">
      <div className="text-body font-semibold">{r.homeDate}</div>
      <div className="text-[64px] leading-none font-bold tracking-tight mt-xs">12:05</div>
    </div>

    <div className="px-lg pb-lg">
      {/* Wraps to a second row only when the names are too wide (e.g. Malayalam at 18px) */}
      <div className="bg-black/50 rounded-[28px] px-sm py-sm flex flex-wrap justify-around gap-x-xs gap-y-sm">
        <div onClick={tp.onWrongTap} className="flex-auto">
          <DockApp icon={Phone} color="#1E8E3E" label={r.appPhone} />
        </div>
        <HighlightTarget elementId="home_whatsapp_icon" {...tp} className="flex-auto">
          <DockApp icon={MessageCircle} color="#075E54" label={r.appWhatsApp} />
        </HighlightTarget>
        <HighlightTarget elementId="home_gpay_icon" {...tp} className="flex-auto">
          <DockApp icon={IndianRupee} color="#1A73E8" label={r.appGPay} />
        </HighlightTarget>
        <div onClick={tp.onWrongTap} className="flex-auto">
          <DockApp icon={Camera} color="#54656F" label={r.camera} />
        </div>
      </div>
    </div>
  </div>
);

// One chat in the chat list: round avatar (initial or group icon), name, time and last message
const ChatRow: React.FC<{ name: string; msg: string; time: string; color: string; group?: boolean }> = ({
  name,
  msg,
  time,
  color,
  group
}) => (
  <div className="min-h-[80px] flex items-center gap-md px-sm py-sm">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
      style={{ background: color }}
    >
      {group ? <Users className="w-7 h-7" aria-hidden="true" /> : name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-sm">
        <span className="text-body font-bold text-ink truncate">{name}</span>
        <span className="text-label font-normal text-ink-muted flex-shrink-0">{time}</span>
      </div>
      <div className="text-label font-normal text-ink-muted truncate">{msg}</div>
    </div>
  </div>
);

export const WhatsAppReplica: React.FC<WhatsAppReplicaProps> = ({
  screen,
  highlightElement,
  language,
  onCorrectTap,
  onWrongTap,
  nudgeKey,
  scrollHint
}) => {
  const r = REPLICA_STRINGS[language] || REPLICA_STRINGS.en;
  const contactName = r.rameshSon;
  const tp = { activeHighlightId: highlightElement, onCorrectTap, onWrongTap, nudgeKey };

  // 0a. PHONE HOME SCREEN (every tutorial starts here)
  if (screen === 'phone_home_screen') {
    return <PhoneHomeScreen r={r} tp={tp} />;
  }

  // 0b. CHAT LIST: the learner scrolls it to find Ramesh's chat, then taps it
  if (screen === 'whatsapp_chat_list_screen') {
    const chats = [
      { name: `${r.priya} (${r.daughter})`, msg: r.chatListPriyaMsg, time: '11:58 AM', color: '#8430CE' },
      { name: r.chatListFamily, msg: r.chatListFamilyMsg, time: '11:40 AM', color: '#54656F', group: true },
      { name: r.shopName, msg: r.chatListShopMsg, time: '11:32 AM', color: '#A35200' },
      { name: r.chatListDoctor, msg: r.chatListDoctorMsg, time: '11:20 AM', color: '#3B5BA9' },
      { name: r.chatListTemple, msg: r.chatListTempleMsg, time: '11:05 AM', color: '#54656F', group: true },
      { name: r.chatListNeighbours, msg: r.chatListNeighboursMsg, time: '10:52 AM', color: '#54656F', group: true },
      { name: r.chatListWalking, msg: r.chatListWalkingMsg, time: '10:40 AM', color: '#54656F', group: true },
      { name: r.chatListPharmacy, msg: r.chatListPharmacyMsg, time: '10:30 AM', color: '#00796B' }
    ];
    const chips = [r.chipAll, r.chipUnread, r.chipFavorites, r.chipGroups];
    const tabs: [React.ElementType, string][] = [
      [MessageSquareText, r.tabChats],
      [CircleDashed, r.tabUpdates],
      [Users, r.tabCommunities],
      [Phone, r.tabCalls]
    ];

    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        {/* Header: title, payments, camera and menu (inert) */}
        <div className="flex items-center justify-between gap-sm pl-lg pr-xs py-xs">
          <span className="text-title text-wa-teal">WhatsApp</span>
          <div className="flex items-center flex-shrink-0">
            <div onClick={onWrongTap} className="w-16 h-16 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-ink flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-ink" aria-hidden="true" />
              </div>
            </div>
            <div onClick={onWrongTap} className="w-16 h-16 rounded-full flex items-center justify-center">
              <Camera className="w-7 h-7 text-ink" aria-hidden="true" />
            </div>
            <div onClick={onWrongTap} className="w-16 h-16 rounded-full flex items-center justify-center">
              <MoreVertical className="w-7 h-7 text-ink" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          {/* Its own scrolling area: search, filter chips and chats. The bottom padding lets the
              last chat rise above the floating new-chat button. */}
          <div
            data-scroll-area
            tabIndex={0}
            aria-label={r.tabChats}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-[96px] outline-none"
            style={{ touchAction: 'pan-y' }}
          >
            <div onClick={onWrongTap} className="mx-lg mt-xs min-h-[64px] rounded-full bg-[#F0F2F5] flex items-center gap-md px-lg">
              <Search className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
              <span className="text-body text-ink-muted">{r.search}</span>
            </div>

            <div className="flex flex-wrap gap-x-sm px-lg pt-xs">
              {chips.map((chip, i) => (
                <div key={chip} onClick={onWrongTap} className="py-sm">
                  <div
                    className={`min-h-[48px] px-lg rounded-full border-2 flex items-center text-label ${
                      i === 0 ? 'bg-[#D9FDD3] border-[#B6E9AE] text-[#0A3D2E]' : 'bg-white border-line text-ink-muted'
                    }`}
                  >
                    {chip}
                  </div>
                </div>
              ))}
              <div onClick={onWrongTap} className="py-sm">
                <div className="w-[56px] min-h-[48px] rounded-full border-2 border-line flex items-center justify-center">
                  <Plus className="w-6 h-6 text-ink-muted" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="pt-xs">
              {chats.map((chat) => (
                <div key={chat.name} onClick={onWrongTap} className="mx-lg">
                  <ChatRow {...chat} />
                </div>
              ))}
              <HighlightTarget elementId="chat_row_ramesh" {...tp} autoScroll={!scrollHint} className="mx-lg">
                <ChatRow name={contactName} msg={r.chatReceived} time="10:15 AM" color="#128C7E" />
              </HighlightTarget>
            </div>
          </div>

          {/* Floating new-chat button (inert) */}
          <div
            data-scroll-cover
            onClick={onWrongTap}
            className="absolute right-lg bottom-lg z-20 w-16 h-16 rounded-2xl bg-wa-green flex items-center justify-center"
          >
            <MessageSquarePlus className="w-8 h-8 text-white" aria-hidden="true" />
          </div>

          {scrollHint && <div className="absolute inset-0 z-50 pointer-events-none">{scrollHint}</div>}
        </div>

        {/* Bottom tabs: Chats is selected and named; the other tabs are inert icons (named for screen readers),
            because four names at 18px do not fit one row in every language */}
        <div className="flex border-t border-[#E9EDEF] bg-white px-xs">
          {tabs.map(([Icon, label], i) => (
            <div
              key={label}
              onClick={onWrongTap}
              aria-label={i === 0 ? undefined : label}
              className={`min-h-[64px] flex flex-col items-center justify-center gap-xs py-xs ${i === 0 ? 'flex-none px-sm' : 'flex-1 min-w-[64px]'}`}
            >
              <div className={`w-16 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#D9FDD3]' : ''}`}>
                <Icon className={`text-ink ${i === 0 ? 'w-6 h-6' : 'w-7 h-7'}`} aria-hidden="true" />
              </div>
              {i === 0 && <span className="text-label font-bold text-ink text-center leading-tight">{label}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

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
        <div className="bg-white rounded-t-[28px] px-lg pt-md pb-lg border-t-2 border-line z-30 screen-enter">
          <div className="w-12 h-1.5 bg-line rounded-full mx-auto mb-lg" aria-hidden="true" />
          <div className="text-body font-bold text-ink mb-md text-center">
            {r.shareContent}
          </div>
          {/* One option per row so long labels (e.g. Malayalam ഡോക്യുമെന്റ്) never break mid-word */}
          <div className="space-y-sm">
            <HighlightTarget elementId="gallery_icon" {...tp}>
              <div className="min-h-[72px] flex items-center gap-lg px-md py-sm">
                <div className="w-14 h-14 bg-[#BF59CF] rounded-full flex items-center justify-center flex-shrink-0">
                  <Image className="w-7 h-7 text-white" />
                </div>
                <span className="text-body font-bold text-ink">
                  {r.gallery}
                </span>
              </div>
            </HighlightTarget>

            <div onClick={onWrongTap} className="min-h-[72px] flex items-center gap-lg px-md py-sm">
              <div className="w-14 h-14 bg-[#FF2E74] rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <span className="text-body font-bold text-ink">{r.camera}</span>
            </div>

            <div onClick={onWrongTap} className="min-h-[72px] flex items-center gap-lg px-md py-sm">
              <div className="w-14 h-14 bg-[#7F66FF] rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <span className="text-body font-bold text-ink">{r.document}</span>
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
