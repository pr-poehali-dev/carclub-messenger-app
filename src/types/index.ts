// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Tab = "chats" | "events" | "gallery" | "members" | "search" | "settings";

export interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
  sender?: string;
  type?: "text" | "image" | "voice" | "emoji";
  mediaUrl?: string | null;
}

export interface Chat {
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

export interface ClubEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  members: number;
  tag: string;
  tagColor: string;
  emoji: string;
}

export interface GalleryItem {
  id: number;
  emoji: string;
  title: string;
  event: string;
  likes: number;
  isVideo?: boolean;
  bg: string;
}

export interface Member {
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

export interface User {
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

export interface GFolder { id: number; name: string; coverUrl?: string; itemCount: number; }
export interface GItem { id: number; url: string; thumbnailUrl?: string; title: string; type: "photo" | "video"; likes: number; }

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const chats: Chat[] = [
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

export const events: ClubEvent[] = [
  { id: 1, title: "Ночной трек-день", date: "30 марта, 20:00", location: "Moscow Raceway", members: 24, tag: "Гонки", tagColor: "#00ffb3", emoji: "🏁" },
  { id: 2, title: "Встреча клуба", date: "5 апреля, 10:00", location: "Лужники, парковка А", members: 47, tag: "Встреча", tagColor: "#00d4ff", emoji: "🤝" },
  { id: 3, title: "Дрифт-шоу 2026", date: "12 апреля, 14:00", location: "Крокус Экспо", members: 112, tag: "Шоу", tagColor: "#bf00ff", emoji: "🔥" },
  { id: 4, title: "Сезонное ТО", date: "20 апреля, 9:00", location: "СТО «Мотор»", members: 18, tag: "Сервис", tagColor: "#ff6b00", emoji: "🔧" },
  { id: 5, title: "Фотосессия суперкаров", date: "27 апреля, 11:00", location: "Воробьёвы горы", members: 31, tag: "Фото", tagColor: "#00ffb3", emoji: "📸" },
];

export const gallery: GalleryItem[] = [
  { id: 1, emoji: "🏎️", title: "Moscow Raceway Night", event: "Трек-день", likes: 84, bg: "from-green-900/40 to-cyan-900/40" },
  { id: 2, emoji: "🔥", title: "Дрифт под дождём", event: "Дрифт-шоу", likes: 127, isVideo: true, bg: "from-purple-900/40 to-pink-900/40" },
  { id: 3, emoji: "🌆", title: "Ночной город", event: "Фотосессия", likes: 56, bg: "from-blue-900/40 to-indigo-900/40" },
  { id: 4, emoji: "⚡", title: "Tesla vs Porsche", event: "Тест-драйв", likes: 93, bg: "from-yellow-900/40 to-orange-900/40" },
  { id: 5, emoji: "🏁", title: "Старт гонки", event: "Трек-день", likes: 201, isVideo: true, bg: "from-red-900/40 to-rose-900/40" },
  { id: 6, emoji: "🛞", title: "Смена резины", event: "Встреча", likes: 38, bg: "from-slate-900/40 to-gray-900/40" },
];

export const members: Member[] = [
  { id: 1, name: "Александр Громов", car: "BMW M3 G80", avatar: "А", level: "Легенда", levelColor: "#ff6b00", points: 9850, online: true, role: "Президент клуба" },
  { id: 2, name: "Максим Рублёв", car: "Nissan GT-R R35", avatar: "М", level: "Эксперт", levelColor: "#bf00ff", points: 7420, online: true, role: "Капитан дрифт-команды" },
  { id: 3, name: "Анна Соколова", car: "Porsche 911 GT3", avatar: "А", level: "Профи", levelColor: "#00d4ff", points: 5130, online: false, role: "Организатор событий" },
  { id: 4, name: "Дмитрий Орлов", car: "Mercedes AMG GT", avatar: "Д", level: "Профи", levelColor: "#00d4ff", points: 4890, online: false, role: "Механик" },
  { id: 5, name: "Кирилл Зайцев", car: "Toyota Supra A90", avatar: "К", level: "Новичок", levelColor: "#00ffb3", points: 1240, online: true, role: "Участник" },
];

// ─── API ──────────────────────────────────────────────────────────────────────
export const API = "https://functions.poehali.dev/7f1b68b2-3be2-4063-bc44-6fdd024576b1";
export const AUTH_API = "https://functions.poehali.dev/a1192a6c-cacf-4b21-b110-e0a01c534f8d";
export const UPLOAD_AVATAR_API = "https://functions.poehali.dev/6b54dfba-6b17-4476-9ac2-f2563bb89adf";
export const ADMIN_API = "https://functions.poehali.dev/fd18bf34-6c49-4fab-83c5-fb58dc050170";
export const GALLERY_API = "https://functions.poehali.dev/bd3184a0-efb5-4842-84d5-9f4e3c45aa67";

// ─── SESSION ──────────────────────────────────────────────────────────────────
export const SESSION_KEY = "motoclub_session";

export function getSession(): { session_id: string; user: User } | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
export function saveSession(data: { session_id: string; user: User }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
export async function apiLogin(nickname: string, pin: string) {
  const res = await fetch(`${AUTH_API}?action=login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function apiRegister(nickname: string, pin: string, car: string, inviteCode: string, phone?: string, birthDate?: string) {
  const res = await fetch(`${AUTH_API}?action=register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, pin, car, invite_code: inviteCode, phone, birth_date: birthDate }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function apiGetChats(sessionId?: string): Promise<Chat[]> {
  const res = await fetch(`${API}?action=chats`, {
    headers: sessionId ? { "X-Session-Id": sessionId } : {},
  });
  return res.json();
}

export async function apiGetMessages(chatId: number, after = 0): Promise<Message[]> {
  const res = await fetch(`${API}?action=messages&chat_id=${chatId}&after=${after}`);
  return res.json();
}

export async function apiSendMessage(chatId: number, payload: {
  text?: string; type?: string; media?: string; media_content_type?: string;
}): Promise<Message> {
  const res = await fetch(`${API}?action=messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload }),
  });
  return res.json();
}
