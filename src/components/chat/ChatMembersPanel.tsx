import Icon from "@/components/ui/icon";
import { User, Chat, ADMIN_API } from "@/components/shared/types";

interface Props {
  activeChat: Chat;
  user: User;
  sessionId: string;
  chatMembers: User[];
  allMembers: User[];
  chatMembersLoading: boolean;
  memberSaving: number | null;
  onClose: () => void;
  onRemoveMember: (chatId: number, userId: number) => void;
  onAddMember: (chatId: number, userId: number) => void;
}

export default function ChatMembersPanel({
  activeChat, user, chatMembers, allMembers,
  chatMembersLoading, memberSaving,
  onClose, onRemoveMember, onAddMember,
}: Props) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "var(--bg-dark)" }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(0,255,179,0.1)" }}>
        <button onClick={onClose}>
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
                    <button onClick={() => onRemoveMember(activeChat.id, m.id)}
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
                        <button onClick={() => onAddMember(activeChat.id, m.id)}
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
  );
}
