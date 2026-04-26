import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Tab, User, apiGetChats, getSession, saveSession, clearSession } from "@/components/shared/types";
import ChatsScreen from "@/components/screens/ChatsScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import { EventsScreen, GalleryScreen, MembersScreen, SearchScreen, LoginScreen } from "@/components/screens/Screens";

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [session, setSession] = useState<{ user: User; session_id: string } | null>(() => getSession());
  const [unreadCount, setUnreadCount] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Фоновый polling непрочитанных — работает на всех вкладках
  useEffect(() => {
    if (!session) return;
    const fetch_unread = () => {
      apiGetChats(session.session_id).then(data => {
        if (Array.isArray(data)) setUnreadCount(data.reduce((s, c) => s + (c.unread || 0), 0));
      }).catch(() => {});
    };
    fetch_unread();
    const t = setInterval(fetch_unread, 5000);
    return () => clearInterval(t);
  }, [session?.session_id]);

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "events", icon: "Calendar", label: "События" },
    { id: "gallery", icon: "Image", label: "Галерея" },
    { id: "members", icon: "Users", label: "Клуб" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "settings", icon: "Settings", label: "Профиль" },
  ];

  const handleLogin = (user: User, session_id: string) => {
    setSession({ user, session_id });
  };

  const handleAvatarChange = (url: string) => {
    if (!session) return;
    const updated = { ...session, user: { ...session.user, avatarUrl: url } };
    setSession(updated);
    saveSession(updated);
  };

  const handleProfileUpdate = (updated: User) => {
    if (!session) return;
    const newSession = { ...session, user: updated };
    setSession(newSession);
    saveSession(newSession);
  };

  const subscribePush = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const PUSH_API = "https://functions.poehali.dev/8ccad4d2-a7fe-4991-a983-f680cb3012c6";
      const vapidRes = await fetch(`${PUSH_API}?action=vapid_key`);
      const { public_key } = await vapidRes.json();
      if (!public_key) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: public_key,
      });
      await fetch(`${PUSH_API}?action=subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": session?.session_id || "" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch { /* тихо игнорируем */ }
  };

  useEffect(() => {
    if (session) subscribePush();
  }, [!!session]);

  const WRAP = (
    <div className="relative flex items-center justify-center min-h-screen"
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
                <span className="w-2.5 h-2.5 rounded-full animate-pulse-neon"
                  style={{ background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {tab === "chats" && <ChatsScreen user={session.user} sessionId={session.session_id} onUnreadChange={setUnreadCount} onOpenLightbox={setLightboxUrl} />}
              {tab === "events" && <EventsScreen user={session.user} sessionId={session.session_id} />}
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
                    {item.id === "chats" && unreadCount > 0 && tab !== "chats" && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                        style={{ background: "var(--neon-green)", color: "var(--bg-dark)", fontSize: "8px" }}>
                        {unreadCount}
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

      {lightboxUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)", zIndex: 99999 }}
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="фото"
            style={{ maxWidth: "96vw", maxHeight: "92vh", objectFit: "contain", borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
            onClick={() => setLightboxUrl(null)}
          >
            <Icon name="X" size={20} />
          </button>
        </div>
      )}
    </div>
  );

  return WRAP;
}
