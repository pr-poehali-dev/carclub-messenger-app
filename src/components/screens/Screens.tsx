import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Avatar, NeonBadge } from "@/components/screens/ChatsScreen";
import {
  User, ClubEvent, chats, events,
  ADMIN_API, GALLERY_API, EVENTS_API,
  apiLogin, apiRegister, saveSession,
} from "@/components/shared/types";

// ─── EVENTS SCREEN ─────────────────────────────────────────────────────────────
const EMPTY_EVENT_FORM = { title: "", date: "", location: "", tag: "Событие", tagColor: "#00ffb3", emoji: "📅", description: "" };

export function EventsScreen({ user, sessionId }: { user: User; sessionId: string }) {
  const [evList, setEvList] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"none" | "create" | "edit">("none");
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [joining, setJoining] = useState<number | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState<number | null>(null);
  const [participantsMap, setParticipantsMap] = useState<Record<number, { id: number; nickname: string; avatarUrl?: string; car: string; role: string }[]>>({});
  const [participantsLoading, setParticipantsLoading] = useState<number | null>(null);

  const canAdmin = user.isAdmin || user.isFounder;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch(EVENTS_API);
    const data = await res.json();
    setEvList(data.events || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const openCreate = () => {
    setForm(EMPTY_EVENT_FORM);
    setEditingId(null);
    setMode("create");
  };

  const openEdit = (ev: ClubEvent) => {
    setForm({ title: ev.title, date: ev.date, location: ev.location, tag: ev.tag, tagColor: ev.tagColor, emoji: ev.emoji, description: ev.description || "" });
    setEditingId(ev.id);
    setMode("edit");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date.trim() || !form.location.trim()) return;
    setSaving(true);
    if (mode === "create") {
      await fetch(EVENTS_API, { method: "POST", headers: { "Content-Type": "application/json", "X-Session-Id": sessionId }, body: JSON.stringify(form) });
    } else if (mode === "edit" && editingId) {
      await fetch(`${EVENTS_API}?id=${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Session-Id": sessionId }, body: JSON.stringify(form) });
    }
    setSaving(false);
    setMode("none");
    loadEvents();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${EVENTS_API}?id=${id}`, { method: "DELETE", headers: { "X-Session-Id": sessionId } });
    setDeleteId(null);
    loadEvents();
  };

  const handleJoin = async (ev: ClubEvent) => {
    if (joining) return;
    setJoining(ev.id);
    const res = await fetch(`${EVENTS_API}?id=${ev.id}`, { method: "PATCH", headers: { "X-Session-Id": sessionId } });
    const data = await res.json();
    if (data.ok) {
      setEvList(prev => prev.map(e => e.id === ev.id ? { ...e, joined: data.joined, members: data.members } : e));
    }
    setJoining(null);
    if (participantsOpen === ev.id) {
      loadParticipants(ev.id);
    }
  };

  const loadParticipants = async (eventId: number) => {
    setParticipantsLoading(eventId);
    const res = await fetch(`${EVENTS_API}?action=participants&id=${eventId}`);
    const data = await res.json();
    setParticipantsMap(prev => ({ ...prev, [eventId]: data.participants || [] }));
    setParticipantsLoading(null);
  };

  const toggleParticipants = (eventId: number) => {
    if (participantsOpen === eventId) {
      setParticipantsOpen(null);
    } else {
      setParticipantsOpen(eventId);
      if (!participantsMap[eventId]) loadParticipants(eventId);
    }
  };

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" };
  const ff = { fontFamily: '"Exo 2", sans-serif' };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="font-bold text-xl text-white" style={ff}>События</h2>
        {canAdmin && mode === "none" && (
          <button onClick={openCreate} className="neon-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={ff}>
            <Icon name="Plus" size={14} />
            Создать
          </button>
        )}
      </div>

      {mode !== "none" && (
        <div className="mx-4 mb-3 rounded-xl p-4 animate-fade-in" style={{ background: "rgba(0,255,179,0.06)", border: "1px solid rgba(0,255,179,0.2)" }}>
          <div className="font-semibold text-white text-sm mb-3" style={ff}>{mode === "create" ? "Новое событие" : "Редактировать событие"}</div>
          <input className="w-full mb-2 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600" style={inputStyle}
            placeholder="Название события" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="w-full mb-2 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600" style={inputStyle}
            placeholder="Дата и время (напр. 5 мая, 18:00)" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input className="w-full mb-2 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600" style={inputStyle}
            placeholder="Место проведения" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <div className="flex gap-2 mb-2">
            <input className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600" style={inputStyle}
              placeholder="Тег (Гонки, Встреча…)" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
            <input className="w-20 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600" style={inputStyle}
              placeholder="Цвет" value={form.tagColor} onChange={e => setForm(f => ({ ...f, tagColor: e.target.value }))} />
            <input className="w-14 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600 text-center" style={inputStyle}
              placeholder="📅" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
          </div>
          <textarea className="w-full mb-2 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-gray-600 resize-none" style={inputStyle}
            placeholder="Описание (необязательно)" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2 mt-1">
            <button onClick={handleSave} disabled={saving} className="neon-btn-filled flex-1 rounded-lg py-2 text-xs font-semibold" style={ff}>
              {saving ? "Сохраняю…" : mode === "create" ? "Опубликовать" : "Сохранить"}
            </button>
            <button onClick={() => setMode("none")} className="flex-1 rounded-lg py-2 text-xs"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Отмена</button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="mx-4 mb-3 rounded-xl p-4 animate-fade-in" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.3)" }}>
          <div className="text-white text-sm mb-3" style={ff}>Удалить это событие?</div>
          <div className="flex gap-2">
            <button onClick={() => handleDelete(deleteId)} className="flex-1 rounded-lg py-2 text-xs font-semibold text-white"
              style={{ background: "#ff6b0099", border: "1px solid #ff6b00" }}>Удалить</button>
            <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg py-2 text-xs"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Отмена</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {loading && (
          <div className="flex items-center justify-center h-32" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Icon name="Loader" size={20} className="animate-spin mr-2" />
            <span className="text-sm">Загрузка…</span>
          </div>
        )}
        {!loading && evList.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Icon name="Calendar" size={32} />
            <span className="text-sm">Событий пока нет</span>
          </div>
        )}
        {evList.map((ev, i) => (
          <div key={ev.id} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${ev.tagColor}18`, border: `1px solid ${ev.tagColor}35` }}>
                {ev.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-sm" style={ff}>{ev.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <NeonBadge label={ev.tag} color={ev.tagColor} />
                    {canAdmin && (
                      <>
                        <button onClick={() => { setDeleteId(null); openEdit(ev); }} className="rounded-md p-1 transition-all"
                          style={{ color: "rgba(255,255,255,0.4)" }}>
                          <Icon name="Pencil" size={13} />
                        </button>
                        <button onClick={() => { setMode("none"); setDeleteId(ev.id); }} className="rounded-md p-1 transition-all"
                          style={{ color: "rgba(255,107,0,0.6)" }}>
                          <Icon name="Trash2" size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Icon name="Calendar" size={12} />
                  <span>{ev.date}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Icon name="MapPin" size={12} />
                  <span>{ev.location}</span>
                </div>
                {ev.description && (
                  <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{ev.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => toggleParticipants(ev.id)}
                    className="flex items-center gap-1 text-xs transition-all"
                    style={{ color: participantsOpen === ev.id ? ev.tagColor : "rgba(255,255,255,0.4)" }}>
                    <Icon name="Users" size={12} />
                    <span>{ev.members} участников</span>
                    <Icon name={participantsOpen === ev.id ? "ChevronUp" : "ChevronDown"} size={11} />
                  </button>
                  <button
                    onClick={() => handleJoin(ev)}
                    disabled={joining === ev.id}
                    className="text-xs px-3 py-1 rounded-lg font-semibold transition-all"
                    style={ev.joined
                      ? { ...ff, background: `${ev.tagColor}35`, color: ev.tagColor, border: `1px solid ${ev.tagColor}90` }
                      : { ...ff, background: `${ev.tagColor}18`, color: ev.tagColor, border: `1px solid ${ev.tagColor}35` }
                    }>
                    {joining === ev.id ? "…" : ev.joined ? "✓ Участвую" : "Участвовать"}
                  </button>
                </div>
                {participantsOpen === ev.id && (
                  <div className="mt-2 rounded-lg overflow-hidden animate-fade-in" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {participantsLoading === ev.id ? (
                      <div className="flex items-center justify-center py-3 gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <Icon name="Loader" size={14} className="animate-spin" />
                        <span className="text-xs">Загрузка…</span>
                      </div>
                    ) : (participantsMap[ev.id] || []).length === 0 ? (
                      <div className="py-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Пока никто не записался</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {(participantsMap[ev.id] || []).map(p => (
                          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                              {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : p.nickname[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate" style={ff}>{p.nickname}</div>
                              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{p.car || p.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GALLERY SCREEN ────────────────────────────────────────────────────────────
interface GFolder { id: number; name: string; coverUrl?: string; itemCount: number; }
interface GItem { id: number; url: string; thumbnailUrl?: string; title: string; type: "photo" | "video"; likes: number; }

export function GalleryScreen({ user, sessionId }: { user: User; sessionId: string }) {
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

// ─── MEMBERS SCREEN ────────────────────────────────────────────────────────────
export function MembersScreen() {
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

// ─── SEARCH SCREEN ─────────────────────────────────────────────────────────────
export function SearchScreen() {
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

// ─── LOGIN SCREEN ──────────────────────────────────────────────────────────────
export function LoginScreen({ onLogin }: { onLogin: (user: User, sid: string) => void }) {
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
