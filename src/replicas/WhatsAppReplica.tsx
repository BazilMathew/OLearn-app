import React, { useLayoutEffect, useRef } from 'react';
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
  Images,
  FileText,
  Minimize2,
  MoreHorizontal,
  Pause,
  SwitchCamera,
  UserPlus,
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
  Plus,
  Play
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

// Accessible green for WhatsApp's round buttons and accents on white (4.9:1 with white)
const WA_ACCENT = '#008069';

// Round, inert call control with its name below (speaker, camera, mic): taps fall through to the gentle nudge
const CallControl: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-xs min-w-0">
    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
      <Icon className="w-8 h-8 text-ink" aria-hidden="true" />
    </div>
    <span className="text-label font-normal text-ink text-center leading-tight">{label}</span>
  </div>
);

// Light call panel: two rows of three controls, the red end-call button last (bottom right)
const CallPanel: React.FC<{ controls: [React.ElementType, string][]; endLabel: string; children: React.ReactNode }> = ({
  controls,
  endLabel,
  children
}) => (
  <div className="w-full bg-[#F0F2F5] rounded-[28px] px-sm py-lg grid grid-cols-3 gap-x-xs gap-y-md">
    {controls.map(([icon, label]) => (
      <CallControl key={label} icon={icon} label={label} />
    ))}
    <div className="flex flex-col items-center gap-xs min-w-0">
      {children}
      <span className="text-label font-normal text-ink text-center leading-tight">{endLabel}</span>
    </div>
  </div>
);

// Red round end-call button drawn inside the call screens' end-call target
const EndCallCircle: React.FC = () => (
  <div className="w-16 h-16 bg-[#E5253B] rounded-full flex items-center justify-center">
    <PhoneOff className="w-8 h-8 text-white" />
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
        <span className="text-body font-semibold text-ink truncate">{name}</span>
        <span className="text-label font-normal text-ink-muted flex-shrink-0">{time}</span>
      </div>
      <div className="text-label font-normal text-ink-muted truncate">{msg}</div>
    </div>
  </div>
);

// Outgoing message bubble with time and blue ticks; fades in once when it appears.
// As in the app, the chat scrolls to the newest message so the bubble is in view.
const SentBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const chat = ref.current?.parentElement;
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, []);
  return (
    <div ref={ref} data-sent-bubble className="flex justify-end screen-enter">
      <div className="relative bg-[#D9FDD3] text-ink rounded-[10px] rounded-tr-none px-md pt-sm pb-xs max-w-[85%] shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
        <span className="absolute -right-2 top-0 w-0 h-0 border-t-[12px] border-t-[#D9FDD3] border-r-[10px] border-r-transparent" aria-hidden="true" />
        {children}
        <div className="text-label font-normal text-ink-muted text-right mt-xs flex items-center justify-end gap-xs">
          <span>10:16 AM</span>
          <CheckCheck className="w-5 h-5 text-[#027EB5]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

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
          <span className="text-title" style={{ color: WA_ACCENT }}>WhatsApp</span>
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
            <div onClick={onWrongTap} className="mx-lg mt-xs min-h-[64px] rounded-full bg-[#F6F5F3] flex items-center gap-md px-lg">
              <Search className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
              <span className="text-body text-ink-muted">{r.search}</span>
            </div>

            <div className="flex flex-wrap gap-x-sm px-lg pt-xs">
              {chips.map((chip, i) => (
                <div key={chip} onClick={onWrongTap} className="py-sm">
                  <div
                    className={`min-h-[48px] px-lg rounded-full border flex items-center text-label ${
                      i === 0 ? 'bg-[#D9FDD3] border-[#D9FDD3] text-[#0A3D2E]' : 'bg-white border-[#D1D7DB] text-ink-muted'
                    }`}
                  >
                    {chip}
                  </div>
                </div>
              ))}
              <div onClick={onWrongTap} className="py-sm">
                <div className="w-[56px] min-h-[48px] rounded-full border border-[#D1D7DB] flex items-center justify-center">
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
            className="absolute right-lg bottom-lg z-20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_2px_6px_rgba(11,20,26,0.25)]"
            style={{ background: WA_ACCENT }}
          >
            <MessageSquarePlus className="w-8 h-8 text-white" aria-hidden="true" />
          </div>

          {scrollHint && <div className="absolute inset-0 z-50 pointer-events-none">{scrollHint}</div>}
        </div>

        {/* Bottom tabs (inert), Chats selected. Each tab is as wide as its name, so all four names fit one row
            at 18px in English and Hindi. The Malayalam names do not fit 360px: there only Chats is named and
            the other tabs are icons (named for screen readers). */}
        <div className="flex justify-between border-t border-[#E9EDEF] bg-white px-xs">
          {tabs.map(([Icon, label], i) => {
            const named = i === 0 || language !== 'ml';
            return (
              <div
                key={label}
                onClick={onWrongTap}
                aria-label={named ? undefined : label}
                className={`min-h-[64px] min-w-[64px] flex flex-col items-center justify-center gap-xs py-xs ${
                  named ? 'flex-auto px-xs' : 'flex-1'
                }`}
              >
                <div className={`w-16 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#D9FDD3]' : ''}`}>
                  <Icon className={`text-ink ${named ? 'w-6 h-6' : 'w-7 h-7'}`} aria-hidden="true" />
                </div>
                {named && (
                  <span className={`text-label text-ink text-center leading-tight whitespace-nowrap ${i === 0 ? 'font-bold' : 'font-normal'}`}>
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 1. ACTIVE VOICE CALL SCREEN
  if (screen === 'whatsapp_active_voice_call') {
    return (
      <div className="min-h-full shrink-0 w-full bg-white text-ink flex flex-col justify-between items-center gap-lg pt-sm pb-lg px-lg">
        {/* Top: minimise (inert), then the name and a padlock line */}
        <div className="w-full flex items-start gap-xs">
          <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center flex-shrink-0">
            <Minimize2 className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 text-center pt-xs">
            <div className="text-body font-bold text-ink">{contactName}</div>
            <div className="flex items-center justify-center gap-xs text-label font-normal text-ink-muted">
              <Lock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{r.callSecure}</span>
            </div>
          </div>
          <div className="w-16 flex-shrink-0" aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-sm text-center">
          <div className="w-28 h-28 bg-wa-green text-white rounded-full flex items-center justify-center text-5xl font-bold">
            {r.rameshInitial}
          </div>
          <div className="text-body text-ink font-semibold tracking-wider">00:14</div>
          <div className="text-label text-ink-muted font-normal">{r.voiceCallInProgress}</div>
        </div>

        <CallPanel
          controls={[
            [Volume2, r.callSpeaker],
            [Video, r.camera],
            [MicOff, r.callMicOff],
            [MoreHorizontal, r.callOptions],
            [UserPlus, r.callAddPeople]
          ]}
          endLabel={r.endCall}
        >
          <HighlightTarget elementId="end_call_button" {...tp} className="rounded-full">
            <EndCallCircle />
          </HighlightTarget>
        </CallPanel>
      </div>
    );
  }

  // 2. ACTIVE VIDEO CALL SCREEN
  if (screen === 'whatsapp_active_video_call') {
    return (
      <div className="min-h-full shrink-0 w-full bg-white text-ink flex flex-col gap-lg p-lg">
        {/* Mock remote video (soft light placeholder) with the self view in its top right corner */}
        <div className="relative flex-1 min-h-[260px] rounded-[28px] bg-gradient-to-b from-[#E3E8EC] to-[#F7F8FA] flex flex-col items-center justify-center text-center px-md">
          <div className="w-28 h-28 bg-wa-green rounded-full flex items-center justify-center text-5xl mb-md">
            👨
          </div>
          <div className="text-title text-ink">{contactName}</div>
          <div className="text-body text-ink-muted font-semibold mt-xs">00:22</div>

          <div className="absolute top-md right-md w-24 h-32 bg-[#C9D3DA] border-2 border-white rounded-2xl flex flex-col items-center justify-center overflow-hidden">
            <span className="text-4xl">👵</span>
            <span className="text-label text-ink mt-xs">{r.you}</span>
          </div>
        </div>

        <CallPanel
          controls={[
            [SwitchCamera, r.switchCamera],
            [VideoOff, r.cameraOff],
            [MicOff, r.callMicOff],
            [MoreHorizontal, r.callOptions],
            [Volume2, r.callSpeaker]
          ]}
          endLabel={r.endCall}
        >
          <HighlightTarget elementId="end_call_button" {...tp} className="rounded-full">
            <EndCallCircle />
          </HighlightTarget>
        </CallPanel>
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
              <Send className="w-8 h-8 text-white ml-0.5" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 4. GALLERY SELECTION SCREEN: several photos and a video, as in the app. Any could be sent;
  // the flower is the practice choice. Names are for screen readers only, as thumbnails have none.
  if (screen === 'whatsapp_gallery_screen') {
    const tile = 'aspect-square rounded-xl flex items-center justify-center text-5xl';
    const others: [string, string | undefined][] = [
      ['from-sky-400 to-indigo-700', r.temple],
      ['from-emerald-400 to-teal-700', r.grandchild],
      ['from-rose-400 to-pink-700', r.birthday],
      ['from-amber-200 to-rose-400', undefined]
    ];
    const emoji = ['🛕', '👶', '🎂', '🌅'];

    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <div className="bg-white flex items-center gap-md px-lg py-md border-b border-[#E9EDEF]">
          <ArrowLeft className="w-7 h-7 text-ink flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-title text-ink">{r.allPhotos}</div>
            <div className="text-label font-normal text-ink-muted">{r.galleryRecent}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-sm p-lg">
          <HighlightTarget elementId="photo_thumbnail_1" {...tp} className="rounded-xl">
            <div aria-label={r.flower} className={`${tile} bg-gradient-to-br from-amber-300 to-orange-500`}>
              <span aria-hidden="true">🌸</span>
            </div>
          </HighlightTarget>

          {others.map(([colors, label], i) => (
            <div key={colors} onClick={onWrongTap} aria-label={label} className={`${tile} bg-gradient-to-br ${colors}`}>
              <span aria-hidden="true">{emoji[i]}</span>
            </div>
          ))}

          {/* Video thumbnail: camera icon and length at the bottom */}
          <div data-gallery-video onClick={onWrongTap} className={`${tile} relative bg-gradient-to-br from-slate-600 to-slate-900`}>
            <span aria-hidden="true">🎆</span>
            <div className="absolute left-xs bottom-xs flex items-center gap-xs text-white text-label font-bold">
              <Video className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>0:15</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. STANDARD CHAT SCREEN / ATTACHMENT SHEET / DIALOGS
  return (
    <div className="h-full w-full flex flex-col justify-between bg-wa-bg relative">
      {/* WhatsApp Header (light): back, avatar, name and status, then video and voice call.
          16px on the right keeps the call icon's pointer badge on screen. */}
      <div className="bg-white text-ink pl-xs pr-lg py-md flex items-center justify-between z-10">
        <div className="flex items-center gap-xs min-w-0 flex-1">
          <ArrowLeft className="w-7 h-7 text-ink flex-shrink-0" aria-hidden="true" />
          <div className="w-9 h-9 bg-wa-green text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
            {r.rameshInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body font-semibold leading-tight break-words">{contactName}</div>
            <div className="text-label text-ink-muted font-normal whitespace-nowrap">{r.online}</div>
          </div>
        </div>

        {/* Call and Video Call Icons in Header */}
        <div className="flex items-center flex-shrink-0">
          <HighlightTarget elementId="video_call_icon" {...tp} className="rounded-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-ink" />
            </div>
          </HighlightTarget>

          <HighlightTarget elementId="voice_call_icon" {...tp} className="rounded-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-ink" />
            </div>
          </HighlightTarget>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 px-lg py-md space-y-sm overflow-y-auto">
        <div className="flex justify-center">
          <span className="bg-white text-ink-muted text-label px-md py-xs rounded-lg shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            {r.today}
          </span>
        </div>

        {/* Received Message Bubble */}
        <div className="flex justify-start">
          <div className="relative bg-white text-ink rounded-[10px] rounded-tl-none px-md pt-sm pb-xs max-w-[85%] shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            <span className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-white border-l-[10px] border-l-transparent" aria-hidden="true" />
            <p className="text-body leading-snug">
              {r.chatReceived}
            </p>
            <div className="text-label font-normal text-ink-muted text-right mt-xs">10:15 AM</div>
          </div>
        </div>

        {/* Result screens, shown only after the final Send tap: the sent message, photo or voice note */}
        {screen === 'whatsapp_chat_screen_sent' && (
          <SentBubble>
            <p className="text-body leading-snug">{r.chatSent}</p>
          </SentBubble>
        )}
        {screen === 'whatsapp_chat_screen_photo_sent' && (
          <SentBubble>
            <div className="w-[200px] max-w-full h-[150px] rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-6xl">
              <span aria-label={r.flower}>🌸</span>
            </div>
          </SentBubble>
        )}
        {screen === 'whatsapp_chat_screen_voice_sent' && (
          <SentBubble>
            <div className="flex items-center gap-sm">
              <Play className="w-7 h-7 text-ink-muted fill-current flex-shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-[3px] h-8" aria-hidden="true">
                {[10, 18, 26, 14, 30, 20, 12, 24, 16, 8].map((h, i) => (
                  <span key={i} className="w-[3px] rounded-full bg-ink-muted" style={{ height: h }} />
                ))}
              </div>
              <span className="text-label font-normal text-ink-muted">0:04</span>
            </div>
          </SentBubble>
        )}
      </div>

      {/* Voice Call Confirmation Dialog */}
      {screen === 'whatsapp_call_confirm_dialog' && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center p-xl">
          <div className="bg-white rounded-[28px] p-xl w-full max-w-sm space-y-xl text-center screen-enter">
            <div className="w-16 h-16 bg-[#D9FDD3] rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8" style={{ color: WA_ACCENT }} />
            </div>
            <div className="text-title text-ink">
              {r.voiceCallQuestion}
            </div>
            <div className="flex gap-md">
              <button
                onClick={onWrongTap}
                className="flex-1 min-h-[64px] text-body font-bold bg-white border-2 border-[#D1D7DB] rounded-full"
                style={{ color: WA_ACCENT }}
              >
                {r.cancel}
              </button>
              <HighlightTarget elementId="dialog_call_button" {...tp} className="flex-1 rounded-full">
                <div className="w-full min-h-[64px] text-white rounded-full font-bold text-body flex items-center justify-center" style={{ background: WA_ACCENT }}>
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
          <div className="bg-white rounded-[28px] p-xl w-full max-w-sm space-y-xl text-center screen-enter">
            <div className="w-16 h-16 bg-[#D9FDD3] rounded-full flex items-center justify-center mx-auto">
              <Video className="w-8 h-8" style={{ color: WA_ACCENT }} />
            </div>
            <div className="text-title text-ink">
              {r.videoCallQuestion}
            </div>
            <div className="flex gap-md">
              <button
                onClick={onWrongTap}
                className="flex-1 min-h-[64px] text-body font-bold bg-white border-2 border-[#D1D7DB] rounded-full"
                style={{ color: WA_ACCENT }}
              >
                {r.cancel}
              </button>
              <HighlightTarget elementId="dialog_video_button" {...tp} className="flex-1 rounded-full">
                <div className="w-full min-h-[64px] text-white rounded-full font-bold text-body flex items-center justify-center px-sm" style={{ background: WA_ACCENT }}>
                  {r.startCall}
                </div>
              </HighlightTarget>
            </div>
          </div>
        </div>
      )}

      {/* Voice Note Recording Simulator: timer and a still waveform, then delete, pause and send */}
      {screen === 'whatsapp_voice_recording_screen' && (
        <div className="bg-white rounded-t-[28px] px-lg pt-md pb-md z-30 shadow-[0_-1px_0_0_#E9EDEF]">
          <div className="flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm">
              <span className="w-3.5 h-3.5 bg-[#E5253B] rounded-full flex-shrink-0" aria-hidden="true" />
              <span className="text-body font-bold text-ink">00:04</span>
            </div>
            <div className="flex items-center gap-[3px] h-8 flex-shrink-0" aria-hidden="true">
              {[10, 18, 26, 14, 30, 20, 12, 24, 16, 8].map((h, i) => (
                <span key={i} className="w-[3px] rounded-full bg-ink-muted" style={{ height: h }} />
              ))}
            </div>
          </div>
          <div className="text-label text-ink-muted font-normal leading-snug">
            {r.recordingNote}
          </div>

          <div className="flex items-center gap-sm mt-sm">
            <div className="w-16 h-16 rounded-full bg-[#FDE8EA] flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-7 h-7 text-[#C5221F]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 min-h-[64px] rounded-full bg-[#F0F2F5] flex items-center justify-center gap-sm px-md">
              <Pause className="w-6 h-6 text-ink flex-shrink-0" aria-hidden="true" />
              <span className="text-label font-bold text-ink text-center leading-tight">{r.pauseRecording}</span>
            </div>
            <HighlightTarget elementId="send_voice_note_button" {...tp} className="rounded-full flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
                <Send className="w-8 h-8 text-white ml-0.5" />
              </div>
            </HighlightTarget>
          </div>
        </div>
      )}

      {/* Bottom Message Input Bar. 16px at the sides keeps the round button's pointer badge on screen. */}
      {screen !== 'whatsapp_voice_recording_screen' && (
        <div className="bg-wa-bg px-lg pt-xs pb-md flex items-end gap-sm z-20">
          <div className="flex-1 min-w-0 bg-white rounded-[32px] flex items-end pl-sm shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            <div className="h-16 flex items-center flex-shrink-0">
              <Smile className="w-7 h-7 text-ink-muted" aria-hidden="true" />
            </div>

            <HighlightTarget elementId="chat_input" {...tp} className="flex-1 min-w-0 mx-xs">
              <div className="min-h-[64px] py-sm flex items-center text-body text-ink select-none min-w-0">
                {/* Wraps between words (a word breaks only if it is wider than the whole box), up to 3 lines */}
                <span className={`line-clamp-3 leading-snug break-words min-w-0 ${screen === 'whatsapp_chat_screen_typed' ? '' : 'text-ink-muted'}`}>
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
                <Send className="w-8 h-8 text-white ml-0.5" />
              </div>
            </HighlightTarget>
          ) : (
            <HighlightTarget elementId="mic_record_button" {...tp} className="rounded-full flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
                <Mic className="w-8 h-8 text-white" />
              </div>
            </HighlightTarget>
          )}
        </div>
      )}

      {/* Attachment sheet, under the message bar as in the app. One option per row so long labels
          (e.g. Malayalam ഡോക്യുമെന്റ്) never break mid-word. */}
      {screen === 'whatsapp_attachment_sheet' && (
        <div className="bg-white rounded-t-[28px] px-lg pt-sm pb-md z-30 screen-enter shadow-[0_-1px_0_0_#E9EDEF]">
          <div className="w-10 h-1 bg-[#C4C9CC] rounded-full mx-auto mb-sm" aria-hidden="true" />
          <div className="text-body font-bold text-ink mb-xs text-center">
            {r.shareContent}
          </div>
          <div>
            <HighlightTarget elementId="gallery_icon" {...tp}>
              <div className="min-h-[72px] flex items-center gap-lg px-md py-sm">
                <div className="w-14 h-10 rounded-full border border-[#D1D7DB] bg-white flex items-center justify-center flex-shrink-0">
                  <Images className="w-6 h-6 text-[#A63FC4]" />
                </div>
                <span className="text-body font-semibold text-ink">
                  {r.gallery}
                </span>
              </div>
            </HighlightTarget>

            <div onClick={onWrongTap} className="min-h-[72px] flex items-center gap-lg px-md py-sm">
              <div className="w-14 h-10 rounded-full border border-[#D1D7DB] bg-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-[#1A73E8]" />
              </div>
              <span className="text-body font-semibold text-ink">{r.document}</span>
            </div>

            <div onClick={onWrongTap} className="min-h-[72px] flex items-center gap-lg px-md py-sm">
              <div className="w-14 h-10 rounded-full border border-[#D1D7DB] bg-white flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6" style={{ color: WA_ACCENT }} />
              </div>
              <span className="text-body font-semibold text-ink">{r.camera}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
