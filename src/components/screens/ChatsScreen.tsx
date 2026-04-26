import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  User, Chat, Message, chats,
  API, ADMIN_API, PUSH_API,
  apiGetChats, apiGetMessages, apiSendMessage,
  apiEditMessage, apiRemoveMessage, apiToggleReaction, apiCreateChat,
} from "@/components/shared/types";

export function Avatar({ char, size = "md", online }: { char: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = { sm: "w-9 h-9 text-sm", md: "w-11 h-11 text-base", lg: "w-16 h-16 text-2xl" };
  const isUrl = char && (char.startsWith("http") || char.startsWith("/"));
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold overflow-hidden`}
        style={{ fontFamily: '"Exo 2", sans-serif', background: "linear-gradient(135deg, rgba(0,255,179,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(0,255,179,0.25)" }}>
        {isUrl
          ? <img src={char} alt="" className="w-full h-full object-cover" />
          : <span style={{ color: "white" }}>{char}</span>
        }
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)", borderColor: "var(--bg-dark)" }} />
      )}
    </div>
  );
}

export function NeonBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ fontFamily: '"Exo 2", sans-serif', background: `${color}18`, color, border: `1px solid ${color}35` }}>
      {label}
    </span>
  );
}

export default function ChatsScreen({ user, sessionId, onUnreadChange, onOpenLightbox }: { user: User; sessionId: string; onUnreadChange?: (n: number) => void; onOpenLightbox?: (url: string) => void }) {
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
  const [msgMenu, setMsgMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: number; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number; text: string; sender: string } | null>(null);
  const [reactionPicker, setReactionPicker] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioCtxRef = useRef<any>(null);

  useEffect(() => {
    apiGetChats(sessionId).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setChatList(data);
        onUnreadChange?.(data.reduce((s, c) => s + (c.unread || 0), 0));
      }
    }).catch(() => {});
  }, []);

  const playNotification = () => {
    if (localStorage.getItem("msg_sound") === "off") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
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

  const openChat = useCallback(async (chat: Chat) => {
    setLoading(true);
    setMessages([]);
    lastIdRef.current = 0;
    setActiveChat(chat);
    setChatList(prev => {
      const updated = prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c);
      onUnreadChange?.(updated.reduce((s, c) => s + (c.unread || 0), 0));
      return updated;
    });
    fetch(`${API}?action=mark_read&chat_id=${chat.id}`, { method: "POST", headers: { "X-Session-Id": sessionId } });
    await loadMessages(chat.id, 0);
    setLoading(false);
    pollRef.current = setInterval(() => {
      loadMessages(chat.id, lastIdRef.current);
    }, 3000);
  }, [loadMessages, sessionId, onUnreadChange]);

  const closeChat = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setActiveChat(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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
    fetch(`${PUSH_API}?action=send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: user.nickname,
        title: `${user.nickname} • ${activeChat.name}`,
        message: optimistic.type === "image" ? "📷 Фото" : optimistic.type === "voice" ? "🎤 Голосовое" : optimistic.type === "video" ? "🎬 Видео" : optimistic.text,
      }),
    }).catch(() => {});
  };

  const now = () => new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChat || sending) return;
    const text = msgText.trim();
    setMsgText("");
    setShowEmoji(false);
    const reply = replyingTo;
    setReplyingTo(null);
    const optimistic: Message = { id: Date.now(), text, time: now(), out: true, type: "text", sender: user.nickname,
      replyToId: reply?.id, replyToText: reply?.text, replyToSender: reply?.sender };
    const payload: Parameters<typeof apiSendMessage>[1] = { text, type: "text", sender: user.nickname,
      ...(reply ? { replyToId: reply.id, replyToText: reply.text, replyToSender: reply.sender } : {}) };
    await pushMessage(optimistic, payload);
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

  const sendVideo = async (file: File) => {
    if (!activeChat || sending) return;
    if (file.size > 50 * 1024 * 1024) { alert("Видео слишком большое. Максимум 50 МБ."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const optimistic: Message = { id: Date.now(), text: "🎬 Видео", time: now(), out: true, type: "video", mediaUrl: URL.createObjectURL(file), sender: user.nickname };
      await pushMessage(optimistic, { type: "video", media: base64, media_content_type: file.type, sender: user.nickname });
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

  const submitEdit = async () => {
    if (!editingMsg || !editingMsg.text.trim()) return;
    const { id, text } = editingMsg;
    setEditingMsg(null);
    setMsgText("");
    await apiEditMessage(id, text, sessionId);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text, isEdited: true } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMsg) submitEdit(); else sendMessage();
    }
    if (e.key === "Escape" && editingMsg) { setEditingMsg(null); setMsgText(""); }
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
    const avatarChar = member.avatarUrl ? member.avatarUrl : member.nickname[0].toUpperCase();
    const bothIds = [user.id, member.id].filter(Boolean) as number[];
    const created = await apiCreateChat(member.nickname, avatarChar, false, bothIds, sessionId);
    const existing = chatList.find(c => c.id === created.id);
    if (existing) { openChat(existing); return; }
    const newChat: Chat = {
      id: created.id, name: member.nickname,
      avatar: avatarChar,
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
            <div key={m.id} id={`msg-${m.id}`} className={`flex ${m.out ? "justify-end" : "justify-start"} animate-fade-in`}
              onContextMenu={!m.isRemoved ? (e) => { e.preventDefault(); setMsgMenu({ id: m.id, x: e.clientX, y: e.clientY }); } : undefined}
              onTouchStart={!m.isRemoved ? (() => { let t: ReturnType<typeof setTimeout>; let moved = false; const onMove = () => { moved = true; }; const onEnd = () => { clearTimeout(t); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); }; return (e: React.TouchEvent) => { moved = false; const touch = e.touches[0]; const x = touch.clientX; const y = touch.clientY; document.addEventListener("touchmove", onMove, { passive: true }); document.addEventListener("touchend", onEnd, { once: true }); t = setTimeout(() => { if (!moved) setMsgMenu({ id: m.id, x, y }); }, 600); }; })() : undefined}
            >
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
                  <img src={m.mediaUrl} alt="фото" className="rounded-xl w-full object-cover cursor-pointer" style={{ maxHeight: 220 }} onClick={() => onOpenLightbox?.(m.mediaUrl!)} />
                  <p className="text-xs mt-1 text-right px-2 pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
                </div>
              ) : m.type === "voice" && m.mediaUrl && !m.isRemoved ? (
                <div className={`flex items-end gap-1 ${m.out ? "flex-row-reverse" : "flex-row"}`}>
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
                  {m.out && (
                    <button className="mb-1 p-1.5 rounded-full opacity-40 hover:opacity-80 transition-opacity"
                      style={{ color: "#ff4d4d" }}
                      onClick={(e) => setMsgMenu({ id: m.id, x: e.clientX, y: e.clientY })}>
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              ) : m.type === "video" && m.mediaUrl && !m.isRemoved ? (
                <div className={`flex items-end gap-1 ${m.out ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`max-w-[75%] ${m.out ? "msg-out" : "msg-in"} overflow-hidden p-1`}>
                    {!m.out && m.sender && m.sender !== "me" && (
                      <p className="text-xs font-semibold mb-1 px-2" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                    )}
                    <video controls src={m.mediaUrl} className="rounded-xl w-full" style={{ maxHeight: 260, background: "#000" }} playsInline />
                    <p className="text-xs mt-1 text-right px-2 pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.time}</p>
                  </div>
                  {m.out && (
                    <button className="mb-1 p-1.5 rounded-full opacity-40 hover:opacity-80 transition-opacity"
                      style={{ color: "#ff4d4d" }}
                      onClick={(e) => setMsgMenu({ id: m.id, x: e.clientX, y: e.clientY })}>
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={`max-w-[75%] px-4 py-2.5 ${m.out ? "msg-out" : "msg-in"} ${m.isRemoved ? "opacity-50" : ""}`}>
                  {!m.out && m.sender && m.sender !== "me" && (
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--neon-blue)" }}>{m.sender}</p>
                  )}
                  {m.replyToText && !m.isRemoved && (
                    <div className="mb-2 pl-2 rounded-lg cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
                      style={{ borderLeft: "2px solid var(--neon-green)", background: "rgba(0,255,179,0.06)" }}
                      onClick={() => {
                        const el = document.getElementById(`msg-${m.replyToId}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.animate([{ background: "rgba(0,255,179,0.15)" }, { background: "transparent" }], { duration: 1200, easing: "ease-out" });
                        }
                      }}>
                      {m.replyToSender && (
                        <p className="text-xs font-semibold" style={{ color: "var(--neon-green)" }}>{m.replyToSender}</p>
                      )}
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{m.replyToText}</p>
                    </div>
                  )}
                  <p className={`text-sm ${m.isRemoved ? "italic" : "text-white"}`} style={m.isRemoved ? { color: "rgba(255,255,255,0.4)" } : {}}>{m.text}</p>
                  <p className="text-xs mt-1 text-right flex items-center justify-end gap-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {m.isEdited && !m.isRemoved && <span>изменено</span>}
                    {m.time}
                  </p>
                  {m.reactions && m.reactions.length > 0 && (() => {
                    const grouped = m.reactions.reduce<Record<string, string[]>>((acc, r) => {
                      if (!acc[r.emoji]) acc[r.emoji] = [];
                      acc[r.emoji].push(r.sender);
                      return acc;
                    }, {});
                    return (
                      <div className={`flex flex-wrap gap-1 mt-1 ${m.out ? "justify-end" : "justify-start"}`}>
                        {Object.entries(grouped).map(([emoji, senders]) => {
                          const mine = senders.includes(user.nickname);
                          return (
                            <button key={emoji}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                              style={{ background: mine ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mine ? "rgba(0,255,179,0.4)" : "rgba(255,255,255,0.1)"}` }}
                              onClick={async () => {
                                const updated = await apiToggleReaction(m.id, emoji, user.nickname);
                                setMessages(prev => prev.map(x => x.id === m.id ? { ...x, reactions: updated } : x));
                              }}>
                              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{emoji}</span>
                              {senders.length > 1 && <span style={{ color: mine ? "var(--neon-green)" : "rgba(255,255,255,0.5)" }}>{senders.length}</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
          {/* Контекстное меню */}
          {msgMenu && (() => {
            const menuMsg = messages.find(m => m.id === msgMenu.id);
            return (
              <div className="fixed inset-0 z-50" onClick={() => setMsgMenu(null)}>
                <div className="absolute rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
                  style={{ left: Math.min(msgMenu.x, window.innerWidth - 190), top: msgMenu.y + 200 > window.innerHeight ? Math.max(8, msgMenu.y - 200) : msgMenu.y, background: "rgba(20,20,30,0.97)", border: "1px solid rgba(0,255,179,0.2)", backdropFilter: "blur(16px)", minWidth: 170 }}
                  onClick={e => e.stopPropagation()}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                    onClick={() => {
                      if (menuMsg) setReactionPicker(menuMsg.id);
                      setMsgMenu(null);
                    }}>
                    <span style={{ fontSize: "1rem" }}>😊</span>
                    Реакция
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                    onClick={() => {
                      if (menuMsg) setReplyingTo({ id: menuMsg.id, text: menuMsg.text, sender: menuMsg.sender || "" });
                      setMsgMenu(null);
                    }}>
                    <Icon name="Reply" size={15} style={{ color: "var(--neon-green)" }} />
                    Ответить
                  </button>
                  {menuMsg?.out && (
                    <>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                        onClick={() => {
                          if (menuMsg) { setEditingMsg({ id: menuMsg.id, text: menuMsg.text }); setMsgText(menuMsg.text); }
                          setMsgMenu(null);
                        }}>
                        <Icon name="Pencil" size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                        Редактировать
                      </button>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-all text-left"
                        style={{ color: "#ff4d4d" }}
                        onClick={async () => {
                          const id = msgMenu.id;
                          setMsgMenu(null);
                          await apiRemoveMessage(id, sessionId);
                          setMessages(prev => prev.map(m => m.id === id ? { ...m, text: "Сообщение удалено", isRemoved: true } : m));
                        }}>
                        <Icon name="Trash2" size={15} style={{ color: "#ff4d4d" }} />
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
          {/* Пикер реакций */}
          {reactionPicker !== null && (
            <div className="fixed inset-0 z-50 flex items-end justify-center pb-24" onClick={() => setReactionPicker(null)}>
              <div className="rounded-2xl px-3 py-2 flex gap-1 animate-fade-in"
                style={{ background: "rgba(20,20,30,0.97)", border: "1px solid rgba(0,255,179,0.2)", backdropFilter: "blur(16px)" }}
                onClick={e => e.stopPropagation()}>
                {["❤️","👍","😂","😮","😢","🔥","👏","🏎️"].map(emoji => (
                  <button key={emoji}
                    className="text-2xl p-2 rounded-xl hover:bg-white/10 transition-all active:scale-125"
                    style={{ lineHeight: 1 }}
                    onClick={async () => {
                      const msgId = reactionPicker;
                      setReactionPicker(null);
                      const updated = await apiToggleReaction(msgId, emoji, user.nickname);
                      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: updated } : m));
                    }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) sendVideo(f); e.target.value = ""; }} />
          {replyingTo && !editingMsg && (
            <div className="flex items-center gap-2 px-1 pb-2 animate-fade-in">
              <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: "var(--neon-green)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "var(--neon-green)" }}>{replyingTo.sender || "Сообщение"}</p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{replyingTo.text}</p>
              </div>
              <button onClick={() => setReplyingTo(null)}
                className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)" }}>
                <Icon name="X" size={11} />
              </button>
            </div>
          )}
          {editingMsg && (
            <div className="flex items-center gap-2 px-1 pb-2 animate-fade-in">
              <Icon name="Pencil" size={13} style={{ color: "var(--neon-green)", flexShrink: 0 }} />
              <span className="text-xs flex-1 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>Редактирование</span>
              <button onClick={() => { setEditingMsg(null); setMsgText(""); }}
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}>
                Отмена
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {!editingMsg && (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Icon name="Image" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            )}
            {!editingMsg && (
              <button onClick={() => videoInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Icon name="Video" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            )}
            {!editingMsg && (
              <button onClick={() => setShowEmoji(v => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: showEmoji ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${showEmoji ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}` }}>
                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>😊</span>
              </button>
            )}
            <div className="flex-1 flex items-center rounded-2xl px-3 py-2"
              style={{ background: editingMsg ? "rgba(0,255,179,0.05)" : "rgba(255,255,255,0.05)", border: `1px solid ${editingMsg ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}` }}>
              <input className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600"
                placeholder="Сообщение..." value={editingMsg ? editingMsg.text : msgText}
                onChange={e => editingMsg ? setEditingMsg({ ...editingMsg, text: e.target.value }) : setMsgText(e.target.value)}
                onKeyDown={handleKeyDown} />
            </div>
            {editingMsg ? (
              <button onClick={submitEdit}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: "var(--neon-green)" }}>
                <Icon name="Check" size={16} style={{ color: "var(--bg-dark)" }} />
              </button>
            ) : msgText.trim() ? (
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
