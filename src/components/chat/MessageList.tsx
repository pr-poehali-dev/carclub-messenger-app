import { RefObject } from "react";
import Icon from "@/components/ui/icon";
import { Message, apiToggleReaction } from "@/components/shared/types";

interface Props {
  messages: Message[];
  loading: boolean;
  myNickname: string;
  messagesContainerRef: RefObject<HTMLDivElement>;
  bottomRef: RefObject<HTMLDivElement>;
  msgMenu: { id: number; x: number; y: number } | null;
  reactionPicker: number | null;
  onOpenLightbox?: (url: string) => void;
  onSetMsgMenu: (v: { id: number; x: number; y: number } | null) => void;
  onSetReactionPicker: (id: number | null) => void;
  onSetReplyingTo: (v: { id: number; text: string; sender: string } | null) => void;
  onSetEditingMsg: (v: { id: number; text: string } | null) => void;
  onSetMsgText: (v: string) => void;
  onRemoveMessage: (id: number) => void;
  onUpdateReactions: (msgId: number, reactions: { emoji: string; sender: string }[]) => void;
}

export default function MessageList({
  messages, loading, myNickname,
  messagesContainerRef, bottomRef,
  msgMenu, reactionPicker,
  onOpenLightbox,
  onSetMsgMenu, onSetReactionPicker, onSetReplyingTo,
  onSetEditingMsg, onSetMsgText,
  onRemoveMessage, onUpdateReactions,
}: Props) {
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,255,179,0.4)", borderTopColor: "transparent" }} />
        </div>
      )}
      {messages.map(m => (
        <div key={m.id} id={`msg-${m.id}`} className={`flex ${m.out ? "justify-end" : "justify-start"} animate-fade-in`}
          onContextMenu={!m.isRemoved ? (e) => { e.preventDefault(); onSetMsgMenu({ id: m.id, x: e.clientX, y: e.clientY }); } : undefined}
          onTouchStart={!m.isRemoved ? (() => { let t: ReturnType<typeof setTimeout>; let moved = false; const onMove = () => { moved = true; }; const onEnd = () => { clearTimeout(t); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); }; return (e: React.TouchEvent) => { moved = false; const touch = e.touches[0]; const x = touch.clientX; const y = touch.clientY; document.addEventListener("touchmove", onMove, { passive: true }); document.addEventListener("touchend", onEnd, { once: true }); t = setTimeout(() => { if (!moved) onSetMsgMenu({ id: m.id, x, y }); }, 600); }; })() : undefined}
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
                  onClick={(e) => onSetMsgMenu({ id: m.id, x: e.clientX, y: e.clientY })}>
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
                  onClick={(e) => onSetMsgMenu({ id: m.id, x: e.clientX, y: e.clientY })}>
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
                      const mine = senders.includes(myNickname);
                      return (
                        <button key={emoji}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                          style={{ background: mine ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mine ? "rgba(0,255,179,0.4)" : "rgba(255,255,255,0.1)"}` }}
                          onClick={async () => {
                            const updated = await apiToggleReaction(m.id, emoji, myNickname);
                            onUpdateReactions(m.id, updated);
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
          <div className="fixed inset-0 z-50" onClick={() => onSetMsgMenu(null)}>
            <div className="absolute rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
              style={{ left: Math.min(msgMenu.x, window.innerWidth - 190), top: msgMenu.y + 200 > window.innerHeight ? Math.max(8, msgMenu.y - 200) : msgMenu.y, background: "rgba(20,20,30,0.97)", border: "1px solid rgba(0,255,179,0.2)", backdropFilter: "blur(16px)", minWidth: 170 }}
              onClick={e => e.stopPropagation()}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                onClick={() => {
                  if (menuMsg) onSetReactionPicker(menuMsg.id);
                  onSetMsgMenu(null);
                }}>
                <span style={{ fontSize: "1rem" }}>😊</span>
                Реакция
              </button>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                onClick={() => {
                  if (menuMsg) onSetReplyingTo({ id: menuMsg.id, text: menuMsg.text, sender: menuMsg.sender || "" });
                  onSetMsgMenu(null);
                }}>
                <Icon name="Reply" size={15} style={{ color: "var(--neon-green)" }} />
                Ответить
              </button>
              {menuMsg?.out && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-all text-left"
                    onClick={() => {
                      if (menuMsg) { onSetEditingMsg({ id: menuMsg.id, text: menuMsg.text }); onSetMsgText(menuMsg.text); }
                      onSetMsgMenu(null);
                    }}>
                    <Icon name="Pencil" size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                    Редактировать
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-all text-left"
                    style={{ color: "#ff4d4d" }}
                    onClick={() => {
                      const id = msgMenu.id;
                      onSetMsgMenu(null);
                      onRemoveMessage(id);
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
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-24" onClick={() => onSetReactionPicker(null)}>
          <div className="rounded-2xl px-3 py-2 flex gap-1 animate-fade-in"
            style={{ background: "rgba(20,20,30,0.97)", border: "1px solid rgba(0,255,179,0.2)", backdropFilter: "blur(16px)" }}
            onClick={e => e.stopPropagation()}>
            {["❤️","👍","😂","😮","😢","🔥","👏","🏎️"].map(emoji => (
              <button key={emoji}
                className="text-2xl p-2 rounded-xl hover:bg-white/10 transition-all active:scale-125"
                style={{ lineHeight: 1 }}
                onClick={async () => {
                  const msgId = reactionPicker;
                  onSetReactionPicker(null);
                  const updated = await apiToggleReaction(msgId, emoji, myNickname);
                  onUpdateReactions(msgId, updated);
                }}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
