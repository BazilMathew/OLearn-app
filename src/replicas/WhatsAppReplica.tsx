import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SupportedLanguage } from '../types/task';
import { HighlightTarget } from '../engine/HighlightTarget';
import { REPLICA_STRINGS, ReplicaStrings } from './replicaStrings';
import { MOCK_CHAT_PHONES, UNKNOWN_NUMBER } from '../config/mockData';
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
  Play,
  MapPin,
  User,
  ListChecks,
  CalendarDays,
  ImagePlus,
  Menu,
  Folder,
  RefreshCw,
  Radio,
  FileImage,
  Forward,
  Reply,
  Star,
  Copy,
  Ban,
  ShieldCheck,
  Pencil,
  Music,
  LayoutPanelLeft,
  Check,
  Palette,
  Type
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

// One chat in the chat list: round avatar (initial, group or person icon), name, time and last message,
// and a green unread count when there is one
const ChatRow: React.FC<{ name: string; msg: string; time: string; color: string; group?: boolean; unknown?: boolean; unread?: number }> = ({
  name,
  msg,
  time,
  color,
  group,
  unknown,
  unread
}) => (
  <div className="min-h-[80px] flex items-center gap-md px-sm py-sm">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
      style={{ background: color }}
    >
      {group ? <Users className="w-7 h-7" aria-hidden="true" /> : unknown ? <User className="w-7 h-7" aria-hidden="true" /> : name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-sm">
        <span className="text-body font-semibold text-ink truncate">{name}</span>
        <span className={`text-label flex-shrink-0 ${unread ? 'font-bold' : 'font-normal text-ink-muted'}`} style={unread ? { color: WA_ACCENT } : undefined}>
          {time}
        </span>
      </div>
      <div className="flex items-center gap-sm">
        <div className="flex-1 min-w-0 text-label font-normal text-ink-muted truncate">{msg}</div>
        {!!unread && (
          <span className="min-w-[28px] h-7 px-xs rounded-full text-white text-label font-bold flex items-center justify-center flex-shrink-0" style={{ background: WA_ACCENT }}>
            {unread}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Bottom tabs of the chat list and Updates (inert but for Updates, a target in the status task). Each tab is as
// wide as its name, so all four names fit one row at 18px in English and Hindi. The Malayalam names do not fit
// 360px: there only the selected tab (and Updates while it is the step's target) is named and the other tabs are
// icons (named for screen readers). While Updates is the target, room below it keeps its ring on screen.
const BottomTabs: React.FC<{ r: ReplicaStrings; language: SupportedLanguage; selected: number; tp: TapProps }> = ({ r, language, selected, tp }) => {
  const tabs: [React.ElementType, string][] = [
    [MessageSquareText, r.tabChats],
    [CircleDashed, r.tabUpdates],
    [Users, r.tabCommunities],
    [Phone, r.tabCalls]
  ];
  return (
    <div className={`flex justify-between border-t border-[#E9EDEF] bg-white px-xs ${tp.activeHighlightId === 'tab_updates' ? 'pb-md' : ''}`}>
      {tabs.map(([Icon, label], i) => {
        const named = i === selected || language !== 'ml' || (i === 1 && tp.activeHighlightId === 'tab_updates');
        const className = `min-h-[64px] min-w-[64px] flex flex-col items-center justify-center gap-xs py-xs ${named ? 'flex-auto px-xs' : 'flex-1'}`;
        const content = (
          <>
            <div className={`w-16 h-8 rounded-full flex items-center justify-center ${i === selected ? 'bg-[#D9FDD3]' : ''}`}>
              <Icon className={`text-ink ${named ? 'w-6 h-6' : 'w-7 h-7'}`} aria-hidden="true" />
            </div>
            {named && (
              <span className={`text-label text-ink text-center leading-tight whitespace-nowrap ${i === selected ? 'font-bold' : 'font-normal'}`}>
                {label}
              </span>
            )}
          </>
        );
        return i === 1 ? (
          <HighlightTarget key={label} elementId="tab_updates" {...tp} className={className}>
            <div aria-label={named ? undefined : label} className="contents">{content}</div>
          </HighlightTarget>
        ) : (
          <div key={label} onClick={tp.onWrongTap} aria-label={named ? undefined : label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
};

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

// The sample chats of the chat list, top to bottom (Ramesh last). The chat search looks through the same chats.
type SampleChat = { key: string; name: string; msg: string; time: string; color: string; group?: boolean };
const sampleChats = (r: ReplicaStrings): SampleChat[] => [
  { key: 'priya', name: `${r.priya} (${r.daughter})`, msg: r.chatListPriyaMsg, time: '11:58 AM', color: '#8430CE' },
  { key: 'family', name: r.chatListFamily, msg: r.chatListFamilyMsg, time: '11:40 AM', color: '#54656F', group: true },
  { key: 'shop', name: r.shopName, msg: r.chatListShopMsg, time: '11:32 AM', color: '#A35200' },
  { key: 'doctor', name: r.chatListDoctor, msg: r.chatListDoctorMsg, time: '11:20 AM', color: '#3B5BA9' },
  { key: 'temple', name: r.chatListTemple, msg: r.chatListTempleMsg, time: '11:05 AM', color: '#54656F', group: true },
  { key: 'neighbours', name: r.chatListNeighbours, msg: r.chatListNeighboursMsg, time: '10:52 AM', color: '#54656F', group: true },
  { key: 'walking', name: r.chatListWalking, msg: r.chatListWalkingMsg, time: '10:40 AM', color: '#54656F', group: true },
  { key: 'pharmacy', name: r.chatListPharmacy, msg: r.chatListPharmacyMsg, time: '10:30 AM', color: '#00796B' },
  { key: 'ramesh', name: r.rameshSon, msg: r.chatReceived, time: '10:15 AM', color: '#128C7E' }
];

// Chat search: a query with digits finds chats by phone number, anything else by name (in the shown
// language or in English). The query lives only in the replica's state: never stored, logged or sent.
const searchChats = (query: string, r: ReplicaStrings): SampleChat[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const en = sampleChats(REPLICA_STRINGS.en);
  const digits = q.replace(/\D/g, '');
  return sampleChats(r).filter((chat, i) => {
    if (digits) {
      const phone = MOCK_CHAT_PHONES[chat.key];
      return !!phone && phone.replace(/\D/g, '').includes(digits);
    }
    return chat.name.toLowerCase().includes(q) || en[i].name.toLowerCase().includes(q);
  });
};

// Practice photos in the document picker's Recent files (invented names); any of them can be sent
const DOC_FILES = [
  { name: 'Family_photo_01.jpg', size: '2.1 MB', time: '10:12 AM', colors: 'from-sky-300 to-indigo-500', emoji: '👪' },
  { name: 'Garden_flower.jpg', size: '3.4 MB', time: '9:48 AM', colors: 'from-amber-300 to-orange-500', emoji: '🌼' },
  { name: 'Sunrise_view.jpg', size: '2.6 MB', time: '9:05 AM', colors: 'from-rose-300 to-amber-400', emoji: '🌅' }
];

// Ramesh's messages in the forward task, top to bottom; any of them can be held and forwarded
const FWD_MESSAGES = [
  { key: 'greeting', time: '9:40 AM' },
  { key: 'photo', time: '9:52 AM' },
  { key: 'festival', time: '10:15 AM' }
];

// Press and hold: the time a finger must stay down, and how far it may drift before the hold is dropped
// (a drift or a scroll is not a tap: no nudge)
const HOLD_MS = 400;
const HOLD_SLOP_PX = 14;

// A forwarded or held message's content: text, or the flower photo. The photo is a drawing, not an image file;
// it ignores the pointer and cannot be dragged, so the phone's own image long-press never takes over the hold.
const FwdContent: React.FC<{ msgKey: string; r: ReplicaStrings }> = ({ msgKey, r }) =>
  msgKey === 'photo' ? (
    <div
      draggable={false}
      className="w-[200px] max-w-full h-[150px] rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-6xl pointer-events-none [-webkit-user-drag:none]"
    >
      <span aria-label={r.flower}>🌸</span>
    </div>
  ) : (
    <p className="text-body leading-snug">{msgKey === 'festival' ? r.fwdMsg : r.chatReceived}</p>
  );

// Received message bubble (white, tail on the left) with its time
const ReceivedBubble: React.FC<{ time: string; children: React.ReactNode }> = ({ time, children }) => (
  <div className="relative bg-white text-ink rounded-[10px] rounded-tl-none px-md pt-sm pb-xs max-w-[85%] shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
    <span className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-white border-l-[10px] border-l-transparent" aria-hidden="true" />
    {children}
    <div className="text-label font-normal text-ink-muted text-right mt-xs">{time}</div>
  </div>
);

// One row of the Forward to list: avatar, name and a round tick box
const ForwardRow: React.FC<{ chat: SampleChat; ticked: boolean }> = ({ chat, ticked }) => (
  <div className="min-h-[72px] flex items-center gap-md px-sm py-xs">
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
      style={{ background: chat.color }}
    >
      {chat.group ? <Users className="w-6 h-6" aria-hidden="true" /> : chat.name.charAt(0)}
    </div>
    <span className="flex-1 min-w-0 text-body text-ink truncate">{chat.name}</span>
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ticked ? '' : 'border-2 border-ink-muted'}`}
      style={ticked ? { background: WA_ACCENT } : undefined}
      aria-hidden="true"
    >
      {ticked && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
    </span>
  </div>
);

// Status card on the Updates tab: a coloured picture with the person's round photo and name
const StatusCard: React.FC<{ name: string; initial: string; colors: string; emoji: string }> = ({ name, initial, colors, emoji }) => (
  <div className={`relative w-full h-[168px] rounded-2xl overflow-hidden bg-gradient-to-br ${colors}`}>
    <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">{emoji}</span>
    <div className="absolute top-sm left-sm w-11 h-11 rounded-full border-[3px] border-[#1DAA61] bg-[#54656F] text-white text-label font-bold flex items-center justify-center">
      {initial}
    </div>
    <div className="absolute inset-x-0 bottom-0 px-sm pb-sm pt-lg bg-gradient-to-t from-black/80 to-black/0 text-white text-label font-bold leading-tight break-words">
      {name}
    </div>
  </div>
);

// Inert filter chip (chat search and document picker)
const Chip: React.FC<{ label: string; onTap: () => void }> = ({ label, onTap }) => (
  <div onClick={onTap} className="py-xs">
    <div className="min-h-[48px] px-lg rounded-full border border-[#D1D7DB] bg-white flex items-center text-label font-normal text-ink-muted">
      {label}
    </div>
  </div>
);

// Simple neutral map drawing: no labels, no place names, no provider logo. Green dots are places, the blue dot is you.
const MapArt: React.FC = () => (
  <svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full block" aria-hidden="true">
    <rect width="360" height="160" fill="#F1EFEC" />
    <path d="M0 0 L46 0 L30 160 L0 160 Z" fill="#D4EFDB" />
    <g fill="none" stroke="#D6D2CC" strokeWidth="3" strokeLinecap="round">
      <path d="M0 52 C80 46 140 70 210 58 S320 40 360 48" />
      <path d="M150 0 C160 50 140 100 168 160" />
      <path d="M250 0 C240 60 270 110 260 160" />
      <path d="M40 120 C120 110 220 130 360 116" />
    </g>
    <path d="M0 96 C70 84 120 112 190 92 S300 70 360 62" fill="none" stroke="#9FD3F0" strokeWidth="5" strokeLinecap="round" />
    <g fill="#1DAA61">
      {[[72, 40], [118, 64], [196, 30], [228, 76], [96, 128], [300, 98], [326, 30], [270, 136], [140, 104], [60, 84], [212, 118], [176, 72]].map(
        ([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
      )}
    </g>
    <circle cx="186" cy="88" r="18" fill="#1A73E8" opacity="0.15" />
    <circle cx="186" cy="88" r="8" fill="#1A73E8" stroke="#FFFFFF" strokeWidth="3" />
  </svg>
);

// One pill of the attach sheet: a rounded icon pill with its name below. The name never wraps; when names
// are too wide for four in a row (Malayalam) the row wraps instead.
const AttachPill: React.FC<{ icon: React.ElementType; color: string; label: string }> = ({ icon: Icon, color, label }) => (
  <div className="flex flex-col items-center gap-xs py-xs px-xs">
    <div className="w-[72px] h-10 rounded-full border border-[#D1D7DB] bg-white flex items-center justify-center">
      <Icon className="w-6 h-6" style={{ color }} aria-hidden="true" />
    </div>
    <span className="text-label font-normal text-ink text-center leading-tight whitespace-nowrap">{label}</span>
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
  // Kept only while the practice runs (the replica unmounts on the completion screen and on Exit); nothing
  // is stored: the chat search text, the chat opened from the results and the file chosen in the picker.
  const [query, setQuery] = useState('');
  const [openedChat, setOpenedChat] = useState<string | null>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const docFile = DOC_FILES[fileIndex];
  // Also kept only while the practice runs: the status text typed, the message held and the contact it goes to
  const [statusText, setStatusText] = useState('');
  const [fwdKey, setFwdKey] = useState('greeting');
  const [fwdTo, setFwdTo] = useState<string | null>(null);
  // Press and hold on a message: the running hold (its timer and start point), and whether the click that
  // follows a finished hold or a short tap has already been answered
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const clickHandled = useRef(false);
  useEffect(() => () => clearTimeout(hold.current?.timer), []);
  // Block task: the chat list opens scrolled to the new chat from the unknown number (the search bar and chips
  // scroll out of view), so it is clear of the floating button on a short screen
  const chatListRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (screen !== 'whatsapp_chat_list_unknown') return;
    const row = chatListRef.current?.querySelector<HTMLElement>('[data-element-id="chat_row_unknown"]');
    if (chatListRef.current && row) chatListRef.current.scrollTop = row.offsetTop - 16;
  }, [screen]);

  const dropHold = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  // Touch or mouse (primary button only). After HOLD_MS the message is selected, even with the finger still
  // down, as in the app. Lifting sooner is a short tap: the gentle nudge. Drifting or scrolling drops it quietly.
  const holdHandlers = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      clickHandled.current = false;
      if (screen !== 'whatsapp_chat_forward' || !e.isPrimary || e.button !== 0) return;
      dropHold();
      const timer = setTimeout(() => {
        hold.current = null;
        clickHandled.current = true;
        setFwdKey(key);
        if (highlightElement === 'chat_messages') onCorrectTap();
      }, HOLD_MS);
      hold.current = { timer, x: e.clientX, y: e.clientY };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const h = hold.current;
      if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > HOLD_SLOP_PX) {
        dropHold();
        // A mouse still clicks when it is let go after a drift: that is not a tap either
        clickHandled.current = true;
      }
    },
    onPointerUp: () => {
      if (!hold.current) return;
      dropHold();
      clickHandled.current = true;
      onWrongTap();
    },
    onPointerCancel: dropHold,
    onPointerLeave: dropHold,
    // No long-press menu or text selection from the phone
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickHandled.current) clickHandled.current = false;
      else onWrongTap();
    }
  });
  // Header title of the document picker and send location screens. Malayalam words (അടുത്തിടെ, ലൊക്കേഷൻ)
  // are wider than the room between the header icons at 26px, so they use the 20px bold size.
  const headerTitle = language === 'ml' ? 'text-body font-bold' : 'text-title';

  // 0a. PHONE HOME SCREEN (every tutorial starts here)
  if (screen === 'phone_home_screen') {
    return <PhoneHomeScreen r={r} tp={tp} />;
  }

  // 0b. CHAT LIST: the learner scrolls it to find Ramesh's chat, then taps it. In the block task a chat from an
  // unknown number (invented scam message) is new at the top.
  if (screen === 'whatsapp_chat_list_screen' || screen === 'whatsapp_chat_list_unknown') {
    // Every sample chat but Ramesh's, which is the target row below
    const chats = sampleChats(r).filter((c) => c.key !== 'ramesh');
    const chips = [r.chipAll, r.chipUnread, r.chipFavorites, r.chipGroups];

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
            ref={chatListRef}
            data-scroll-area
            tabIndex={0}
            aria-label={r.tabChats}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-[96px] outline-none"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Search bar: opens the chat search (12px from the top keeps its ring clear of the header) */}
            <HighlightTarget elementId="chat_search_bar" {...tp} className="mx-lg mt-md rounded-full">
              <div className="min-h-[64px] rounded-full bg-[#F6F5F3] flex items-center gap-md px-lg">
                <Search className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
                <span className="text-body text-ink-muted">{r.search}</span>
              </div>
            </HighlightTarget>

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
              {screen === 'whatsapp_chat_list_unknown' && (
                <HighlightTarget elementId="chat_row_unknown" {...tp} className="mx-lg">
                  <ChatRow name={UNKNOWN_NUMBER} msg={r.scamMsg} time="12:02 PM" color="#8696A0" unknown unread={1} />
                </HighlightTarget>
              )}
              {chats.map((chat) => (
                <div key={chat.key} onClick={onWrongTap} className="mx-lg">
                  <ChatRow name={chat.name} msg={chat.msg} time={chat.time} color={chat.color} group={chat.group} />
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

        {/* Bottom tabs, Chats selected */}
        <BottomTabs r={r} language={language} selected={0} tp={tp} />
      </div>
    );
  }

  // 0c. UPDATES: the Status row (Add status first, then sample contacts' statuses), Channels (heading only, no
  // channels) and the pencil and camera buttons (inert). After posting, the first card is "My status".
  if (screen === 'whatsapp_updates_screen' || screen === 'whatsapp_updates_status_posted') {
    const posted = screen === 'whatsapp_updates_status_posted';
    const others: [string, string, string, string][] = [
      [r.priya, r.priyaInitial, 'from-rose-300 to-pink-600', '🌺'],
      [r.ramesh, r.rameshInitial, 'from-sky-300 to-indigo-600', '🏏']
    ];
    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <div onClick={onWrongTap} className="flex items-center justify-between gap-sm pl-lg pr-xs py-xs">
          <span className="text-title text-ink">{r.tabUpdates}</span>
          <div className="flex items-center flex-shrink-0">
            <div className="w-14 h-16 flex items-center justify-center">
              <Search className="w-7 h-7 text-ink" aria-hidden="true" />
            </div>
            <div className="w-12 h-16 flex items-center justify-center">
              <MoreVertical className="w-7 h-7 text-ink" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-[160px]">
            <div className="text-body font-bold text-ink px-lg pt-xs">{r.statusTitle}</div>
            {/* Three cards share the width (no sideways scrolling); 16px above them leaves room for the ring */}
            <div className="flex gap-sm px-lg pt-lg pb-md">
              <div className="flex-1 min-w-0 max-w-[112px]">
                {posted ? (
                  <div data-status-posted className="relative w-full h-[168px] rounded-2xl overflow-hidden bg-[#075E54] border-[3px] border-[#1DAA61]">
                    <div className="absolute inset-x-0 top-0 bottom-[64px] px-sm pt-sm text-white text-label font-bold leading-tight break-words line-clamp-3">
                      {statusText}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 px-sm pb-sm bg-black/30 pt-xs text-white text-label leading-tight">
                      <div className="font-bold">{r.myStatus}</div>
                      <div className="font-normal">{r.justNow}</div>
                    </div>
                  </div>
                ) : (
                  <HighlightTarget elementId="add_status_card" {...tp} className="rounded-2xl">
                    <div className="w-full h-[168px] rounded-2xl border border-[#D1D7DB] bg-[#F6F5F3] flex flex-col items-center justify-between px-xs pt-md pb-sm">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-[#DFE5E7] flex items-center justify-center">
                          <User className="w-9 h-9 text-[#54656F]" aria-hidden="true" />
                        </div>
                        <span className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center" style={{ background: WA_ACCENT }}>
                          <Plus className="w-5 h-5 text-white" strokeWidth={3} aria-hidden="true" />
                        </span>
                      </div>
                      <span className="text-label font-bold text-ink text-center leading-tight break-words">{r.addStatus}</span>
                    </div>
                  </HighlightTarget>
                )}
              </div>
              {others.map(([name, initial, colors, emoji]) => (
                <div key={name} onClick={onWrongTap} className="flex-1 min-w-0 max-w-[112px]">
                  <StatusCard name={name} initial={initial} colors={colors} emoji={emoji} />
                </div>
              ))}
            </div>

            <div onClick={onWrongTap} className="flex items-center justify-between gap-sm px-lg pt-sm">
              <span className="text-body font-bold text-ink">{r.channels}</span>
              <span className="min-h-[48px] px-lg rounded-full bg-[#F0F2F5] flex items-center text-label font-bold text-ink">{r.explore}</span>
            </div>
          </div>

          {/* Pencil (text status) and camera buttons (inert) */}
          <div onClick={onWrongTap} className="absolute right-lg bottom-lg z-20 flex flex-col items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-[#F0F2F5] flex items-center justify-center shadow-[0_2px_6px_rgba(11,20,26,0.2)]">
              <Pencil className="w-6 h-6 text-ink" aria-hidden="true" />
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_2px_6px_rgba(11,20,26,0.25)]" style={{ background: WA_ACCENT }}>
              <Camera className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>

        <BottomTabs r={r} language={language} selected={1} tp={tp} />
      </div>
    );
  }

  // 0d. ADD STATUS sheet: Text (the target), Music, Layout and Voice, then Recents (camera and photos, inert)
  if (screen === 'whatsapp_add_status_sheet') {
    const options: [React.ElementType, string][] = [
      [Music, r.statusMusic],
      [LayoutPanelLeft, r.statusLayout],
      [Mic, r.statusVoice]
    ];
    const option = (Icon: React.ElementType, label: string) => (
      <div className="flex flex-col items-center gap-xs px-xs py-xs">
        <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center">
          <Icon className="w-7 h-7 text-ink" aria-hidden="true" />
        </div>
        <span className="text-label font-normal text-ink text-center leading-tight whitespace-nowrap">{label}</span>
      </div>
    );
    return (
      <div className="min-h-full shrink-0 w-full bg-white text-ink flex flex-col rounded-t-[28px]">
        <div className="w-10 h-1 bg-[#C4C9CC] rounded-full mx-auto mt-sm" aria-hidden="true" />
        <div onClick={onWrongTap} className="flex items-center gap-xs px-xs">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            <X className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className={`flex-1 min-w-0 text-center text-ink pr-14 ${headerTitle}`}>{r.addStatus}</div>
        </div>

        <div className="flex flex-wrap justify-around px-md pt-sm">
          <HighlightTarget elementId="status_text_option" {...tp} className="flex-none">
            {option(Pencil, r.statusText)}
          </HighlightTarget>
          {options.map(([Icon, label]) => (
            <div key={label} onClick={onWrongTap} className="flex-none">
              {option(Icon, label)}
            </div>
          ))}
        </div>

        <div onClick={onWrongTap} className="px-lg pt-md pb-lg">
          <div className="text-body font-bold text-ink-muted pb-sm">{r.recents}</div>
          <div className="grid grid-cols-3 gap-xs" aria-hidden="true">
            <div className="aspect-square rounded-lg bg-[#F0F2F5] flex flex-col items-center justify-center gap-xs">
              <Camera className="w-8 h-8" style={{ color: WA_ACCENT }} />
            </div>
            {[['from-amber-300 to-orange-500', '🌸'], ['from-sky-400 to-indigo-700', '🛕'], ['from-emerald-400 to-teal-700', '👶'], ['from-rose-400 to-pink-700', '🎂'], ['from-amber-200 to-rose-400', '🌅']].map(([colors, emoji]) => (
              <div key={emoji} className={`aspect-square rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-4xl`}>
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 0e. TEXT STATUS: a real text field on a dark teal page, so the phone's own keyboard opens. The first character
  // completes the "type" step; Send appears once there is text (if it is all deleted, the ring goes back to the
  // field). The text lives only in the replica's state: never stored, logged or sent.
  if (screen === 'whatsapp_status_text') {
    const typed = statusText.trim() !== '';
    const statusTp = {
      ...tp,
      activeHighlightId: highlightElement === 'status_send_button' && !typed ? 'status_text_input' : highlightElement
    };
    return (
      <div className="h-full w-full bg-[#075E54] text-white flex flex-col">
        <div onClick={onWrongTap} className="flex items-center justify-between px-xs">
          <div className="w-14 h-14 flex items-center justify-center">
            <X className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="flex items-center">
            {[Smile, Type, Palette].map((Icon, i) => (
              <div key={i} className="w-12 h-14 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex items-center px-lg py-sm [@media(max-height:480px)]:py-0">
          <HighlightTarget elementId="status_text_input" {...statusTp} className="w-full">
            {/* Taps on the field only focus it: never a nudge, never a step */}
            <div onClick={(e) => e.stopPropagation()}>
              <textarea
                data-status-input
                rows={3}
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck={false}
                autoFocus
                aria-label={r.typeStatus}
                placeholder={r.typeStatus}
                value={statusText}
                onChange={(e) => {
                  setStatusText(e.target.value);
                  if (highlightElement === 'status_text_input' && e.target.value) onCorrectTap();
                }}
                className="block w-full min-h-[64px] bg-transparent outline-none resize-none select-text text-center text-title text-white placeholder:text-white/75"
              />
            </div>
          </HighlightTarget>
        </div>

        <div className="flex items-center justify-between gap-md px-lg pt-sm pb-lg [@media(max-height:480px)]:pb-sm">
          <div onClick={onWrongTap} className="min-w-0 min-h-[48px] bg-black/25 rounded-full px-lg flex items-center gap-sm text-label font-normal text-white">
            <CircleDashed className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{r.statusAudience}</span>
          </div>
          {typed && (
            // Keeps the keyboard open (focus stays in the field)
            <HighlightTarget elementId="status_send_button" {...statusTp} className="rounded-full flex-shrink-0">
              <div onPointerDown={(e) => e.preventDefault()} className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center" style={{ background: WA_ACCENT }}>
                <Send className="w-8 h-8 text-white ml-0.5" />
              </div>
            </HighlightTarget>
          )}
        </div>
      </div>
    );
  }

  // 0f. UNKNOWN NUMBER CHAT (block task): the "Not a contact" card with Block (the target) and Add, then the
  // invented scam message with its link (inert: a tap gets the gentle nudge). Then the Block confirmation, and
  // after it the blocked chat.
  if (screen === 'whatsapp_unknown_chat' || screen === 'whatsapp_block_dialog' || screen === 'whatsapp_unknown_chat_blocked') {
    const blocked = screen === 'whatsapp_unknown_chat_blocked';
    return (
      <div className="h-full w-full flex flex-col bg-wa-bg relative">
        <div onClick={onWrongTap} className="bg-white text-ink pl-xs pr-xs py-sm flex items-center gap-xs">
          <ArrowLeft className="w-7 h-7 text-ink flex-shrink-0" aria-hidden="true" />
          <div className="w-9 h-9 rounded-full bg-[#8696A0] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div data-chat-name className="flex-1 min-w-0 text-body font-semibold leading-tight truncate">{UNKNOWN_NUMBER}</div>
          <div className="w-12 h-14 flex items-center justify-center flex-shrink-0">
            <Phone className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="w-10 h-14 flex items-center justify-center flex-shrink-0">
            <MoreVertical className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-lg py-md space-y-md">
          <div onClick={onWrongTap} className="flex justify-center">
            <span className="bg-white text-ink-muted text-label px-md py-xs rounded-lg shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">{r.today}</span>
          </div>

          <div className="bg-white rounded-[20px] px-md py-md flex flex-col items-center gap-xs text-center">
            <div onClick={onWrongTap} className="flex flex-col items-center gap-xs">
              <div className="w-16 h-16 rounded-full bg-[#8696A0] flex items-center justify-center">
                <User className="w-9 h-9 text-white" aria-hidden="true" />
              </div>
              <div className="text-body font-semibold text-ink">{UNKNOWN_NUMBER}</div>
              <div className="text-label font-normal text-ink-muted leading-snug">{r.notAContact}</div>
              <div className="flex items-center gap-xs text-label font-bold" style={{ color: WA_ACCENT }}>
                <ShieldCheck className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{r.safetyTools}</span>
              </div>
            </div>
            {!blocked && (
              <div className="w-full flex gap-sm pt-sm">
                <HighlightTarget elementId="unknown_block_button" {...tp} className="flex-1 rounded-full">
                  <div className="min-h-[64px] rounded-full border-2 border-[#D1D7DB] flex items-center justify-center gap-xs px-sm text-body font-bold text-[#C5221F]">
                    <Ban className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                    <span>{r.block}</span>
                  </div>
                </HighlightTarget>
                <div onClick={onWrongTap} className="flex-1 min-h-[64px] rounded-full border-2 border-[#D1D7DB] flex items-center justify-center gap-xs px-sm text-body font-bold" style={{ color: WA_ACCENT }}>
                  <UserPlus className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                  <span>{r.add}</span>
                </div>
              </div>
            )}
          </div>

          <div onClick={onWrongTap} className="flex justify-start">
            <ReceivedBubble time="12:02 PM">
              <p data-scam-message className="text-body leading-snug">{r.scamMsg}</p>
              <p data-scam-link className="text-body leading-snug underline text-[#027EB5] break-all">prize-claim.example/win</p>
            </ReceivedBubble>
          </div>
        </div>

        {/* The message bar (inert); once blocked, the notice takes its place */}
        {blocked ? (
          <div data-blocked className="bg-white px-lg py-md text-label font-normal text-ink-muted text-center">{r.youBlocked}</div>
        ) : (
          <div onClick={onWrongTap} className="px-lg pt-xs pb-md flex items-end gap-sm">
            <div className="flex-1 min-w-0 min-h-[64px] bg-white rounded-[32px] flex items-center gap-sm px-md shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
              <Smile className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0 text-body text-ink-muted truncate">{r.messagePlaceholder}</span>
              <Paperclip className="w-7 h-7 text-ink-muted -rotate-45 flex-shrink-0" aria-hidden="true" />
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: WA_ACCENT }}>
              <Mic className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Block confirmation: "Report to WhatsApp" is ticked as in the app (inert); Cancel gets the gentle nudge */}
        {screen === 'whatsapp_block_dialog' && (
          <div className="absolute inset-0 bg-black/50 z-40 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-md">
              <div data-block-dialog className="bg-white rounded-[28px] px-lg py-lg w-full max-w-sm space-y-md screen-enter">
                <div onClick={onWrongTap} className="space-y-sm">
                  <Ban className="w-8 h-8 text-ink-muted mx-auto" aria-hidden="true" />
                  <div className="text-title text-ink text-center break-words">{r.blockQuestion(UNKNOWN_NUMBER)}</div>
                  <div className="text-label font-normal text-ink-muted leading-snug">{r.blockBody}</div>
                  <div className="flex items-start gap-sm pt-xs">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: WA_ACCENT }} aria-hidden="true">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-label font-bold text-ink">{r.reportTo}</div>
                      <div className="text-label font-normal text-ink-muted leading-snug">{r.reportBody}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWrongTap();
                    }}
                    className="flex-1 min-h-[64px] text-body font-bold bg-white border-2 border-[#D1D7DB] rounded-full"
                    style={{ color: WA_ACCENT }}
                  >
                    {r.cancel}
                  </button>
                  <HighlightTarget elementId="dialog_block_button" {...tp} className="flex-1 rounded-full">
                    <div className="w-full min-h-[64px] text-white rounded-full font-bold text-body flex items-center justify-center px-sm" style={{ background: WA_ACCENT }}>
                      {r.block}
                    </div>
                  </HighlightTarget>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 0g. FORWARD TO: any contact can be chosen, so the ring is on the whole list ("My status" is not a contact:
  // a tap gets the gentle nudge). Once one is ticked, the bottom bar shows its name and Send; tapping another
  // contact then moves the tick quietly.
  if (screen === 'whatsapp_forward_list') {
    const contacts = sampleChats(r).filter((c) => c.key !== 'ramesh');
    const chosen = contacts.find((c) => c.key === fwdTo);
    const row = (chat: SampleChat) => (
      <div
        key={chat.key}
        data-forward-row={chat.key}
        onClick={() => {
          setFwdTo(chat.key);
          if (highlightElement === 'forward_contacts') onCorrectTap();
        }}
        className="cursor-pointer"
      >
        <ForwardRow chat={chat} ticked={chat.key === fwdTo} />
      </div>
    );
    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <div onClick={onWrongTap} className="flex items-center gap-xs pl-xs pr-xs">
          <div className="w-14 h-16 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-bold text-ink leading-tight truncate">{r.forwardTo}</div>
            {chosen && <div className="text-label font-normal text-ink-muted">{r.nSelected(1)}</div>}
          </div>
          <div className="w-12 h-16 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="w-12 h-16 flex items-center justify-center flex-shrink-0">
            <Search className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
        </div>

        <div onClick={onWrongTap} data-forward-status className="mx-lg min-h-[64px] flex items-center gap-md px-sm">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: WA_ACCENT }}>
            <CircleDashed className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <span className="flex-1 min-w-0 text-body text-ink truncate">{r.myStatus}</span>
          <span className="w-8 h-8 rounded-full border-2 border-ink-muted flex-shrink-0" aria-hidden="true" />
        </div>
        {/* The ring is on the contact list's own scrolling area, so it always fits the screen */}
        <HighlightTarget elementId="forward_contacts" {...tp} className="flex-1 min-h-0 flex flex-col mx-lg mt-md mb-md">
          <div data-forward-list onClick={(e) => e.stopPropagation()} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="text-label font-bold text-ink-muted px-sm pt-xs">{r.frequentlyContacted}</div>
            {contacts.slice(0, 3).map(row)}
            <div className="text-label font-bold text-ink-muted px-sm pt-sm">{r.recentChats}</div>
            {contacts.slice(3).map(row)}
          </div>
        </HighlightTarget>

        {chosen && (
          <div className="border-t border-[#E9EDEF] bg-white px-lg pt-sm pb-md space-y-sm">
            <div onClick={onWrongTap} className="min-h-[56px] rounded-full bg-[#F0F2F5] px-lg flex items-center text-body text-ink-muted">
              {r.addMessage}
            </div>
            <div className="flex items-center justify-between gap-md">
              <span data-forward-chosen className="min-w-0 text-body text-ink truncate">{chosen.name}</span>
              <HighlightTarget elementId="forward_send_button" {...tp} className="rounded-full flex-shrink-0">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
                  <Send className="w-8 h-8 text-white ml-0.5" />
                </div>
              </HighlightTarget>
            </div>
          </div>
        )}
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

  // 6. CHAT SEARCH: a real text field, so the phone's own keyboard opens. Typing filters the sample chats by
  // name or phone number; the first character completes the "type" step and any chat in the results can be
  // opened. When the keyboard shrinks the screen (under 480px tall), the chips and the section title are hidden
  // and the gaps and result rows tighten (rows stay 64px), so the field and a result stay in view.
  if (screen === 'whatsapp_search_screen') {
    const results = searchChats(query, r);
    const typed = query.trim() !== '';
    // The ring is on the results while there are any; with none (or an empty box) it goes back to the field
    const searchTp = {
      ...tp,
      activeHighlightId: highlightElement === 'search_results' && !results.length ? 'search_input' : highlightElement
    };
    const chips = typed ? [r.chipLinks, r.chipPhotos, r.chipDocuments, r.chipStickers] : [r.chipUnread, r.chipPhotos, r.chipVideos, r.chipLinks];
    const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (highlightElement === 'search_input' && e.target.value) onCorrectTap();
    };

    return (
      <div className="h-full w-full bg-white text-ink flex flex-col">
        <div className="px-lg pt-md [@media(max-height:480px)]:pt-xs">
          <HighlightTarget elementId="search_input" {...searchTp} className="rounded-full">
            {/* Taps on the field only focus it: never a nudge, never a step */}
            <div onClick={(e) => e.stopPropagation()} className="min-h-[64px] rounded-full bg-[#F6F5F3] flex items-center pl-xs">
              <div onClick={onWrongTap} className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-7 h-7 text-ink" aria-hidden="true" />
              </div>
              <input
                data-search-input
                type="text"
                inputMode="text"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                aria-label={r.search}
                placeholder={r.search}
                value={query}
                onChange={onType}
                className={`flex-1 min-w-0 min-h-[48px] bg-transparent outline-none select-text text-body text-ink placeholder:text-ink-muted ${query ? '' : 'pr-lg'}`}
              />
              {query && (
                // Keeps the keyboard open (focus stays in the field)
                <button
                  type="button"
                  aria-label={r.clearSearch}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setQuery('')}
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-7 h-7 text-ink-muted" aria-hidden="true" />
                </button>
              )}
            </div>
          </HighlightTarget>
        </div>

        {/* Filter chips (inert): they change once something is typed */}
        <div className="flex flex-wrap gap-x-sm px-lg pt-xs [@media(max-height:480px)]:hidden">
          {chips.map((chip) => (
            <Chip key={chip} label={chip} onTap={onWrongTap} />
          ))}
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-lg pt-xs pb-md [@media(max-height:480px)]:pt-0 [@media(max-height:480px)]:pb-xs">
          {typed && results.length > 0 && (
            <HighlightTarget elementId="search_results" {...searchTp} className="flex-1 min-h-0 flex flex-col">
              {/* Any chat in the list opens; taps between rows do nothing */}
              <div data-search-results onClick={(e) => e.stopPropagation()} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="text-label font-bold text-ink-muted px-sm pt-xs [@media(max-height:480px)]:hidden">{r.tabChats}</div>
                {results.map((chat) => (
                  <div
                    key={chat.key}
                    data-search-row={chat.key}
                    onClick={() => {
                      setOpenedChat(chat.key);
                      if (highlightElement === 'search_results') onCorrectTap();
                    }}
                    className="cursor-pointer [@media(max-height:480px)]:[&>div]:min-h-[64px] [@media(max-height:480px)]:[&>div]:py-xs"
                  >
                    <ChatRow name={chat.name} msg={chat.msg} time={chat.time} color={chat.color} group={chat.group} />
                  </div>
                ))}
              </div>
            </HighlightTarget>
          )}
          {/* Nothing matches: a gentle line and how to go on (the ring is back on the field) */}
          {typed && !results.length && (
            <div data-search-empty className="px-sm pt-sm">
              <div className="text-body font-semibold text-ink">{r.noResults}</div>
              <div className="text-label font-normal text-ink-muted mt-xs">{r.noResultsHelp}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7. DOCUMENT PICKER ("Recent"): every file under Recent files is a photo and any of them can be sent,
  // so the ring is on the whole list. The menu, search, chips and "Browse files in other apps" are inert.
  if (screen === 'whatsapp_document_picker') {
    return (
      <div className="min-h-full shrink-0 w-full bg-white text-ink flex flex-col">
        <div onClick={onWrongTap} className="flex items-center gap-xs px-xs">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            <Menu className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className={`flex-1 min-w-0 text-ink ${headerTitle}`}>{r.recent}</div>
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            <Search className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="w-12 h-14 flex items-center justify-center flex-shrink-0">
            <MoreVertical className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-sm px-lg">
          {[r.chipImages, r.chipAudio, r.chipVideos, r.chipDocuments].map((chip) => (
            <Chip key={chip} label={chip} onTap={onWrongTap} />
          ))}
        </div>

        <div onClick={onWrongTap} className="min-h-[64px] flex items-center gap-md px-lg">
          <Folder className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
          <span className="text-body text-ink min-w-0">{r.browseOtherApps}</span>
        </div>

        <div className="text-label font-bold text-ink px-lg pt-xs">{r.recentFiles}</div>
        <HighlightTarget elementId="doc_recent_files" {...tp} className="mx-lg mt-md mb-lg">
          <div data-doc-files onClick={(e) => e.stopPropagation()}>
            {DOC_FILES.map((file, i) => (
              <div
                key={file.name}
                data-doc-file={file.name}
                onClick={() => {
                  setFileIndex(i);
                  if (highlightElement === 'doc_recent_files') onCorrectTap();
                }}
                className="min-h-[64px] flex items-center gap-md px-xs py-xs cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${file.colors} flex items-center justify-center text-2xl flex-shrink-0`} aria-hidden="true">
                  {file.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body text-ink truncate">{file.name}</div>
                  <div className="text-label font-normal text-ink-muted">{`${file.time}, ${file.size}, ${r.jpgImage}`}</div>
                </div>
              </div>
            ))}
          </div>
        </HighlightTarget>
      </div>
    );
  }

  // 8. DOCUMENT PREVIEW (dark): the chosen file's name and picture, a caption box, who it goes to and Send
  if (screen === 'whatsapp_document_preview') {
    return (
      <div className="h-full w-full bg-[#0B141A] text-white flex flex-col">
        <div className="flex items-center gap-xs pl-xs pr-lg">
          <div onClick={onWrongTap} className="w-16 h-16 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 text-body font-bold truncate">{docFile.name}</div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center px-lg py-sm">
          <div className={`w-full max-w-[300px] h-full max-h-[300px] min-h-[120px] rounded-card bg-gradient-to-br ${docFile.colors} flex items-center justify-center text-7xl`} aria-hidden="true">
            {docFile.emoji}
          </div>
        </div>

        <div onClick={onWrongTap} className="mx-lg bg-[#1F2C34] text-white/80 px-lg min-h-[64px] flex items-center rounded-full text-body">
          {r.addCaption}
        </div>

        <div className="flex items-center justify-between gap-md px-lg pt-md pb-lg">
          <div onClick={onWrongTap} className="min-w-0 min-h-[48px] bg-[#1F2C34] rounded-full px-lg flex items-center text-label font-normal text-white">
            <span className="truncate">{contactName}</span>
          </div>
          <HighlightTarget elementId="doc_send_button" {...tp} className="rounded-full flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: WA_ACCENT }}>
              <Send className="w-8 h-8 text-white ml-0.5" />
            </div>
          </HighlightTarget>
        </div>
      </div>
    );
  }

  // 9. SEND LOCATION: a neutral map, "Share live location" (inert: a tap gets the gentle nudge), then
  // "Send your current location" (the target) and a few invented nearby places (inert) that scroll.
  if (screen === 'whatsapp_send_location') {
    const places: [string, string][] = [
      [r.placeBusStop, r.addrMainRoad],
      [r.placePostOffice, r.addrStation],
      [r.temple, r.addrTemple]
    ];
    return (
      <div className="min-h-full shrink-0 w-full bg-white text-ink flex flex-col">
        <div onClick={onWrongTap} className="flex items-center gap-xs pl-xs pr-xs">
          <div className="w-14 h-16 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className={`flex-1 min-w-0 text-ink ${headerTitle}`}>{r.sendLocation}</div>
          <div className="w-12 h-16 flex items-center justify-center flex-shrink-0">
            <Search className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
          <div className="w-12 h-16 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>
        </div>

        <div onClick={onWrongTap} data-location-map className="h-[132px] flex-shrink-0 overflow-hidden">
          <MapArt />
        </div>

        <div onClick={onWrongTap} data-live-location className="min-h-[72px] flex items-center gap-md px-lg border-b border-[#E9EDEF]">
          <div className="w-12 h-12 rounded-full bg-[#1F2C34] flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <span className="text-body text-ink min-w-0">{r.shareLiveLocation}</span>
        </div>

        <div className="text-label font-bold text-ink-muted px-lg pt-sm">{r.nearbyPlaces}</div>
        <HighlightTarget elementId="send_current_location" {...tp} className="mx-lg mt-xs mb-md">
          <div className="min-h-[72px] flex items-center gap-md px-xs">
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: WA_ACCENT }}>
              <span className="w-5 h-5 rounded-full" style={{ background: WA_ACCENT }} />
            </div>
            <div className="min-w-0">
              <div className="text-body text-ink leading-tight">{r.sendCurrentLocation}</div>
              <div className="text-label font-normal text-ink-muted">{r.accurateTo}</div>
            </div>
          </div>
        </HighlightTarget>

        <div>
          {places.map(([name, addr]) => (
            <div key={name} onClick={onWrongTap} className="min-h-[72px] flex items-center gap-md px-lg py-xs">
              <div className="w-12 h-12 rounded-full bg-[#F0F2F5] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-ink" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-body text-ink leading-tight">{name}</div>
                <div className="text-label font-normal text-ink-muted">{addr}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. STANDARD CHAT SCREEN / ATTACHMENT SHEET / DIALOGS
  // The chat opened from the search results (search task's result screen) or the contact a message was forwarded
  // to (forward task's result screen); otherwise Ramesh's chat
  const openedKey = screen === 'whatsapp_search_chat_opened' ? openedChat : screen === 'whatsapp_chat_screen_forwarded' ? fwdTo : null;
  const opened = openedKey ? sampleChats(r).find((c) => c.key === openedKey) : undefined;
  const chatName = opened ? opened.name : contactName;
  // Forward task: Ramesh's three messages, and the one held (selected) on the next step
  const fwdChat = screen === 'whatsapp_chat_forward' || screen === 'whatsapp_chat_message_selected';
  const selecting = screen === 'whatsapp_chat_message_selected';
  return (
    <div className="h-full w-full flex flex-col justify-between bg-wa-bg relative">
      {/* A message is selected: the selection bar takes the header's place. Only Forward is a target. */}
      {selecting && (
        <div className="bg-white text-ink pl-xs pr-xs py-md flex items-center gap-xs z-10">
          <div onClick={onWrongTap} className="flex items-center flex-1 min-w-0">
            <div className="w-10 h-16 flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-7 h-7 text-ink" aria-hidden="true" />
            </div>
            <span data-selected-count className="text-title text-ink px-xs">1</span>
          </div>
          <div onClick={onWrongTap} className="flex items-center flex-shrink-0">
            {[Reply, Star, Trash2, Copy].map((Icon, i) => (
              <div key={i} data-select-action className="w-10 h-16 flex items-center justify-center">
                <Icon className="w-6 h-6 text-ink" aria-hidden="true" />
              </div>
            ))}
          </div>
          <HighlightTarget elementId="forward_arrow" {...tp} className="rounded-full flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center">
              <Forward className="w-7 h-7 text-ink" />
            </div>
          </HighlightTarget>
          <div onClick={onWrongTap} className="w-8 h-16 flex items-center justify-center flex-shrink-0">
            <MoreVertical className="w-6 h-6 text-ink" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* WhatsApp Header (light): back, avatar, name and status, then video and voice call.
          16px on the right keeps the call icon's pointer badge on screen. */}
      {!selecting && <div className="bg-white text-ink pl-xs pr-lg py-md flex items-center justify-between z-10">
        <div className="flex items-center gap-xs min-w-0 flex-1">
          <ArrowLeft className="w-7 h-7 text-ink flex-shrink-0" aria-hidden="true" />
          <div
            className="w-9 h-9 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: opened ? opened.color : '#128C7E' }}
          >
            {opened?.group ? <Users className="w-5 h-5" aria-hidden="true" /> : opened ? opened.name.charAt(0) : r.rameshInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div data-chat-name className="text-body font-semibold leading-tight break-words">{chatName}</div>
            {(!opened || opened.key === 'ramesh') && (
              <div className="text-label text-ink-muted font-normal whitespace-nowrap">{r.online}</div>
            )}
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
      </div>}

      {/* Forward task: any message can be pressed and held, so the ring is on the whole message area, which
          scrolls inside it. Each message takes the hold itself (pan-y keeps the chat scrollable; no text
          selection or long-press menu). */}
      {fwdChat && (
        <HighlightTarget elementId="chat_messages" {...tp} className="flex-1 min-h-0 flex flex-col mx-lg my-md">
          {/* Taps between the messages do nothing */}
          <div data-fwd-messages onClick={(e) => e.stopPropagation()} className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-sm px-xs py-sm">
            <div className="flex justify-center">
              <span className="bg-white text-ink-muted text-label px-md py-xs rounded-lg shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">{r.today}</span>
            </div>
            {FWD_MESSAGES.map((m) => (
              <div
                key={m.key}
                data-fwd-msg={m.key}
                data-selected={selecting && fwdKey === m.key ? '' : undefined}
                {...holdHandlers(m.key)}
                className={`flex justify-start select-none [-webkit-touch-callout:none] px-sm py-xs rounded-lg ${
                  selecting && fwdKey === m.key ? 'bg-[#B7E4D6]' : ''
                }`}
                style={{ touchAction: 'pan-y' }}
              >
                <ReceivedBubble time={m.time}>
                  <FwdContent msgKey={m.key} r={r} />
                </ReceivedBubble>
              </div>
            ))}
          </div>
        </HighlightTarget>
      )}

      {/* Chat Messages Body */}
      {!fwdChat && <div className="flex-1 px-lg py-md space-y-sm overflow-y-auto">
        <div className="flex justify-center">
          <span className="bg-white text-ink-muted text-label px-md py-xs rounded-lg shadow-[0_1px_0_0_rgba(11,20,26,0.13)]">
            {r.today}
          </span>
        </div>

        {/* Received Message Bubble */}
        <div className="flex justify-start">
          <ReceivedBubble time={opened ? opened.time : '10:15 AM'}>
            <p className="text-body leading-snug">{opened ? opened.msg : r.chatReceived}</p>
          </ReceivedBubble>
        </div>

        {/* The forwarded message, marked Forwarded */}
        {screen === 'whatsapp_chat_screen_forwarded' && (
          <SentBubble>
            <div data-forwarded className="flex items-center gap-xs text-label font-normal italic text-ink-muted">
              <Forward className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{r.forwarded}</span>
            </div>
            <div data-forwarded-msg={fwdKey}>
              <FwdContent msgKey={fwdKey} r={r} />
            </div>
          </SentBubble>
        )}

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
        {/* The photo sent as a document: file icon, name, type and size */}
        {screen === 'whatsapp_chat_screen_document_sent' && (
          <SentBubble>
            <div data-doc-bubble className="flex items-center gap-sm bg-[#C8EFC0] rounded-lg px-sm py-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <FileImage className="w-6 h-6 text-[#1A73E8]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-label font-bold text-ink truncate">{docFile.name}</div>
                <div className="text-label font-normal text-ink-muted">{`JPG • ${docFile.size}`}</div>
              </div>
            </div>
          </SentBubble>
        )}
        {/* The current location: a small map picture and the place */}
        {screen === 'whatsapp_chat_screen_location_sent' && (
          <SentBubble>
            <div data-location-bubble className="w-[220px] max-w-full">
              <div className="h-[80px] rounded-lg overflow-hidden">
                <MapArt />
              </div>
              <div className="text-body font-semibold leading-tight mt-xs">{r.myLocation}</div>
              <div className="text-label font-normal text-ink-muted">{r.addrMainRoad}</div>
            </div>
          </SentBubble>
        )}
      </div>}

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

      {/* Attachment sheet, under the message bar as in the app: two rows of four pills, then recent photos.
          Gallery, Location and Document are targets (each only in its own task); the rest are inert.
          Gallery is the only purple pill ("Tap the purple Gallery icon"). */}
      {screen === 'whatsapp_attachment_sheet' && (
        <div className="bg-white rounded-t-[28px] px-lg pt-sm pb-md z-30 screen-enter shadow-[0_-1px_0_0_#E9EDEF]">
          <div className="w-10 h-1 bg-[#C4C9CC] rounded-full mx-auto mb-sm" aria-hidden="true" />
          <div data-attach-pills className="flex flex-wrap justify-center">
            {(
              [
                ['gallery_icon', Images, '#A63FC4', r.gallery],
                ['location_icon', MapPin, WA_ACCENT, r.location],
                [null, User, '#027EB5', r.contact],
                ['document_icon', FileText, '#1A73E8', r.document],
                [null, ListChecks, '#B35C00', r.poll],
                [null, IndianRupee, WA_ACCENT, r.payment],
                [null, CalendarDays, '#D93025', r.event],
                [null, ImagePlus, '#1A73E8', r.aiImages]
              ] as [string | null, React.ElementType, string, string][]
            ).map(([id, icon, color, label]) =>
              id ? (
                <HighlightTarget key={label} elementId={id} {...tp} className="flex-none min-w-[25%]">
                  <AttachPill icon={icon} color={color} label={label} />
                </HighlightTarget>
              ) : (
                <div key={label} onClick={onWrongTap} className="flex-none min-w-[25%]">
                  <AttachPill icon={icon} color={color} label={label} />
                </div>
              )
            )}
          </div>

          {/* Recent photos strip (inert): the camera, then three photos */}
          <div onClick={onWrongTap} className="grid grid-cols-4 gap-xs mt-sm" aria-hidden="true">
            <div className="h-16 rounded-lg bg-[#F0F2F5] flex items-center justify-center">
              <Camera className="w-7 h-7" style={{ color: WA_ACCENT }} />
            </div>
            {[['from-amber-300 to-orange-500', '🌸'], ['from-sky-400 to-indigo-700', '🛕'], ['from-emerald-400 to-teal-700', '👶']].map(([colors, emoji]) => (
              <div key={emoji} className={`h-16 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center text-3xl`}>
                {emoji}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
