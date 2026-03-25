import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Tab = "chats" | "events" | "gallery" | "members" | "search" | "settings";

interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
  sender?: string;
  type?: "text" | "image" | "voice" | "emoji";
  mediaUrl?: string | null;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup: boolean;
  isPrivate?: boolean;
  messages: Message[];
}

interface ClubEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  members: number;
  tag: string;
  tagColor: string;
  emoji: string;
}

interface GalleryItem {
  id: number;
  emoji: string;
  title: string;
  event: string;
  likes: number;
  isVideo?: boolean;
  bg: string;
}

interface Member {
  id: number;
  name: string;
  car: string;
  avatar: string;
  level: string;
  levelColor: string;
  points: number;
  online: boolean;
  role: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const chats: Chat[] = [
  {
    id: 1, name: "🏎️ Общий чат клуба", avatar: "🏁", lastMsg: "Едем в воскресенье!", time: "14:32",
    unread: 5, online: true, isGroup: true,
    messages: [
      { id: 1, text: "Всем привет! Едем в воскресенье на трек?", time: "14:28", out: false },
      { id: 2, text: "Я точно буду! Уже подготовил резину 🏎️", time: "14:30", out: true },
      { id: 3, text: "Едем в воскресенье!", time: "14:32", out: false },
    ]
  },
  {
    id: 2, name: "Максим Рублёв", avatar: "М", lastMsg: "Когда встреча?", time: "12:15",
    unread: 1, online: true, isGroup: false,
    messages: [
      { id: 1, text: "Привет! Когда встреча клуба?", time: "12:10", out: false },
      { id: 2, text: "В субботу в 10:00 на парковке ТЦ", time: "12:15", out: true },
    ]
  },
  {
    id: 3, name: "🔥 Дрифт-команда", avatar: "🔥", lastMsg: "Новые фото в галерее!", time: "вчера",
    unread: 0, online: false, isGroup: true,
    messages: [
      { id: 1, text: "Новые фото в галерее!", time: "вчера", out: false },
    ]
  },
  {
    id: 4, name: "Анна Соколова", avatar: "А", lastMsg: "Спасибо за помощь 🙏", time: "вчера",
    unread: 0, online: false, isGroup: false,
    messages: [
      { id: 1, text: "Спасибо за помощь 🙏", time: "вчера", out: false },
    ]
  },
  {
    id: 5, name: "⚡ Электрокары", avatar: "⚡", lastMsg: "Тест-драйв в пятницу", time: "пн",
    unread: 2, online: false, isGroup: true,
    messages: [
      { id: 1, text: "Тест-драйв в пятницу, кто участвует?", time: "пн", out: false },
    ]
  },
];

const events: ClubEvent[] = [
  { id: 1, title: "Ночной трек-день", date: "30 марта, 20:00", location: "Moscow Raceway", members: 24, tag: "Гонки", tagColor: "#00ffb3", emoji: "🏁" },
  { id: 2, title: "Встреча клуба", date: "5 апреля, 10:00", location: "Лужники, парковка А", members: 47, tag: "Встреча", tagColor: "#00d4ff", emoji: "🤝" },
  { id: 3, title: "Дрифт-шоу 2026", date: "12 апреля, 14:00", location: "Крокус Экспо", members: 112, tag: "Шоу", tagColor: "#bf00ff", emoji: "🔥" },
  { id: 4, title: "Сезонное ТО", date: "20 апреля, 9:00", location: "СТО «Мотор»", members: 18, tag: "Сервис", tagColor: "#ff6b00", emoji: "🔧" },
  { id: 5, title: "Фотосессия суперкаров", date: "27 апреля, 11:00", location: "Воробьёвы горы", members: 31, tag: "Фото", tagColor: "#00ffb3", emoji: "📸" },
];

const gallery: GalleryItem[] = [
  { id: 1, emoji: "🏎️", title: "Moscow Raceway Night", event: "Трек-день", likes: 84, bg: "from-green-900/40 to-cyan-900/40" },
  { id: 2, emoji: "🔥", title: "Дрифт под дождём", event: "Дрифт-шоу", likes: 127, isVideo: true, bg: "from-purple-900/40 to-pink-900/40" },
  { id: 3, emoji: "🌆", title: "Ночной город", event: "Фотосессия", likes: 56, bg: "from-blue-900/40 to-indigo-900/40" },
  { id: 4, emoji: "⚡", title: "Tesla vs Porsche", event: "Тест-драйв", likes: 93, bg: "from-yellow-900/40 to-orange-900/40" },
  { id: 5, emoji: "🏁", title: "Старт гонки", event: "Трек-день", likes: 201, isVideo: true, bg: "from-red-900/40 to-rose-900/40" },
  { id: 6, emoji: "🛞", title: "Смена резины", event: "Встреча", likes: 38, bg: "from-slate-900/40 to-gray-900/40" },
];

const members: Member[] = [
  { id: 1, name: "Александр Громов", car: "BMW M3 G80", avatar: "А", level: "Легенда", levelColor: "#ff6b00", points: 9850, online: true, role: "Президент клуба" },
  { id: 2, name: "Максим Рублёв", car: "Nissan GT-R R35", avatar: "М", level: "Эксперт", levelColor: "#bf00ff", points: 7420, online: true, role: "Капитан дрифт-команды" },
  { id: 3, name: "Анна Соколова", car: "Porsche 911 GT3", avatar: "А", level: "Профи", levelColor: "#00d4ff", points: 5130, online: false, role: "Организатор событий" },
  { id: 4, name: "Дмитрий Орлов", car: "Mercedes AMG GT", avatar: "Д", level: "Профи", levelColor: "#00d4ff", points: 4890, online: false, role: "Механик" },
  { id: 5, name: "Кирилл Зайцев", car: "Toyota Supra A90", avatar: "К", level: "Новичок", levelColor: "#00ffb3", points: 1240, online: true, role: "Участник" },
];

// ─── API ──────────────────────────────────────────────────────────────────────
const API = "https://functions.poehali.dev/7f1b68b2-3be2-4063-bc44-6fdd024576b1";
const AUTH_API = "https://functions.poehali.dev/a1192a6c-cacf-4b21-b110-e0a01c534f8d";
const UPLOAD_AVATAR_API = "https://functions.poehali.dev/6b54dfba-6b17-4476-9ac2-f2563bb89adf";
const ADMIN_API = "https://functions.poehali.dev/fd18bf34-6c49-4fab-83c5-fb58dc050170";

interface User {
  id: number;
  nickname: string;
  car: string;
  role: string;
  level: string;
  levelColor: string;
  points: number;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

const SESSION_KEY = "motoclub_session";

function getSession(): { session_id: string; user: User } | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function saveSession(data: { session_id: string; user: User }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function apiLogin(nickname: string, pin: string) {
  const res = await fetch(`${AUTH_API}?action=login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function apiRegister(nickname: string, pin: string, car: string) {
  const res = await fetch(`${AUTH_API}?action=register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin, car }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function apiGetChats(sessionId?: string): Promise<Chat[]> {
  const res = await fetch(`${API}?action=chats`, {
    headers: sessionId ? { "X-Session-Id": sessionId } : {},
  });
  return res.json();
}

async function apiGetMessages(chatId: number, after = 0): Promise<Message[]> {
  const res = await fetch(`${API}?action=messages&chat_id=${chatId}&after=${after}`);
  return res.json();
}

async function apiSendMessage(chatId: number, payload: {
  text?: string; type?: string; media?: string; media_content_type?: string;
}): Promise<Message> {
  const res = await fetch(`${API}?action=messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload }),
  });
  return res.json();
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Avatar({ char, size = "md", online }: { char: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = { sm: "w-9 h-9 text-sm", md: "w-11 h-11 text-base", lg: "w-16 h-16 text-2xl" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold`}
        style={{ fontFamily: '"Exo 2", sans-serif', background: "linear-gradient(135deg, rgba(0,255,179,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(0,255,179,0.25)" }}>
        <span style={{ color: "white" }}>{char}</span>
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)", borderColor: "var(--bg-dark)" }} />
      )}
    </div>
  );
}

function NeonBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: '"Exo 2", sans-serif', color, border: `1px solid ${color}`, background: `${color}18` }}>
      {label}
    </span>
  );
}

// ─── CHATS SCREEN ─────────────────────────────────────────────────────────────
function ChatsScreen({ user, sessionId }: { user: User; sessionId: string }) {
  const [chatList, setChatList] = useState<Chat[]>(chats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [membersList, setMembersList] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [chatMembersOpen, setChatMembersOpen] = useState(false);
  const [chatMembers, setChatMembers] = useState<User[]>([]);
  const [chatMembersLoading, setChatMembersLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [memberSaving, setMemberSaving] = useState<number | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загружаем список чатов из API
  useEffect(() => {
    apiGetChats(sessionId).then(data => {
      if (Array.isArray(data) && data.length > 0) setChatList(data);
    }).catch(() => {});
  }, []);

  const loadMessages = useCallback(async (chatId: number, after = 0) => {
    const data = await apiGetMessages(chatId, after);
    if (!Array.isArray(data)) return;
    if (after === 0) {
      setMessages(data);
      lastIdRef.current = data.length > 0 ? data[data.length - 1].id : 0;
    } else if (data.length > 0) {
      setMessages(prev => [...prev, ...data]);
      lastIdRef.current = data[data.length - 1].id;
    }
  }, []);

  // Открываем чат — загружаем сообщения и запускаем поллинг
  const openChat = useCallback(async (chat: Chat) => {
    setLoading(true);
    setMessages([]);
    lastIdRef.current = 0;
    setActiveChat(chat);
    await loadMessages(chat.id, 0);
    setLoading(false);
    pollRef.current = setInterval(() => {
      loadMessages(chat.id, lastIdRef.current);
    }, 3000);
  }, [loadMessages]);

  // Закрываем чат — останавливаем поллинг
  const closeChat = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setActiveChat(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushMessage = async (optimistic: Message, payload: Parameters<typeof apiSendMessage>[1]) => {
    if (!activeChat) return;
    setMessages(prev => [...prev, optimistic]);
    setSending(true);
    const saved = await apiSendMessage(activeChat.id, payload);
    setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...saved, out: true } : m));
    lastIdRef.current = saved.id;
    setSending(false);
  };

  const now = () => new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChat || sending) return;
    const text = msgText.trim();
    setMsgText("");
    setShowEmoji(false);
    await pushMessage({ id: Date.now(), text, time: now(), out: true, type: "text" }, { text, type: "text" });
  };

  const sendEmoji = async (emoji: string) => {
    if (!activeChat || sending) return;
    setShowEmoji(false);
    await pushMessage({ id: Date.now(), text: emoji, time: now(), out: true, type: "emoji" }, { text: emoji, type: "emoji" });
  };

  const sendImage = async (file: File) => {
    if (!activeChat || sending) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const optimistic: Message = { id: Date.now(), text: "📷 Фото", time: now(), out: true, type: "image", mediaUrl: URL.createObjectURL(file) };
      await pushMessage(optimistic, { type: "image", media: base64, media_content_type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const url = URL.createObjectURL(blob);
          const optimistic: Message = { id: Date.now(), text: "🎤 Голосовое", time: now(), out: true, type: "voice", mediaUrl: url };
          await pushMessage(optimistic, { type: "voice", media: base64, media_content_type: "audio/webm" });
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const openNewChat = async () => {
    setNewChatOpen(true);
    setMembersLoading(true);
    const res = await fetch(`${ADMIN_API}?action=members`);
    const data = await res.json();
    setMembersLoading(false);
    if (Array.isArray(data)) setMembersList(data.filter((m: User) => m.id !== user.id));
  };

  const openChatMembers = async (chat: Chat) => {
    setChatMembersOpen(true);
    setChatMembersLoading(true);
    const [membersRes, allRes] = await Promise.all([
      fetch(`${ADMIN_API}?action=chat_members&chat_id=${chat.id}`),
      fetch(`${ADMIN_API}?action=members`),
    ]);
    const [members, all] = await Promise.all([membersRes.json(), allRes.json()]);
    if (Array.isArray(members)) setChatMembers(members);
    if (Array.isArray(all)) setAllMembers(all);
    setChatMembersLoading(false);
  };

  const addMember = async (chatId: number, userId: number) => {
    setMemberSaving(userId);
    await fetch(`${ADMIN_API}?action=add_member`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ chat_id: chatId, user_id: userId }),
    });
    setChatMembers(prev => {
      const member = allMembers.find(m => m.id === userId);
      return member && !prev.find(m => m.id === userId) ? [...prev, member] : prev;
    });
    setMemberSaving(null);
  };

  const removeMember = async (chatId: number, userId: number) => {
    setMemberSaving(userId);
    await fetch(`${ADMIN_API}?action=remove_member`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ chat_id: chatId, user_id: userId }),
    });
    setChatMembers(prev => prev.filter(m => m.id !== userId));
    setMemberSaving(null);
  };

  const startChat = async (member: User) => {
    setNewChatOpen(false);
    const existing = chatList.find(c => !c.isGroup && c.name === member.nickname);
    if (existing) { openChat(existing); return; }
    const newChat: Chat = {
      id: Date.now(), name: member.nickname,
      avatar: member.avatarUrl ? member.avatarUrl : member.nickname[0].toUpperCase(),
      lastMsg: "", time: "", unread: 0, online: false, isGroup: false, messages: [],
    };
    setChatList(prev => [newChat, ...prev]);
    openChat(newChat);
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Панель участников закрытого чата */}
        {chatMembersOpen && (
          <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
            style={{ background: "var(--bg-dark)" }}>
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
              <button onClick={() => setChatMembersOpen(false)}>
                <Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} />
              </button>
              <div className="flex-1">
                <h3 className="font-bold text-white text-base" style={{ fontFamily: '"Exo 2", sans-serif' }}>Участники чата</h3>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{activeChat.name}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {chatMembersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                </div>
              ) : (
                <>
                  {/* Текущие участники */}
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                    style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>
                    В чате ({chatMembers.length})
                  </div>
                  <div className="space-y-1 mb-5">
                    {chatMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(0,255,179,0.04)", border: "1px solid rgba(0,255,179,0.08)" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                          {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                          <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car || m.role}</div>
                        </div>
                        {user.isAdmin && m.id !== user.id && (
                          <button onClick={() => removeMember(activeChat.id, m.id)}
                            disabled={memberSaving === m.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.25)" }}>
                            {memberSaving === m.id
                              ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(255,77,77,0.3)", borderTopColor: "#ff4d4d" }} />
                              : <Icon name="UserMinus" size={13} style={{ color: "#ff6b6b" }} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Добавить участника (только для админа) */}
                  {user.isAdmin && (() => {
                    const memberIds = new Set(chatMembers.map(m => m.id));
                    const notInChat = allMembers.filter(m => !memberIds.has(m.id));
                    return notInChat.length > 0 ? (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                          style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>
                          Добавить участника
                        </div>
                        <div className="space-y-1">
                          {notInChat.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(255,255,255,0.1)" }}>
                                {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.7)" }}>{m.nickname}</div>
                                <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{m.car || m.role}</div>
                              </div>
                              <button onClick={() => addMember(activeChat.id, m.id)}
                                disabled={memberSaving === m.id}
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.25)" }}>
                                {memberSaving === m.id
                                  ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                                  : <Icon name="UserPlus" size={13} style={{ color: "var(--neon-green)" }} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,255,179,0.12)" }}>
          <button onClick={closeChat} className="transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="ChevronLeft" size={22} />
          </button>
          <Avatar char={activeChat.avatar} online={activeChat.online} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate flex items-center gap-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>
              {activeChat.isPrivate && <Icon name="Lock" size={11} style={{ color: "rgba(0,255,179,0.6)" }} />}
              {activeChat.name}
            </div>
            <div className="text-xs" style={{ color: "var(--neon-green)" }}>
              {activeChat.isPrivate ? "закрытый чат" : "онлайн"}
            </div>
          </div>
          {activeChat.isPrivate && (
            <button onClick={() => openChatMembers(activeChat)} className="transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              <Icon name="Users" size={18} />
            </button>
          )}
          <button className="transition-colors ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,255,179,0.4)", borderTopColor: "transparent" }} />
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.out ? "justify-end" : "justify-start"} animate-fade-in`}>
              {m.type === "emoji" ? (
                <div className={`flex flex-col ${m.out ? "items-end" : "items-start"}`}>
                  <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{m.text}</span>
                  <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.time}</span>
                </div>
              ) : m.type === "image" && m.mediaUrl ? (
                <div className={`max-w-[70%] ${m.out ? "msg-out" : "msg-in"} overflow-hidden p-1`}>
                  {!m.out && m.sender && m.sender !== "me" && (
                    <p className="text-xs font-semibold mb-1 px-2" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                  )}
                  <img src={m.mediaUrl} alt="фото" className="rounded-xl w-full object-cover" style={{ maxHeight: 220 }} />
                  <p className="text-xs mt-1 text-right px-2 pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
                </div>
              ) : m.type === "voice" && m.mediaUrl ? (
                <div className={`max-w-[75%] px-3 py-2.5 ${m.out ? "msg-out" : "msg-in"}`}>
                  {!m.out && m.sender && m.sender !== "me" && (
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "1.1rem" }}>🎤</span>
                    <audio controls src={m.mediaUrl} className="h-8" style={{ maxWidth: 160, filter: "invert(0.8)" }} />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
                </div>
              ) : (
                <div className={`max-w-[75%] px-4 py-2.5 ${m.out ? "msg-out" : "msg-in"}`}>
                  {!m.out && m.sender && m.sender !== "me" && (
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                  )}
                  <p className="text-sm text-white">{m.text}</p>
                  <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Эмодзи-пикер */}
        {showEmoji && (
          <div className="px-3 pb-2 animate-fade-in">
            <div className="rounded-2xl p-3 grid grid-cols-8 gap-1"
              style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,179,0.15)", backdropFilter: "blur(10px)" }}>
              {["😀","😂","🥹","😍","🤩","😎","🥳","😅","😭","😡","🤔","👍","👎","❤️","🔥","💯",
                "🏎️","⚡","🏁","🔧","🎯","💪","🙌","👏","🤝","✨","🎉","🚀"].map(e => (
                <button key={e} onClick={() => sendEmoji(e)}
                  className="text-xl p-1 rounded-lg hover:bg-white/10 transition-all text-center"
                  style={{ lineHeight: 1.2 }}>{e}</button>
              ))}
            </div>
          </div>
        )}

        {/* Запись голоса */}
        {isRecording && (
          <div className="px-4 py-2 flex items-center gap-3 animate-fade-in"
            style={{ borderTop: "1px solid rgba(255,77,77,0.2)", background: "rgba(255,77,77,0.05)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ff4d4d" }} />
            <span className="text-sm flex-1" style={{ color: "#ff6b6b", fontFamily: '"Exo 2", sans-serif' }}>
              Запись... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </span>
            <button onClick={stopRecording}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: "#ff4d4d", color: "#fff", fontFamily: '"Exo 2", sans-serif' }}>
              Отправить
            </button>
            <button onClick={() => { mediaRecorderRef.current?.stop(); if (recordTimerRef.current) clearInterval(recordTimerRef.current); setIsRecording(false); setRecordingTime(0); audioChunksRef.current = []; }}
              className="px-3 py-1.5 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              ✕
            </button>
          </div>
        )}

        <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(0,255,179,0.12)" }}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) sendImage(f); e.target.value = ""; }} />
          <div className="flex items-center gap-1.5">
            {/* Картинка */}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Icon name="Image" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            {/* Эмодзи */}
            <button onClick={() => setShowEmoji(v => !v)}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: showEmoji ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${showEmoji ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}` }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>😊</span>
            </button>
            {/* Ввод текста */}
            <div className="flex-1 flex items-center rounded-2xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600"
                placeholder="Сообщение..." value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={handleKeyDown} />
            </div>
            {/* Голос / Отправить */}
            {msgText.trim() ? (
              <button onClick={sendMessage} disabled={sending}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: "var(--neon-green)", opacity: sending ? 0.6 : 1 }}>
                <Icon name="Send" size={16} style={{ color: "var(--bg-dark)" }} />
              </button>
            ) : (
              <button onMouseDown={startRecording} onTouchStart={startRecording} disabled={isRecording}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: isRecording ? "rgba(255,77,77,0.2)" : "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.3)" }}>
                <Icon name="Mic" size={16} style={{ color: isRecording ? "#ff4d4d" : "var(--neon-green)" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Модал выбора участника */}
      {newChatOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setNewChatOpen(false); }}>
          <div className="w-full max-w-sm rounded-t-3xl p-5 animate-fade-in"
            style={{ background: "var(--bg-dark)", border: "1px solid rgba(0,255,179,0.15)", borderBottom: "none", maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Новый чат</h3>
              <button onClick={() => setNewChatOpen(false)}><Icon name="X" size={20} style={{ color: "rgba(255,255,255,0.5)" }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {membersLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                </div>
              )}
              {membersList.map(m => (
                <button key={m.id} onClick={() => startChat(m)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.25)" }}>
                    {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                    <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car || m.role}</div>
                  </div>
                  <NeonBadge label={m.level} color={m.levelColor} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        <h2 className="font-bold text-xl text-white mb-3" style={{ fontFamily: '"Exo 2", sans-serif' }}>Чаты</h2>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="Search" size={16} style={{ color: "rgba(255,255,255,0.35)" }} />
          <input className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600" placeholder="Поиск чатов..." />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chatList.map(chat => (
          <button key={chat.id} onClick={() => openChat(chat)}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <Avatar char={chat.avatar} online={chat.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm truncate flex items-center gap-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>
                  {chat.isPrivate && <Icon name="Lock" size={11} style={{ color: "rgba(0,255,179,0.6)", flexShrink: 0 }} />}
                  {chat.name}
                </span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{chat.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{chat.lastMsg}</span>
                {chat.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--neon-green)", color: "var(--bg-dark)" }}>
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2">
        <button onClick={openNewChat} className="neon-btn-filled w-full rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm"
          style={{ fontFamily: '"Exo 2", sans-serif' }}>
          <Icon name="Plus" size={16} />
          Новый чат
        </button>
      </div>
    </div>
  );
}

// ─── EVENTS SCREEN ────────────────────────────────────────────────────────────
function EventsScreen() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="font-bold text-xl text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>События</h2>
        <button onClick={() => setCreating(true)} className="neon-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{ fontFamily: '"Exo 2", sans-serif' }}>
          <Icon name="Plus" size={14} />
          Создать
        </button>
      </div>

      {creating && (
        <div className="mx-4 mb-3 rounded-xl p-4 animate-fade-in" style={{ background: "rgba(0,255,179,0.06)", border: "1px solid rgba(0,255,179,0.2)" }}>
          <div className="font-semibold text-white text-sm mb-3" style={{ fontFamily: '"Exo 2", sans-serif' }}>Новое событие</div>
          {["Название события", "Дата и время", "Место проведения"].map(ph => (
            <input key={ph} className="w-full mb-2 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} placeholder={ph} />
          ))}
          <div className="flex gap-2 mt-1">
            <button className="neon-btn-filled flex-1 rounded-lg py-2 text-xs font-semibold" style={{ fontFamily: '"Exo 2", sans-serif' }}>Опубликовать</button>
            <button onClick={() => setCreating(false)} className="flex-1 rounded-lg py-2 text-xs"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Отмена</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {events.map((ev, i) => (
          <div key={ev.id} className="glass-card rounded-xl p-4 card-hover cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${ev.tagColor}18`, border: `1px solid ${ev.tagColor}35` }}>
                {ev.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{ev.title}</h3>
                  <NeonBadge label={ev.tag} color={ev.tagColor} />
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Icon name="Calendar" size={12} />
                  <span>{ev.date}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Icon name="MapPin" size={12} />
                  <span>{ev.location}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Icon name="Users" size={12} />
                    <span>{ev.members} участников</span>
                  </div>
                  <button className="text-xs px-3 py-1 rounded-lg font-semibold transition-all"
                    style={{ fontFamily: '"Exo 2", sans-serif', background: `${ev.tagColor}18`, color: ev.tagColor, border: `1px solid ${ev.tagColor}35` }}>
                    Участвовать
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GALLERY SCREEN ───────────────────────────────────────────────────────────
function GalleryScreen() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState("Все");

  const filtered = filter === "Видео" ? gallery.filter(g => g.isVideo) : filter === "Фото" ? gallery.filter(g => !g.isVideo) : gallery;

  if (selected) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setSelected(null)} style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="ChevronLeft" size={22} />
          </button>
          <span className="font-semibold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.title}</span>
        </div>
        <div className={`mx-4 mt-4 rounded-2xl h-64 relative flex items-center justify-center text-8xl bg-gradient-to-br ${selected.bg}`}
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {selected.isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center z-10"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Icon name="Play" size={28} style={{ color: "white" }} />
              </div>
            </div>
          )}
          <span className="relative z-0">{selected.emoji}</span>
        </div>
        <div className="px-4 mt-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.title}</h3>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{selected.event}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Icon name="Heart" size={18} />
              <span>{selected.likes}</span>
            </button>
            <button style={{ color: "rgba(255,255,255,0.5)" }}><Icon name="Share2" size={18} /></button>
            <button style={{ color: "rgba(255,255,255,0.5)" }}><Icon name="Download" size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h2 className="font-bold text-xl text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Галерея</h2>
        <button className="neon-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>
          <Icon name="Upload" size={14} />
          Загрузить
        </button>
      </div>

      <div className="flex gap-2 px-4 mb-3">
        {["Все", "Фото", "Видео"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ fontFamily: '"Exo 2", sans-serif', background: filter === f ? "rgba(0,255,179,0.12)" : "rgba(255,255,255,0.05)", color: filter === f ? "var(--neon-green)" : "rgba(255,255,255,0.5)", border: filter === f ? "1px solid rgba(0,255,179,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, i) => (
            <button key={item.id} onClick={() => setSelected(item)}
              className={`relative rounded-xl overflow-hidden aspect-square bg-gradient-to-br ${item.bg} flex items-center justify-center text-5xl transition-all animate-fade-in`}
              style={{ border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 0.05}s` }}>
              <span>{item.emoji}</span>
              {item.isVideo && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                  <Icon name="Play" size={10} style={{ color: "white" }} />
                  <span className="text-white" style={{ fontSize: "10px" }}>Видео</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md px-1.5 py-0.5"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <Icon name="Heart" size={10} style={{ color: "#ff6b6b" }} />
                <span className="text-white" style={{ fontSize: "10px" }}>{item.likes}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MEMBERS SCREEN ───────────────────────────────────────────────────────────
function MembersScreen() {
  const [selected, setSelected] = useState<Member | null>(null);
  const maxPoints = members[0].points;

  if (selected) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setSelected(null)} style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="ChevronLeft" size={22} />
          </button>
          <span className="font-semibold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Профиль</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white"
                style={{ fontFamily: '"Exo 2", sans-serif', background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "2px solid rgba(0,255,179,0.35)", boxShadow: "0 0 30px rgba(0,255,179,0.2)" }}>
                {selected.avatar}
              </div>
              {selected.online && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2"
                  style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)", borderColor: "var(--bg-dark)" }} />
              )}
            </div>
            <h3 className="font-bold text-white text-xl" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.name}</h3>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{selected.role}</p>
            <div className="mt-2"><NeonBadge label={selected.level} color={selected.levelColor} /></div>
          </div>

          <div className="glass-card rounded-xl p-4 mb-3">
            <div className="text-xs mb-2 font-semibold uppercase tracking-wider" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Рейтинг</div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-2xl" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)" }}>{selected.points.toLocaleString()}</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>очков</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(selected.points / maxPoints) * 100}%`, background: `linear-gradient(90deg, ${selected.levelColor}, var(--neon-blue))` }} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="text-xs mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Автомобиль</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <span className="font-semibold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.car}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="neon-btn-filled flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ fontFamily: '"Exo 2", sans-serif' }}>
              <Icon name="MessageCircle" size={16} />
              Написать
            </button>
            <button className="flex-1 rounded-xl py-3 text-sm flex items-center justify-center gap-2"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              <Icon name="UserPlus" size={16} />
              Добавить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-bold text-xl text-white mb-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Участники</h2>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{members.length} членов клуба</p>
      </div>

      <div className="px-4 mb-3">
        <div className="glass-card rounded-xl p-3 text-center" style={{ border: "1px solid rgba(0,255,179,0.15)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>🏆 Топ недели</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">👑</span>
            <div className="text-left">
              <div className="font-bold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{members[0].name}</div>
              <div className="text-xs" style={{ color: "var(--neon-green)" }}>{members[0].points.toLocaleString()} очков</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {[...members].sort((a, b) => b.points - a.points).map((m, i) => (
          <button key={m.id} onClick={() => setSelected(m)}
            className="w-full glass-card rounded-xl p-3 flex items-center gap-3 card-hover text-left animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="font-bold text-lg w-6 text-center flex-shrink-0" style={{ fontFamily: '"Exo 2", sans-serif', color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.3)" }}>
              {i + 1}
            </span>
            <Avatar char={m.avatar} online={m.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.name}</span>
                <NeonBadge label={m.level} color={m.levelColor} />
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-sm" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)" }}>{m.points.toLocaleString()}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>очков</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SEARCH SCREEN ────────────────────────────────────────────────────────────
function SearchScreen() {
  const [query, setQuery] = useState("");

  const filtered = query.length > 1 ? {
    chats: chats.filter(c => c.name.toLowerCase().includes(query.toLowerCase())),
    events: events.filter(e => e.title.toLowerCase().includes(query.toLowerCase())),
    members: members.filter(m => m.name.toLowerCase().includes(query.toLowerCase())),
  } : null;

  const hasResults = filtered && (filtered.chats.length + filtered.events.length + filtered.members.length > 0);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-bold text-xl text-white mb-3" style={{ fontFamily: '"Exo 2", sans-serif' }}>Поиск</h2>
        <div className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}>
          <Icon name="Search" size={18} style={{ color: "var(--neon-green)" }} />
          <input autoFocus className="flex-1 bg-transparent text-white outline-none text-sm placeholder-gray-600"
            placeholder="Чаты, участники, события..." value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery("")}><Icon name="X" size={16} style={{ color: "rgba(255,255,255,0.4)" }} /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!filtered ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-4 animate-float">🔍</span>
            <p className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>Введите запрос</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Поиск по чатам, участникам и событиям</p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>Ничего не найдено</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Попробуйте другой запрос</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filtered.chats.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)" }}>Чаты</div>
                {filtered.chats.map(c => (
                  <div key={c.id} className="glass-card rounded-lg p-3 mb-2 flex items-center gap-3">
                    <Avatar char={c.avatar} size="sm" online={c.online} />
                    <div>
                      <div className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{c.name}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.lastMsg}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filtered.events.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-blue)" }}>События</div>
                {filtered.events.map(e => (
                  <div key={e.id} className="glass-card rounded-lg p-3 mb-2 flex items-center gap-3">
                    <span className="text-2xl">{e.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{e.title}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{e.date} · {e.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filtered.members.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-purple)" }}>Участники</div>
                {filtered.members.map(m => (
                  <div key={m.id} className="glass-card rounded-lg p-3 mb-2 flex items-center gap-3">
                    <Avatar char={m.avatar} size="sm" online={m.online} />
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.name}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car}</div>
                    </div>
                    <NeonBadge label={m.level} color={m.levelColor} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────
function SettingsScreen({ user, sessionId, onAvatarChange, onProfileUpdate }: {
  user: User; sessionId: string;
  onAvatarChange: (url: string) => void;
  onProfileUpdate: (updated: User) => void;
}) {
  const [notif, setNotif] = useState(true);
  const [online, setOnline] = useState(true);
  const [sound, setSound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [panel, setPanel] = useState<"rules" | "rating" | "manage" | null>(null);

  // ── Правила клуба ──
  const [rules, setRules] = useState("");
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);

  const openRules = async () => {
    setPanel("rules");
    setRulesLoading(true);
    const res = await fetch(`${ADMIN_API}?action=rules`);
    const d = await res.json();
    setRules(d.content || "");
    setRulesLoading(false);
  };

  const saveRules = async () => {
    setRulesSaving(true);
    await fetch(`${ADMIN_API}?action=rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ content: rules }),
    });
    setRulesSaving(false);
  };

  // ── Система рейтинга ──
  const [ratingMembers, setRatingMembers] = useState<User[]>([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [deltaMap, setDeltaMap] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const openRating = async () => {
    setPanel("rating");
    setRatingLoading(true);
    const res = await fetch(`${ADMIN_API}?action=members`);
    const d = await res.json();
    if (Array.isArray(d)) setRatingMembers(d);
    setRatingLoading(false);
  };

  const applyDelta = async (memberId: number) => {
    const delta = parseInt(deltaMap[memberId] || "0");
    if (!delta) return;
    setSavingId(memberId);
    const res = await fetch(`${ADMIN_API}?action=rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ user_id: memberId, delta }),
    });
    const d = await res.json();
    if (res.ok) {
      setRatingMembers(prev => prev.map(m => m.id === memberId ? { ...m, points: d.points } : m));
      setDeltaMap(prev => ({ ...prev, [memberId]: "" }));
    }
    setSavingId(null);
  };

  // ── Управление клубом ──
  const [manageMembers, setManageMembers] = useState<User[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [newChatName, setNewChatName] = useState("");
  const [newChatEmoji, setNewChatEmoji] = useState("💬");
  const [newChatPrivate, setNewChatPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [chatCreated, setChatCreated] = useState(false);

  const openManage = async () => {
    setPanel("manage");
    setManageLoading(true);
    const res = await fetch(`${ADMIN_API}?action=members`);
    const d = await res.json();
    if (Array.isArray(d)) setManageMembers(d);
    setManageLoading(false);
  };

  const createGroupChat = async () => {
    if (!newChatName.trim()) return;
    if (newChatPrivate && selectedMembers.length === 0) return;
    setCreatingChat(true);
    const res = await fetch(`${ADMIN_API}?action=create_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({
        name: newChatName.trim(), avatar: newChatEmoji,
        is_private: newChatPrivate,
        member_ids: newChatPrivate ? selectedMembers : [],
      }),
    });
    setCreatingChat(false);
    if (res.ok) {
      setChatCreated(true);
      setNewChatName("");
      setSelectedMembers([]);
      setNewChatPrivate(false);
      setTimeout(() => setChatCreated(false), 3000);
    }
  };

  const toggleMember = (id: number) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAdmin = async (memberId: number, currentIsAdmin: boolean) => {
    setTogglingId(memberId);
    const res = await fetch(`${ADMIN_API}?action=set_admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ user_id: memberId, is_admin: !currentIsAdmin }),
    });
    const d = await res.json();
    if (res.ok) {
      setManageMembers(prev => prev.map(m => m.id === memberId ? { ...m, isAdmin: d.isAdmin } : m));
    }
    setTogglingId(null);
  };

  const [editNickname, setEditNickname] = useState(user.nickname);
  const [editCar, setEditCar] = useState(user.car || "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch(UPLOAD_AVATAR_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ image: base64, content_type: file.type }),
      });
      const data = await res.json();
      setUploading(false);
      if (res.ok && data.avatar_url) onAvatarChange(data.avatar_url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openEdit = () => {
    setEditNickname(user.nickname);
    setEditCar(user.car || "");
    setEditError("");
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!editNickname.trim()) return;
    setEditLoading(true);
    setEditError("");
    const res = await fetch(`${AUTH_API}?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ nickname: editNickname.trim(), car: editCar.trim() }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(data.error || "Ошибка"); return; }
    onProfileUpdate(data.user);
    setEditOpen(false);
  };

  const privacyItems = [
    { icon: "Bell", label: "Уведомления", toggle: true, val: notif, onToggle: () => setNotif(v => !v) },
    { icon: "Eye", label: "Показывать онлайн", toggle: true, val: online, onToggle: () => setOnline(v => !v) },
    { icon: "Volume2", label: "Звуки сообщений", toggle: true, val: sound, onToggle: () => setSound(v => !v) },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Модал редактирования профиля */}
      {editOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEditOpen(false); }}>
          <div className="w-full max-w-sm rounded-t-3xl p-6 animate-fade-in"
            style={{ background: "var(--bg-dark)", border: "1px solid rgba(0,255,179,0.15)", borderBottom: "none" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Редактировать профиль</h3>
              <button onClick={() => setEditOpen(false)}>
                <Icon name="X" size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>Никнейм</label>
                <input value={editNickname} onChange={e => setEditNickname(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>Автомобиль</label>
                <input value={editCar} onChange={e => setEditCar(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
                  placeholder="Марка и модель" />
              </div>
              {editError && (
                <div className="rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", color: "#ff6b6b" }}>
                  {editError}
                </div>
              )}
              <button onClick={saveProfile} disabled={editLoading || !editNickname.trim()}
                className="neon-btn-filled w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: '"Exo 2", sans-serif', opacity: editLoading ? 0.7 : 1 }}>
                {editLoading
                  ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                  : <Icon name="Check" size={16} />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        <h2 className="font-bold text-xl text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Настройки</h2>
      </div>

      <div className="px-4 mb-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-4" style={{ border: "1px solid rgba(0,255,179,0.15)" }}>
          <div className="relative cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white overflow-hidden"
              style={{ fontFamily: '"Exo 2", sans-serif', background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "2px solid rgba(0,255,179,0.35)", boxShadow: "0 0 20px rgba(0,255,179,0.15)" }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : user.nickname[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: uploading ? "rgba(0,255,179,0.3)" : "var(--neon-green)", boxShadow: "0 0 8px rgba(0,255,179,0.6)" }}>
              {uploading
                ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,0,0,0.3)", borderTopColor: "#000" }} />
                : <Icon name="Camera" size={13} style={{ color: "#000" }} />}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{user.nickname}</div>
            <div className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{user.car || user.role}</div>
            <div className="mt-1"><NeonBadge label={user.level} color={user.levelColor} /></div>
          </div>
          <button onClick={openEdit} className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.2)" }}>
            <Icon name="Pencil" size={14} style={{ color: "var(--neon-green)" }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Профиль */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Профиль</div>
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={openEdit} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                <Icon name="User" size={14} style={{ color: "var(--neon-green)" }} />
              </div>
              <span className="flex-1 text-white text-sm">Редактировать профиль</span>
              <span className="text-sm truncate max-w-[100px]" style={{ color: "rgba(255,255,255,0.4)" }}>{user.nickname}</span>
            </button>
            <button onClick={openEdit} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                <Icon name="Car" size={14} style={{ color: "var(--neon-green)" }} />
              </div>
              <span className="flex-1 text-white text-sm">Мой автомобиль</span>
              <span className="text-sm truncate max-w-[100px]" style={{ color: "rgba(255,255,255,0.4)" }}>{user.car || "Не указан"}</span>
            </button>
          </div>
        </div>

        {/* Приватность */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Приватность</div>
          <div className="glass-card rounded-xl overflow-hidden">
            {privacyItems.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: idx < privacyItems.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                  <Icon name={item.icon} size={14} style={{ color: "var(--neon-green)" }} />
                </div>
                <span className="flex-1 text-white text-sm">{item.label}</span>
                <button onClick={item.onToggle}
                  className="relative w-11 h-6 rounded-full transition-all"
                  style={{ background: item.val ? "var(--neon-green)" : "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: item.val ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Клуб */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Клуб</div>
          <div className="glass-card rounded-xl overflow-hidden">
            {user.isAdmin && (
              <button onClick={openManage} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                  <Icon name="Users" size={14} style={{ color: "var(--neon-green)" }} />
                </div>
                <span className="flex-1 text-white text-sm">Управление клубом</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>Адм</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
              </button>
            )}
            <button onClick={openRules} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                <Icon name="Shield" size={14} style={{ color: "var(--neon-green)" }} />
              </div>
              <span className="flex-1 text-white text-sm">Правила клуба</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
            </button>
            <button onClick={openRating} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                <Icon name="Star" size={14} style={{ color: "var(--neon-green)" }} />
              </div>
              <span className="flex-1 text-white text-sm">Система рейтинга</span>
              {user.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>Адм</span>}
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
            </button>
          </div>
        </div>

        <button onClick={() => { clearSession(); window.location.reload(); }}
          className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-all"
          style={{ fontFamily: '"Exo 2", sans-serif', color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.25)", background: "rgba(255,77,77,0.05)" }}>
          <Icon name="LogOut" size={16} />
          Выйти из аккаунта
        </button>
      </div>

      {/* ── Панель: Правила клуба ── */}
      {panel === "rules" && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white flex-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Правила клуба</h3>
            {user.isAdmin && (
              <button onClick={saveRules} disabled={rulesSaving}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                style={{ background: "var(--neon-green)", color: "#000", opacity: rulesSaving ? 0.7 : 1, fontFamily: '"Exo 2", sans-serif' }}>
                {rulesSaving ? <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} /> : <Icon name="Check" size={14} />}
                Сохранить
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rulesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
              </div>
            ) : user.isAdmin ? (
              <textarea value={rules} onChange={e => setRules(e.target.value)}
                className="w-full h-full min-h-[300px] rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,179,0.15)", lineHeight: "1.7" }} />
            ) : (
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-white whitespace-pre-line" style={{ lineHeight: "1.8", color: "rgba(255,255,255,0.85)" }}>{rules || "Правила не установлены."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Панель: Система рейтинга ── */}
      {panel === "rating" && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>
              {user.isAdmin ? "Управление рейтингом" : "Рейтинг участников"}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {ratingLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
              </div>
            ) : ratingMembers.map((m, idx) => (
              <div key={m.id} className="glass-card rounded-xl p-3 flex items-center gap-3"
                style={{ border: "1px solid rgba(0,255,179,0.08)" }}>
                <span className="text-sm font-bold w-5 text-center flex-shrink-0" style={{ color: idx < 3 ? "var(--neon-green)" : "rgba(255,255,255,0.3)" }}>
                  {idx + 1}
                </span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                  <div className="text-xs" style={{ color: m.levelColor || "var(--neon-green)" }}>{m.level} · {m.points} очков</div>
                </div>
                {user.isAdmin && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input value={deltaMap[m.id] || ""} onChange={e => setDeltaMap(p => ({ ...p, [m.id]: e.target.value }))}
                      type="number" placeholder="±0"
                      className="w-16 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,255,179,0.2)" }} />
                    <button onClick={() => applyDelta(m.id)} disabled={savingId === m.id || !deltaMap[m.id]}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "var(--neon-green)", opacity: savingId === m.id ? 0.6 : 1 }}>
                      {savingId === m.id
                        ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />
                        : <Icon name="Check" size={13} style={{ color: "#000" }} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Панель: Управление клубом (только для админа) ── */}
      {panel === "manage" && user.isAdmin && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Управление клубом</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Создать чат */}
            <div className="glass-card rounded-xl p-4" style={{ border: "1px solid rgba(0,255,179,0.12)" }}>
              <div className="font-semibold text-white mb-3 text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>Создать групповой чат</div>

              {/* Название */}
              <div className="flex gap-2 mb-3">
                <input value={newChatEmoji} onChange={e => setNewChatEmoji(e.target.value)}
                  className="w-12 rounded-xl px-2 py-2.5 text-center text-lg outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }} maxLength={2} />
                <input value={newChatName} onChange={e => setNewChatName(e.target.value)}
                  placeholder="Название чата"
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }} />
              </div>

              {/* Переключатель: закрытый */}
              <button onClick={() => { setNewChatPrivate(v => !v); setSelectedMembers([]); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 transition-all"
                style={{ background: newChatPrivate ? "rgba(0,255,179,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${newChatPrivate ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center gap-2">
                  <Icon name="Lock" size={14} style={{ color: newChatPrivate ? "var(--neon-green)" : "rgba(255,255,255,0.4)" }} />
                  <span className="text-sm" style={{ color: newChatPrivate ? "var(--neon-green)" : "rgba(255,255,255,0.6)" }}>Закрытый чат</span>
                </div>
                <div className="relative w-9 h-5 rounded-full transition-all"
                  style={{ background: newChatPrivate ? "var(--neon-green)" : "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: newChatPrivate ? "calc(100% - 18px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                </div>
              </button>

              {/* Выбор участников (только если закрытый) */}
              {newChatPrivate && (
                <div className="mb-3">
                  <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Выбери участников {selectedMembers.length > 0 && <span style={{ color: "var(--neon-green)" }}>({selectedMembers.length} выбрано)</span>}
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {manageMembers.filter(m => m.id !== user.id).map(m => {
                      const sel = selectedMembers.includes(m.id);
                      return (
                        <button key={m.id} onClick={() => toggleMember(m.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
                          style={{ background: sel ? "rgba(0,255,179,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${sel ? "rgba(0,255,179,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                            {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                          </div>
                          <span className="flex-1 text-sm text-white truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</span>
                          <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ background: sel ? "var(--neon-green)" : "rgba(255,255,255,0.1)", border: sel ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                            {sel && <Icon name="Check" size={10} style={{ color: "#000" }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {chatCreated && (
                <div className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>
                  Чат создан! Он появится в разделе «Чаты».
                </div>
              )}
              <button onClick={createGroupChat}
                disabled={creatingChat || !newChatName.trim() || (newChatPrivate && selectedMembers.length === 0)}
                className="neon-btn-filled w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ fontFamily: '"Exo 2", sans-serif', opacity: creatingChat ? 0.7 : 1 }}>
                {creatingChat ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} /> : <Icon name={newChatPrivate ? "Lock" : "Plus"} size={15} />}
                {newChatPrivate ? "Создать закрытый чат" : "Создать чат"}
              </button>
            </div>

            {/* Список участников */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Участники клуба</div>
              {manageLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                </div>
              ) : manageMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 px-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                    {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                    <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car || m.role}</div>
                  </div>
                  {m.id !== user.id && (
                    <button onClick={() => toggleAdmin(m.id, !!m.isAdmin)} disabled={togglingId === m.id}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        fontFamily: '"Exo 2", sans-serif',
                        background: m.isAdmin ? "rgba(0,255,179,0.12)" : "rgba(255,255,255,0.06)",
                        border: m.isAdmin ? "1px solid rgba(0,255,179,0.35)" : "1px solid rgba(255,255,255,0.12)",
                        color: m.isAdmin ? "var(--neon-green)" : "rgba(255,255,255,0.4)",
                        opacity: togglingId === m.id ? 0.6 : 1,
                      }}>
                      {togglingId === m.id
                        ? <div className="w-3 h-3 rounded-full border border-current animate-spin opacity-60" />
                        : m.isAdmin ? "Адм ✓" : "Адм"}
                    </button>
                  )}
                  {m.id === user.id && m.isAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>Вы</span>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User, sid: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [car, setCar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!nickname.trim() || !pin.trim()) return;
    setLoading(true);
    setError("");
    const { ok, data } = mode === "login"
      ? await apiLogin(nickname.trim(), pin.trim())
      : await apiRegister(nickname.trim(), pin.trim(), car.trim());
    setLoading(false);
    if (!ok) { setError(data.error || "Ошибка"); return; }
    saveSession({ session_id: data.session_id, user: data.user });
    onLogin(data.user, data.session_id);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,179,0.06) 0%, transparent 70%)" }}>

      <div className="mb-8 text-center">
        <div className="text-5xl mb-4 animate-float">🏎️</div>
        <h1 className="font-black text-2xl tracking-wider mb-1"
          style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)", textShadow: "0 0 16px rgba(0,255,179,0.5)" }}>
          ПУЛЬС<span style={{ color: "var(--neon-blue)" }}> ГОРОДА</span>
        </h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Мессенджер автоклуба</p>
      </div>

      {/* Переключатель */}
      <div className="flex w-full mb-6 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(0,255,179,0.15)" }}>
        {(["login", "register"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{ fontFamily: '"Exo 2", sans-serif', background: mode === m ? "rgba(0,255,179,0.12)" : "transparent", color: mode === m ? "var(--neon-green)" : "rgba(255,255,255,0.4)" }}>
            {m === "login" ? "Войти" : "Регистрация"}
          </button>
        ))}
      </div>

      <div className="w-full space-y-3">
        <div>
          <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>Никнейм</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} onKeyDown={handleKey}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
            placeholder="Ваш никнейм в клубе" />
        </div>

        {mode === "register" && (
          <div>
            <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>Автомобиль</label>
            <input value={car} onChange={e => setCar(e.target.value)} onKeyDown={handleKey}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
              placeholder="Марка и модель" />
          </div>
        )}

        <div>
          <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>
            PIN-код {mode === "register" && "(мин. 4 цифры)"}
          </label>
          <input value={pin} onChange={e => setPin(e.target.value)} onKeyDown={handleKey}
            type="password" inputMode="numeric" maxLength={8}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none tracking-widest"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
            placeholder="••••" />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-2.5 text-sm animate-fade-in"
            style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", color: "#ff6b6b" }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading || !nickname.trim() || !pin.trim()}
          className="neon-btn-filled w-full rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{ fontFamily: '"Exo 2", sans-serif', opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
          ) : (
            <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
          )}
          {mode === "login" ? "Войти в клуб" : "Вступить в клуб"}
        </button>
      </div>

      {mode === "login" && (
        <div className="mt-6 glass-card rounded-xl p-3 w-full" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-center mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.35)" }}>Демо-аккаунты</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {[["Александр", "1234"], ["Максим", "1111"], ["Анна", "2222"], ["Кирилл", "4444"]].map(([n, p]) => (
              <button key={n} onClick={() => { setNickname(n); setPin(p); }}
                className="text-left px-2 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(0,255,179,0.05)", border: "1px solid rgba(0,255,179,0.1)", color: "var(--neon-green)" }}>
                {n} / {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [session, setSession] = useState<{ user: User; session_id: string } | null>(() => getSession());

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "events", icon: "Calendar", label: "События" },
    { id: "gallery", icon: "Image", label: "Галерея" },
    { id: "members", icon: "Users", label: "Клуб" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  const unread = chats.reduce((s, c) => s + c.unread, 0);

  const handleLogin = (user: User, session_id: string) => {
    setSession({ user, session_id });
  };

  const handleAvatarChange = (url: string) => {
    if (!session) return;
    const updated = { ...session, user: { ...session.user, avatarUrl: url } };
    setSession(updated);
    saveSession(updated);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    if (!session) return;
    const updated = { ...session, user: { ...session.user, ...updatedUser } };
    setSession(updated);
    saveSession(updated);
  };

  const WRAP = (
    <div className="flex items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,255,179,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.04) 0%, transparent 60%), var(--bg-dark)" }}>
      <div className="relative flex flex-col w-full max-w-sm h-screen max-h-[812px] overflow-hidden rounded-none sm:rounded-[36px]"
        style={{ background: "var(--bg-dark)", border: "1px solid rgba(0,255,179,0.1)", boxShadow: "0 0 60px rgba(0,255,179,0.07), 0 0 120px rgba(0,212,255,0.04), 0 40px 100px rgba(0,0,0,0.6)" }}>
        {!session ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏎️</span>
                <span className="font-black text-base tracking-wider" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)", textShadow: "0 0 12px rgba(0,255,179,0.5)" }}>
                  ПУЛЬС<span style={{ color: "var(--neon-blue)" }}> ГОРОДА</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.3)" }}>
                    {session.user.avatarUrl
                      ? <img src={session.user.avatarUrl} alt="av" className="w-full h-full object-cover" />
                      : session.user.nickname[0].toUpperCase()}
                  </div>
                </div>
                <button className="relative">
                  <Icon name="Bell" size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                      style={{ background: "var(--neon-green)", color: "var(--bg-dark)", fontSize: "9px" }}>
                      {unread}
                    </span>
                  )}
                </button>
                <span className="w-2.5 h-2.5 rounded-full animate-pulse-neon"
                  style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {tab === "chats" && <ChatsScreen user={session.user} sessionId={session.session_id} />}
              {tab === "events" && <EventsScreen />}
              {tab === "gallery" && <GalleryScreen />}
              {tab === "members" && <MembersScreen />}
              {tab === "search" && <SearchScreen />}
              {tab === "settings" && <SettingsScreen user={session.user} sessionId={session.session_id} onAvatarChange={handleAvatarChange} onProfileUpdate={handleProfileUpdate} />}
            </div>

            {/* Bottom Navigation */}
            <nav className="mobile-nav flex-shrink-0 flex items-center justify-around px-1 py-2">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all relative">
                  <div className="relative">
                    <Icon name={item.icon} size={21}
                      style={{ color: tab === item.id ? "var(--neon-green)" : "rgba(255,255,255,0.3)", filter: tab === item.id ? "drop-shadow(0 0 5px rgba(0,255,179,0.8))" : "none", transition: "all 0.2s ease" }} />
                    {item.id === "chats" && unread > 0 && tab !== "chats" && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                        style={{ background: "var(--neon-green)", color: "var(--bg-dark)", fontSize: "8px" }}>
                        {unread}
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: '"Exo 2", sans-serif', fontSize: "9px", fontWeight: 500, color: tab === item.id ? "var(--neon-green)" : "rgba(255,255,255,0.3)", transition: "color 0.2s ease" }}>
                    {item.label}
                  </span>
                  {tab === item.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
                  )}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );

  return WRAP;
}