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
const chats: Chat[] = [];

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



// ─── API ──────────────────────────────────────────────────────────────────────
const API = "https://functions.poehali.dev/7f1b68b2-3be2-4063-bc44-6fdd024576b1";
const AUTH_API = "https://functions.poehali.dev/a1192a6c-cacf-4b21-b110-e0a01c534f8d";
const UPLOAD_AVATAR_API = "https://functions.poehali.dev/6b54dfba-6b17-4476-9ac2-f2563bb89adf";
const ADMIN_API = "https://functions.poehali.dev/fd18bf34-6c49-4fab-83c5-fb58dc050170";
const GALLERY_API = "https://functions.poehali.dev/bd3184a0-efb5-4842-84d5-9f4e3c45aa67";

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
  isFounder?: boolean;
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

async function apiRegister(nickname: string, pin: string, car: string, inviteCode: string, phone?: string, birthDate?: string) {
  const res = await fetch(`${AUTH_API}?action=register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin, car, invite_code: inviteCode, phone, birth_date: birthDate }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function apiGetChats(sessionId?: string): Promise<Chat[]> {
  const res = await fetch(`${API}?action=chats`, {
    headers: sessionId ? { "X-Session-Id": sessionId } : {},
  });
  return res.json();
}

async function apiGetMessages(chatId: number, after = 0, myNickname = ""): Promise<Message[]> {
  const res = await fetch(`${API}?action=messages&chat_id=${chatId}&after=${after}&me=${encodeURIComponent(myNickname)}`);
  return res.json();
}

async function apiSendMessage(chatId: number, payload: {
  text?: string; type?: string; media?: string; media_content_type?: string; sender?: string;
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
  const [deletingChatId, setDeletingChatId] = useState<number | null>(null);
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

  const playNotification = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch (e) { void e; }
  };

  const loadMessages = useCallback(async (chatId: number, after = 0) => {
    const data = await apiGetMessages(chatId, after, user.nickname);
    if (!Array.isArray(data)) return;
    if (after === 0) {
      setMessages(data);
      lastIdRef.current = data.length > 0 ? data[data.length - 1].id : 0;
    } else if (data.length > 0) {
      const incoming = data.filter(m => !m.out);
      if (incoming.length > 0) playNotification();
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
    await pushMessage({ id: Date.now(), text, time: now(), out: true, type: "text", sender: user.nickname }, { text, type: "text", sender: user.nickname });
  };

  const sendEmoji = async (emoji: string) => {
    if (!activeChat || sending) return;
    setShowEmoji(false);
    await pushMessage({ id: Date.now(), text: emoji, time: now(), out: true, type: "emoji", sender: user.nickname }, { text: emoji, type: "emoji", sender: user.nickname });
  };

  const sendImage = async (file: File) => {
    if (!activeChat || sending) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const optimistic: Message = { id: Date.now(), text: "📷 Фото", time: now(), out: true, type: "image", mediaUrl: URL.createObjectURL(file), sender: user.nickname };
      await pushMessage(optimistic, { type: "image", media: base64, media_content_type: file.type, sender: user.nickname });
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
          const optimistic: Message = { id: Date.now(), text: "🎤 Голосовое", time: now(), out: true, type: "voice", mediaUrl: url, sender: user.nickname };
          await pushMessage(optimistic, { type: "voice", media: base64, media_content_type: "audio/webm", sender: user.nickname });
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

  const deleteChat = async (chatId: number) => {
    if (!window.confirm("Удалить этот чат для всех участников?")) return;
    setDeletingChatId(chatId);
    const res = await fetch(`${ADMIN_API}?action=delete_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ chat_id: chatId }),
    });
    if (res.ok) {
      setChatList(prev => prev.filter(c => c.id !== chatId));
      if (activeChat?.id === chatId) closeChat();
    }
    setDeletingChatId(null);
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
          {user.isAdmin && (
            <button onClick={() => deleteChat(activeChat.id)} disabled={deletingChatId === activeChat.id}
              className="transition-colors ml-1"
              style={{ color: deletingChatId === activeChat.id ? "rgba(255,77,77,0.4)" : "rgba(255,77,77,0.7)" }}>
              {deletingChatId === activeChat.id
                ? <div className="w-4 h-4 rounded-full border animate-spin" style={{ borderColor: "rgba(255,77,77,0.3)", borderTopColor: "#ff4d4d" }} />
                : <Icon name="Trash2" size={18} />}
            </button>
          )}
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
interface GFolder { id: number; name: string; coverUrl?: string; itemCount: number; }
interface GItem { id: number; url: string; thumbnailUrl?: string; title: string; type: "photo" | "video"; likes: number; }

function GalleryScreen({ user, sessionId }: { user: User; sessionId: string }) {
  const [folders, setFolders] = useState<GFolder[]>([]);
  const [openFolder, setOpenFolder] = useState<GFolder | null>(null);
  const [items, setItems] = useState<GItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GItem | null>(null);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${GALLERY_API}?action=folders`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setFolders(d); }).finally(() => setLoading(false));
  }, []);

  const openFolderView = async (folder: GFolder) => {
    setOpenFolder(folder);
    setItems([]);
    setFilter("all");
    const res = await fetch(`${GALLERY_API}?action=items&folder_id=${folder.id}`);
    const d = await res.json();
    if (Array.isArray(d)) setItems(d);
  };

  const pickFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreview(preview);
    setPendingTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const confirmUpload = async () => {
    if (!openFolder || !pendingFile) return;
    setUploading(true);
    const file = pendingFile;
    const title = pendingTitle.trim() || file.name.replace(/\.[^.]+$/, "");
    setPendingFile(null);
    setPendingPreview(null);
    setPendingTitle("");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch(`${GALLERY_API}?action=upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ folder_id: openFolder.id, file: base64, content_type: file.type, title }),
      });
      const d = await res.json();
      if (res.ok) {
        setItems(prev => [d, ...prev]);
        setFolders(prev => prev.map(f => f.id === openFolder.id ? { ...f, itemCount: f.itemCount + 1, coverUrl: f.coverUrl || (d.type === "photo" ? d.url : f.coverUrl) } : f));
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLike = async (item: GItem) => {
    const res = await fetch(`${GALLERY_API}?action=like&item_id=${item.id}`, { method: "POST" });
    const d = await res.json();
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, likes: d.likes } : i));
    if (selectedItem?.id === item.id) setSelectedItem(prev => prev ? { ...prev, likes: d.likes } : prev);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    const res = await fetch(`${GALLERY_API}?action=create_folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    const d = await res.json();
    if (res.ok) { setFolders(prev => [...prev, d]); setNewFolderName(""); setNewFolderOpen(false); }
    setCreatingFolder(false);
  };

  const filtered = items.filter(i => filter === "all" || i.type === filter);

  // ── Просмотр файла ──
  if (selectedItem) return (
    <div className="flex flex-col h-full animate-fade-in" style={{ background: "#000" }}>
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => setSelectedItem(null)} style={{ color: "rgba(255,255,255,0.6)" }}>
          <Icon name="ChevronLeft" size={22} />
        </button>
        <span className="flex-1 font-semibold text-white truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selectedItem.title}</span>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {selectedItem.type === "video" ? (
          <video src={selectedItem.url} controls className="w-full max-h-full object-contain" />
        ) : (
          <img src={selectedItem.url} alt={selectedItem.title} className="w-full max-h-full object-contain" />
        )}
      </div>
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{selectedItem.type === "video" ? "🎬 Видео" : "📷 Фото"}</p>
        <div className="flex items-center gap-4">
          <button onClick={() => handleLike(selectedItem)} className="flex items-center gap-1.5 text-sm transition-all" style={{ color: "rgba(255,255,255,0.6)" }}>
            <Icon name="Heart" size={18} style={{ color: "#ff6b6b" }} />
            <span>{selectedItem.likes}</span>
          </button>
          <a href={selectedItem.url} download target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="Download" size={18} />
          </a>
        </div>
      </div>
    </div>
  );

  // ── Содержимое папки ──
  if (openFolder) return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
        <button onClick={() => setOpenFolder(null)} style={{ color: "rgba(255,255,255,0.5)" }}>
          <Icon name="ChevronLeft" size={22} />
        </button>
        <span className="flex-1 font-bold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>{openFolder.name}</span>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
          style={{ fontFamily: '"Exo 2", sans-serif', background: "rgba(0,255,179,0.12)", border: "1px solid rgba(0,255,179,0.3)", color: "var(--neon-green)", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} /> : <Icon name="Upload" size={13} />}
          Загрузить
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />

        {/* Модал подписи перед загрузкой */}
        {pendingFile && pendingPreview && (
          <div className="absolute inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) { setPendingFile(null); setPendingPreview(null); } }}>
            <div className="w-full max-w-sm rounded-t-3xl p-5 animate-fade-in"
              style={{ background: "var(--bg-dark)", border: "1px solid rgba(0,255,179,0.15)", borderBottom: "none" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Добавить подпись</h3>
                <button onClick={() => { setPendingFile(null); setPendingPreview(null); }}>
                  <Icon name="X" size={20} style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              </div>

              {/* Превью */}
              <div className="rounded-xl overflow-hidden mb-4" style={{ maxHeight: 220 }}>
                {pendingFile.type.startsWith("video") ? (
                  <video src={pendingPreview} className="w-full object-cover rounded-xl" style={{ maxHeight: 220 }} />
                ) : (
                  <img src={pendingPreview} alt="preview" className="w-full object-cover rounded-xl" style={{ maxHeight: 220 }} />
                )}
              </div>

              {/* Поле подписи */}
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.45)" }}>
                  Подпись (необязательно)
                </label>
                <input value={pendingTitle} onChange={e => setPendingTitle(e.target.value)}
                  placeholder="Например: Moscow Raceway, закат..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
                  onKeyDown={e => e.key === "Enter" && confirmUpload()}
                  autoFocus />
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setPendingFile(null); setPendingPreview(null); }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold"
                  style={{ fontFamily: '"Exo 2", sans-serif', background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button onClick={confirmUpload}
                  className="flex-1 neon-btn-filled rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Exo 2", sans-serif' }}>
                  <Icon name="Upload" size={15} />
                  Загрузить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 py-2 flex-shrink-0">
        {([["all", "Все"], ["photo", "Фото"], ["video", "Видео"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className="text-xs px-3 py-1 rounded-lg transition-all"
            style={{ fontFamily: '"Exo 2", sans-serif', background: filter === val ? "rgba(0,255,179,0.12)" : "rgba(255,255,255,0.05)", color: filter === val ? "var(--neon-green)" : "rgba(255,255,255,0.45)", border: filter === val ? "1px solid rgba(0,255,179,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 && !uploading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Icon name="Image" size={36} style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Нет файлов. Загрузи первый!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map(item => (
              <button key={item.id} onClick={() => setSelectedItem(item)}
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {item.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(191,0,255,0.2), rgba(0,212,255,0.15))" }}>
                    <Icon name="Play" size={24} style={{ color: "rgba(255,255,255,0.7)" }} />
                  </div>
                ) : (
                  <img src={item.thumbnailUrl || item.url} alt={item.title} className="w-full h-full object-cover" />
                )}
                {item.type === "video" && (
                  <div className="absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5"
                    style={{ background: "rgba(0,0,0,0.7)", fontSize: "9px", color: "#fff" }}>▶ Видео</div>
                )}
                <div className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-1.5"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}>
                  {item.title && (
                    <p className="text-white truncate mb-0.5" style={{ fontSize: "10px", fontWeight: 600 }}>{item.title}</p>
                  )}
                  <div className="flex items-center gap-0.5" style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)" }}>
                    ❤ {item.likes}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Список папок ──
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {newFolderOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setNewFolderOpen(false); }}>
          <div className="w-full max-w-sm rounded-t-3xl p-6 animate-fade-in"
            style={{ background: "var(--bg-dark)", border: "1px solid rgba(0,255,179,0.15)", borderBottom: "none" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Новая папка</h3>
              <button onClick={() => setNewFolderOpen(false)}><Icon name="X" size={20} style={{ color: "rgba(255,255,255,0.4)" }} /></button>
            </div>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              placeholder="Название папки"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
              onKeyDown={e => e.key === "Enter" && createFolder()} />
            <button onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}
              className="neon-btn-filled w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ fontFamily: '"Exo 2", sans-serif', opacity: creatingFolder ? 0.7 : 1 }}>
              {creatingFolder ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} /> : <Icon name="FolderPlus" size={15} />}
              Создать
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <h2 className="font-bold text-xl text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Галерея</h2>
        {user.isAdmin && (
          <button onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ fontFamily: '"Exo 2", sans-serif', background: "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.25)", color: "var(--neon-green)" }}>
            <Icon name="FolderPlus" size={13} />
            Папка
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Icon name="FolderOpen" size={40} style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Папок пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {folders.map((folder, i) => (
              <button key={folder.id} onClick={() => openFolderView(folder)}
                className="relative rounded-2xl overflow-hidden aspect-square transition-all animate-fade-in"
                style={{ border: "1px solid rgba(255,255,255,0.08)", animationDelay: `${i * 0.04}s` }}>
                {folder.coverUrl ? (
                  <img src={folder.coverUrl} alt={folder.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.1), rgba(0,212,255,0.08))" }}>
                    <Icon name="Folder" size={40} style={{ color: "rgba(0,255,179,0.4)" }} />
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                  <p className="font-bold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{folder.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{folder.itemCount} файлов</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEMBERS SCREEN ───────────────────────────────────────────────────────────
function MembersScreen() {
  const [membersList, setMembersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${ADMIN_API}?action=members`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMembersList(d); })
      .finally(() => setLoading(false));
  }, []);

  const maxPoints = membersList.length > 0 ? Math.max(...membersList.map(m => m.points)) : 1;
  const top = membersList[0];

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
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white overflow-hidden"
                style={{ fontFamily: '"Exo 2", sans-serif', background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "2px solid rgba(0,255,179,0.35)", boxShadow: "0 0 30px rgba(0,255,179,0.2)" }}>
                {selected.avatarUrl
                  ? <img src={selected.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : selected.nickname[0].toUpperCase()}
              </div>
            </div>
            <h3 className="font-bold text-white text-xl" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.nickname}</h3>
            <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {selected.isFounder && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,107,0,0.15)", color: "#ff6b00", border: "1px solid rgba(255,107,0,0.3)" }}>Основатель</span>}
              {!selected.isFounder && selected.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>Админ</span>}
              {selected.role}
            </p>
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

          {selected.car && (
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="text-xs mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Автомобиль</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <span className="font-semibold text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>{selected.car}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-bold text-xl text-white mb-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Участники</h2>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{membersList.length} членов клуба</p>
      </div>

      {top && (
        <div className="px-4 mb-3">
          <div className="glass-card rounded-xl p-3 text-center" style={{ border: "1px solid rgba(0,255,179,0.15)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>🏆 Топ клуба</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">👑</span>
              <div className="text-left">
                <div className="font-bold text-white text-sm" style={{ fontFamily: '"Exo 2", sans-serif' }}>{top.nickname}</div>
                <div className="text-xs" style={{ color: "var(--neon-green)" }}>{top.points.toLocaleString()} очков</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
          </div>
        ) : membersList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Icon name="Users" size={40} style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Участников пока нет</p>
          </div>
        ) : membersList.map((m, i) => (
          <button key={m.id} onClick={() => setSelected(m)}
            className="w-full glass-card rounded-xl p-3 flex items-center gap-3 card-hover text-left animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="font-bold text-lg w-6 text-center flex-shrink-0"
              style={{ fontFamily: '"Exo 2", sans-serif', color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.3)" }}>
              {i + 1}
            </span>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(0,255,179,0.25)" }}>
              {m.avatarUrl
                ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                : m.nickname[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</span>
                {m.isFounder && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,107,0,0.15)", color: "#ff6b00", fontSize: "10px" }}>Осн.</span>}
                {!m.isFounder && m.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", fontSize: "10px" }}>Адм</span>}
                <NeonBadge label={m.level} color={m.levelColor} />
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car || m.role}</div>
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
  } : null;

  const hasResults = filtered && (filtered.chats.length + filtered.events.length > 0);

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
  const [panel, setPanel] = useState<"rules" | "rating" | "manage" | "invite" | null>(null);

  // ── Код приглашения ──
  const [inviteCodeVal, setInviteCodeVal] = useState("");
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [inviteCodeSaving, setInviteCodeSaving] = useState(false);
  const [inviteCodeSaved, setInviteCodeSaved] = useState(false);

  const openInviteCode = async () => {
    setPanel("invite");
    setInviteCodeLoading(true);
    const res = await fetch(`${ADMIN_API}?action=invite_code`, {
      headers: { "X-Session-Id": sessionId },
    });
    const d = await res.json();
    setInviteCodeVal(d.code || "");
    setInviteCodeLoading(false);
  };

  const saveInviteCode = async () => {
    if (!inviteCodeVal.trim() || inviteCodeVal.trim().length < 4) return;
    setInviteCodeSaving(true);
    await fetch(`${ADMIN_API}?action=set_invite_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ code: inviteCodeVal.trim() }),
    });
    setInviteCodeSaving(false);
    setInviteCodeSaved(true);
    setTimeout(() => setInviteCodeSaved(false), 2500);
  };

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
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleInput, setRoleInput] = useState<Record<number, string>>({});
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const [detailsMap, setDetailsMap] = useState<Record<number, { phone?: string; birthDate?: string } | null>>({});
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
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

  const saveRole = async (memberId: number) => {
    const role = (roleInput[memberId] || "").trim();
    setSavingRoleId(memberId);
    const res = await fetch(`${ADMIN_API}?action=set_role`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ user_id: memberId, role }),
    });
    const d = await res.json();
    if (res.ok) {
      setManageMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: d.role } : m));
      setEditingRoleId(null);
    }
    setSavingRoleId(null);
  };

  const loadUserDetails = async (memberId: number) => {
    if (detailsMap[memberId] !== undefined) return;
    setLoadingDetailsId(memberId);
    const res = await fetch(`${ADMIN_API}?action=user_details&user_id=${memberId}`, {
      headers: { "X-Session-Id": sessionId },
    });
    const d = await res.json();
    setDetailsMap(prev => ({ ...prev, [memberId]: res.ok ? d : null }));
    setLoadingDetailsId(null);
  };

  const removeUser = async (memberId: number, nickname: string) => {
    if (!window.confirm(`Удалить участника «${nickname}» из клуба?`)) return;
    setRemovingUserId(memberId);
    const res = await fetch(`${ADMIN_API}?action=remove_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
      body: JSON.stringify({ user_id: memberId }),
    });
    if (res.ok) {
      setManageMembers(prev => prev.filter(m => m.id !== memberId));
    }
    setRemovingUserId(null);
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
            <div className="font-bold text-white truncate flex items-center gap-2" style={{ fontFamily: '"Exo 2", sans-serif' }}>
              {user.nickname}
              {user.isFounder && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(255,107,0,0.15)", color: "#ff6b00", border: "1px solid rgba(255,107,0,0.3)" }}>
                  Основатель
                </span>
              )}
            </div>
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
            <button onClick={openRating} className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ borderBottom: user.isFounder ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                <Icon name="Star" size={14} style={{ color: "var(--neon-green)" }} />
              </div>
              <span className="flex-1 text-white text-sm">Система рейтинга</span>
              {user.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)" }}>Адм</span>}
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
            </button>
            {user.isFounder && (
              <button onClick={openInviteCode} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.25)" }}>
                  <Icon name="Key" size={14} style={{ color: "#ff6b00" }} />
                </div>
                <span className="flex-1 text-white text-sm">Код приглашения</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2"
                  style={{ background: "rgba(255,107,0,0.12)", color: "#ff6b00", border: "1px solid rgba(255,107,0,0.25)" }}>Основатель</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
              </button>
            )}
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

      {/* ── Панель: Код приглашения (только для основателя) ── */}
      {panel === "invite" && user.isFounder && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,107,0,0.2)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white flex-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Код приглашения</h3>
          </div>
          <div className="flex-1 p-5 flex flex-col gap-5">
            <div className="glass-card rounded-2xl p-4" style={{ border: "1px solid rgba(255,107,0,0.2)" }}>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Этот код нужно сообщать участникам для регистрации. Без него зарегистрироваться невозможно. После смены старый код перестаёт работать.
              </p>
              {inviteCodeLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,107,0,0.3)", borderTopColor: "#ff6b00" }} />
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <label className="text-xs mb-1.5 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.45)" }}>Текущий код</label>
                    <div className="flex items-center gap-2">
                      <input value={inviteCodeVal} onChange={e => setInviteCodeVal(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl px-4 py-3 text-lg font-mono text-white outline-none tracking-widest"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,0,0.3)" }}
                        placeholder="MOTOCLUB2026"
                        onKeyDown={e => e.key === "Enter" && saveInviteCode()} />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Минимум 4 символа, только латиница и цифры</p>
                  </div>

                  {inviteCodeSaved && (
                    <div className="text-xs mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.2)", color: "var(--neon-green)" }}>
                      <Icon name="Check" size={13} />
                      Код успешно сохранён
                    </div>
                  )}

                  <button onClick={saveInviteCode}
                    disabled={inviteCodeSaving || !inviteCodeVal.trim() || inviteCodeVal.trim().length < 4}
                    className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{ fontFamily: '"Exo 2", sans-serif', background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.35)", color: "#ff6b00", opacity: inviteCodeSaving ? 0.7 : 1 }}>
                    {inviteCodeSaving
                      ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,107,0,0.3)", borderTopColor: "#ff6b00" }} />
                      : <Icon name="Save" size={15} />}
                    Сохранить новый код
                  </button>
                </>
              )}
            </div>
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
                <div key={m.id} className="py-2.5 px-1 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                    {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                    <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.car || m.role}</div>
                  </div>
                  {/* Бейджи */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {m.isFounder && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(255,107,0,0.15)", color: "#ff6b00", border: "1px solid rgba(255,107,0,0.3)", fontFamily: '"Exo 2", sans-serif' }}>
                        Основатель
                      </span>
                    )}
                    {!m.isFounder && m.isAdmin && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.2)", fontFamily: '"Exo 2", sans-serif' }}>
                        Админ
                      </span>
                    )}
                    {m.id === user.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: '"Exo 2", sans-serif' }}>
                        Вы
                      </span>
                    )}
                  </div>
                </div>

                {/* Строка управления (только для других, только основатель) */}
                {user.isFounder && m.id !== user.id && (
                  <div className="flex items-center gap-2 mt-1.5 pl-[52px]">
                    {/* Должность */}
                    {editingRoleId === m.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input value={roleInput[m.id] ?? m.role ?? ""}
                          onChange={e => setRoleInput(prev => ({ ...prev, [m.id]: e.target.value }))}
                          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,255,179,0.25)" }}
                          placeholder="Должность..."
                          onKeyDown={e => e.key === "Enter" && saveRole(m.id)}
                          autoFocus />
                        <button onClick={() => saveRole(m.id)} disabled={savingRoleId === m.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--neon-green)" }}>
                          {savingRoleId === m.id
                            ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />
                            : <Icon name="Check" size={13} style={{ color: "#000" }} />}
                        </button>
                        <button onClick={() => setEditingRoleId(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.07)" }}>
                          <Icon name="X" size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingRoleId(m.id); setRoleInput(prev => ({ ...prev, [m.id]: m.role || "" })); }}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
                        <Icon name="Pencil" size={11} />
                        {m.role || "Участник"}
                      </button>
                    )}
                    {/* Кнопка Адм — только основатель, не для других основателей */}
                    {!m.isFounder && (
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
                          : m.isAdmin ? "Адм ✓" : "+ Адм"}
                      </button>
                    )}
                    {/* Кнопка просмотра личных данных */}
                    <button onClick={() => loadUserDetails(m.id)} disabled={loadingDetailsId === m.id}
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      title="Личные данные">
                      {loadingDetailsId === m.id
                        ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.6)" }} />
                        : <Icon name="Info" size={13} style={{ color: "rgba(255,255,255,0.45)" }} />}
                    </button>
                    {/* Кнопка удаления участника — только для основателя */}
                    {user.isFounder && !m.isFounder && (
                      <button onClick={() => removeUser(m.id, m.nickname)} disabled={removingUserId === m.id}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)" }}>
                        {removingUserId === m.id
                          ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(255,77,77,0.3)", borderTopColor: "#ff4d4d" }} />
                          : <Icon name="UserX" size={13} style={{ color: "#ff6b6b" }} />}
                      </button>
                    )}
                  </div>

                )}

                {/* Блок личных данных (только основатель, после загрузки) */}
                {user.isFounder && m.id !== user.id && detailsMap[m.id] !== undefined && (
                  <div className="mt-2 pl-[52px]">
                    {detailsMap[m.id] === null ? (
                      <p className="text-xs" style={{ color: "rgba(255,77,77,0.7)" }}>Ошибка загрузки</p>
                    ) : (
                      <div className="rounded-xl px-3 py-2 space-y-1"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-center gap-2 text-xs">
                          <Icon name="Phone" size={11} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                          <span style={{ color: detailsMap[m.id]?.phone ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                            {detailsMap[m.id]?.phone || "Телефон не указан"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Icon name="Calendar" size={11} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                          <span style={{ color: detailsMap[m.id]?.birthDate ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                            {detailsMap[m.id]?.birthDate
                              ? new Date(detailsMap[m.id]!.birthDate!).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })
                              : "Дата рождения не указана"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
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
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!nickname.trim() || !pin.trim()) return;
    if (mode === "register" && !inviteCode.trim()) { setError("Введите код приглашения"); return; }
    setLoading(true);
    setError("");
    const { ok, data } = mode === "login"
      ? await apiLogin(nickname.trim(), pin.trim())
      : await apiRegister(nickname.trim(), pin.trim(), car.trim(), inviteCode.trim(), phone.trim() || undefined, birthDate || undefined);
    setLoading(false);
    if (!ok) { setError(data.error || "Ошибка"); return; }
    saveSession({ session_id: data.session_id, user: data.user });
    onLogin(data.user, data.session_id);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,255,179,0.06) 0%, transparent 70%)" }}>

      <div className="mb-6 text-center">
        <img src="https://cdn.poehali.dev/projects/63e708a6-7a81-48b1-9e5a-267986d3465b/bucket/869e4556-4d7c-40f3-9bdb-b119c62778b8.jpg"
          alt="Пульс Города" className="mx-auto animate-float"
          style={{ width: 140, height: 140, objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(0,255,179,0.25))" }} />
        <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Мессенджер Пульс Города · Севастополь</p>
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
          <>
            <div>
              <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>Автомобиль</label>
              <input value={car} onChange={e => setCar(e.target.value)} onKeyDown={handleKey}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
                placeholder="Марка и модель" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>
                Номер телефона
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={handleKey}
                type="tel"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
                placeholder="+7 900 000 00 00" />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Видно только основателю клуба</p>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>
                Дата рождения
              </label>
              <input value={birthDate} onChange={e => setBirthDate(e.target.value)}
                type="date"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)", colorScheme: "dark" }} />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Видно только основателю клуба</p>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.5)" }}>
                Код приглашения <span style={{ color: "#ff6b6b" }}>*</span>
              </label>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} onKeyDown={handleKey}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none tracking-widest font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${inviteCode ? "rgba(0,255,179,0.35)" : "rgba(0,255,179,0.2)"}` }}
                placeholder="XXXXXXXX" />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Получи код у администратора клуба</p>
            </div>
          </>
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
                <img src="https://cdn.poehali.dev/projects/63e708a6-7a81-48b1-9e5a-267986d3465b/bucket/869e4556-4d7c-40f3-9bdb-b119c62778b8.jpg"
                  alt="Пульс Города"
                  style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(0,255,179,0.3))" }} />
                <span className="font-black text-sm tracking-wider" style={{ fontFamily: '"Exo 2", sans-serif', color: "var(--neon-green)", textShadow: "0 0 10px rgba(0,255,179,0.4)" }}>
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
              {tab === "gallery" && <GalleryScreen user={session.user} sessionId={session.session_id} />}
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