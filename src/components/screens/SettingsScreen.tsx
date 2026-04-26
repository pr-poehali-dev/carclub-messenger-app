import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { NeonBadge } from "@/components/screens/ChatsScreen";
import {
  User,
  AUTH_API, ADMIN_API, UPLOAD_AVATAR_API,
  clearSession,
} from "@/components/shared/types";

export default function SettingsScreen({ user, sessionId, onAvatarChange, onProfileUpdate }: {
  user: User; sessionId: string;
  onAvatarChange: (url: string) => void;
  onProfileUpdate: (updated: User) => void;
}) {
  const [notif, setNotif] = useState(true);
  const [online, setOnline] = useState(true);
  const [sound, setSound] = useState(() => localStorage.getItem("msg_sound") !== "off");
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
      if (res.ok && data.avatar_url) onAvatarChange(data.avatar_url + "?t=" + Date.now());
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
    { icon: "Volume2", label: "Звуки сообщений", toggle: true, val: sound, onToggle: () => setSound(v => { const next = !v; localStorage.setItem("msg_sound", next ? "on" : "off"); return next; }) },
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
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: uploading ? "rgba(0,255,179,0.3)" : "var(--neon-green)", border: "2px solid var(--bg-dark)" }}>
              {uploading
                ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />
                : <Icon name="Camera" size={12} style={{ color: "#000" }} />}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base truncate flex items-center gap-2" style={{ fontFamily: '"Exo 2", sans-serif' }}>
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
            <button onClick={saveRules} disabled={rulesSaving}
              className="text-sm px-3 py-1.5 rounded-xl font-semibold"
              style={{ fontFamily: '"Exo 2", sans-serif', background: "rgba(0,255,179,0.12)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.3)", opacity: rulesSaving ? 0.7 : 1 }}>
              {rulesSaving ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
          <div className="flex-1 p-4">
            {rulesLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
              </div>
            ) : (
              <textarea value={rules} onChange={e => setRules(e.target.value)}
                className="w-full h-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,179,0.15)" }}
                placeholder="Введите правила клуба..." />
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
            <h3 className="font-bold text-lg text-white flex-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Система рейтинга</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {ratingLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
              </div>
            ) : ratingMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.2), rgba(0,212,255,0.15))", border: "1px solid rgba(0,255,179,0.2)" }}>
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.nickname[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: '"Exo 2", sans-serif' }}>{m.nickname}</div>
                  <div className="text-xs" style={{ color: "var(--neon-green)" }}>{m.points.toLocaleString()} очков</div>
                </div>
                {user.isAdmin && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input value={deltaMap[m.id] || ""} onChange={e => setDeltaMap(prev => ({ ...prev, [m.id]: e.target.value }))}
                      className="w-16 rounded-lg px-2 py-1 text-xs text-white outline-none text-center"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder="±0"
                      onKeyDown={e => e.key === "Enter" && applyDelta(m.id)} />
                    <button onClick={() => applyDelta(m.id)} disabled={savingId === m.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,255,179,0.12)", border: "1px solid rgba(0,255,179,0.3)" }}>
                      {savingId === m.id
                        ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                        : <Icon name="Check" size={13} style={{ color: "var(--neon-green)" }} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Панель: Управление клубом ── */}
      {panel === "manage" && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white flex-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Управление клубом</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Создание чата */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                style={{ fontFamily: '"Exo 2", sans-serif', color: "rgba(255,255,255,0.4)" }}>Создать чат</div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-2 mb-3">
                  <input value={newChatEmoji} onChange={e => setNewChatEmoji(e.target.value)}
                    className="w-14 text-center rounded-xl px-2 py-2.5 text-lg outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }} />
                  <input value={newChatName} onChange={e => setNewChatName(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.2)" }}
                    placeholder="Название чата" />
                </div>

                {/* Тумблер "Закрытый чат" */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-white" style={{ fontFamily: '"Exo 2", sans-serif' }}>Закрытый чат</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Доступен только выбранным участникам</div>
                  </div>
                  <button onClick={() => { setNewChatPrivate(v => !v); setSelectedMembers([]); }}
                    className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                    style={{ background: newChatPrivate ? "var(--neon-green)" : "rgba(255,255,255,0.12)" }}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: newChatPrivate ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                  </button>
                </div>

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
                        className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg transition-all"
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

      {/* ── Панель: Код приглашения ── */}
      {panel === "invite" && (
        <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--bg-dark)" }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
            <button onClick={() => setPanel(null)}><Icon name="ChevronLeft" size={22} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
            <h3 className="font-bold text-lg text-white flex-1" style={{ fontFamily: '"Exo 2", sans-serif' }}>Код приглашения</h3>
          </div>
          <div className="p-6">
            {inviteCodeLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
              </div>
            ) : (
              <>
                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Этот код используется при регистрации новых участников клуба.
                </p>
                <input value={inviteCodeVal} onChange={e => setInviteCodeVal(e.target.value.toUpperCase())}
                  className="w-full rounded-xl px-4 py-3 text-lg text-white outline-none tracking-widest font-mono mb-4"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,179,0.25)", letterSpacing: "0.2em" }}
                  placeholder="XXXXXXXX" />
                {inviteCodeSaved && (
                  <div className="mb-3 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(0,255,179,0.1)", color: "var(--neon-green)", border: "1px solid rgba(0,255,179,0.25)" }}>
                    Код сохранён!
                  </div>
                )}
                <button onClick={saveInviteCode} disabled={inviteCodeSaving || inviteCodeVal.trim().length < 4}
                  className="neon-btn-filled w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Exo 2", sans-serif', opacity: inviteCodeSaving ? 0.7 : 1 }}>
                  {inviteCodeSaving
                    ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,255,179,0.3)", borderTopColor: "var(--neon-green)" }} />
                    : <Icon name="Save" size={15} />}
                  Сохранить код
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
