import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Tab = "chats" | "events" | "gallery" | "members" | "search" | "settings";

interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
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

interface User {
  id: number;
  nickname: string;
  car: string;
  role: string;
  level: string;
  levelColor: string;
  points: number;
  avatarUrl?: string | null;
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

async function apiGetChats(): Promise<Chat[]> {
  const res = await fetch(`${API}?action=chats`);
  return res.json();
}

async function apiGetMessages(chatId: number, after = 0): Promise<Message[]> {
  const res = await fetch(`${API}?action=messages&chat_id=${chatId}&after=${after}`);
  return res.json();
}

async function apiSendMessage(chatId: number, text: string): Promise<Message> {
  const res = await fetch(`${API}?action=messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
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
function ChatsScreen() {
  const [chatList, setChatList] = useState<Chat[]>(chats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загружаем список чатов из API
  useEffect(() => {
    apiGetChats().then(data => {
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

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChat || sending) return;
    const text = msgText.trim();
    setMsgText("");
    setSending(true);
    const optimistic: Message = { id: Date.now(), text, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }), out: true };
    setMessages(prev => [...prev, optimistic]);
    const saved = await apiSendMessage(activeChat.id, text);
    setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...saved, out: true } : m));
    lastIdRef.current = saved.id;
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,255,179,0.12)" }}>
          <button onClick={closeChat} className="transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="ChevronLeft" size={22} />
          </button>
          <Avatar char={activeChat.avatar} online={activeChat.online} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{activeChat.name}</div>
            <div className="text-xs" style={{ color: "var(--neon-green)" }}>онлайн</div>
          </div>
          <button className="transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Icon name="Phone" size={18} />
          </button>
          <button className="transition-colors ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>
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
              <div className={`max-w-[75%] px-4 py-2.5 ${m.out ? "msg-out" : "msg-in"}`}>
                {!m.out && m.sender && m.sender !== "me" && (
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                )}
                <p className="text-sm text-white">{m.text}</p>
                <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,255,179,0.12)" }}>
          <div className="flex items-center gap-2">
            <button style={{ color: "rgba(255,255,255,0.4)" }}>
              <Icon name="Paperclip" size={20} />
            </button>
            <div className="flex-1 flex items-center rounded-2xl px-4 py-2.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600"
                placeholder="Сообщение..." value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={handleKeyDown} />
            </div>
            <button onClick={sendMessage} disabled={sending || !msgText.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: msgText ? "var(--neon-green)" : "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.3)", opacity: sending ? 0.6 : 1 }}>
              <Icon name="Send" size={16} style={{ color: msgText ? "var(--bg-dark)" : "var(--neon-green)" }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
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
                <span className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{chat.name}</span>
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
        <button className="neon-btn-filled w-full rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm"
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
            {[
              { icon: "Users", label: "Управление клубом" },
              { icon: "Shield", label: "Правила клуба" },
              { icon: "Star", label: "Система рейтинга" },
            ].map((item, idx, arr) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
                  <Icon name={item.icon} size={14} style={{ color: "var(--neon-green)" }} />
                </div>
                <span className="flex-1 text-white text-sm">{item.label}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => { clearSession(); window.location.reload(); }}
          className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-all"
          style={{ fontFamily: '"Exo 2", sans-serif', color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.25)", background: "rgba(255,77,77,0.05)" }}>
          <Icon name="LogOut" size={16} />
          Выйти из аккаунта
        </button>
      </div>
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
              {tab === "chats" && <ChatsScreen />}
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