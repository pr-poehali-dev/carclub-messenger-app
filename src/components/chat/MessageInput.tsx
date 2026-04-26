import { RefObject } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  msgText: string;
  sending: boolean;
  showEmoji: boolean;
  isRecording: boolean;
  recordingTime: number;
  editingMsg: { id: number; text: string } | null;
  replyingTo: { id: number; text: string; sender: string } | null;
  fileInputRef: RefObject<HTMLInputElement>;
  videoInputRef: RefObject<HTMLInputElement>;
  onSetMsgText: (v: string) => void;
  onSetShowEmoji: (fn: (prev: boolean) => boolean) => void;
  onSetEditingMsg: (v: { id: number; text: string } | null) => void;
  onSetReplyingTo: (v: null) => void;
  onSendMessage: () => void;
  onSendEmoji: (emoji: string) => void;
  onSendImage: (file: File) => void;
  onSendVideo: (file: File) => void;
  onSubmitEdit: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

export default function MessageInput({
  msgText, sending, showEmoji, isRecording, recordingTime,
  editingMsg, replyingTo,
  fileInputRef, videoInputRef,
  onSetMsgText, onSetShowEmoji, onSetEditingMsg, onSetReplyingTo,
  onSendMessage, onSendEmoji, onSendImage, onSendVideo,
  onSubmitEdit, onStartRecording, onStopRecording, onCancelRecording,
}: Props) {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMsg) onSubmitEdit(); else onSendMessage();
    }
    if (e.key === "Escape" && editingMsg) { onSetEditingMsg(null); onSetMsgText(""); }
  };

  return (
    <>
      {/* Эмодзи-пикер */}
      {showEmoji && (
        <div className="px-3 pb-2 animate-fade-in">
          <div className="rounded-2xl p-3 grid grid-cols-8 gap-1"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,179,0.15)", backdropFilter: "blur(10px)" }}>
            {["😀","😂","🥹","😍","🤩","😎","🥳","😅","😭","😡","🤔","👍","👎","❤️","🔥","💯",
              "🏎️","⚡","🏁","🔧","🎯","💪","🙌","👏","🤝","✨","🎉","🚀"].map(e => (
              <button key={e} onClick={() => onSendEmoji(e)}
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
          <button onClick={onStopRecording}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold"
            style={{ background: "#ff4d4d", color: "#fff", fontFamily: '"Exo 2", sans-serif' }}>
            Отправить
          </button>
          <button onClick={onCancelRecording}
            className="px-3 py-1.5 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            ✕
          </button>
        </div>
      )}

      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(0,255,179,0.12)" }}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSendImage(f); e.target.value = ""; }} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSendVideo(f); e.target.value = ""; }} />

        {replyingTo && !editingMsg && (
          <div className="flex items-center gap-2 px-1 pb-2 animate-fade-in">
            <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: "var(--neon-green)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--neon-green)" }}>{replyingTo.sender || "Сообщение"}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{replyingTo.text}</p>
            </div>
            <button onClick={() => onSetReplyingTo(null)}
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
            <button onClick={() => { onSetEditingMsg(null); onSetMsgText(""); }}
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
            <button onClick={() => onSetShowEmoji(v => !v)}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: showEmoji ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${showEmoji ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}` }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>😊</span>
            </button>
          )}
          <div className="flex-1 flex items-center rounded-2xl px-3 py-2"
            style={{ background: editingMsg ? "rgba(0,255,179,0.05)" : "rgba(255,255,255,0.05)", border: `1px solid ${editingMsg ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}` }}>
            <input className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600"
              placeholder="Сообщение..." value={editingMsg ? editingMsg.text : msgText}
              onChange={e => editingMsg ? onSetEditingMsg({ ...editingMsg, text: e.target.value }) : onSetMsgText(e.target.value)}
              onKeyDown={handleKeyDown} />
          </div>
          {editingMsg ? (
            <button onClick={onSubmitEdit}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: "var(--neon-green)" }}>
              <Icon name="Check" size={16} style={{ color: "var(--bg-dark)" }} />
            </button>
          ) : msgText.trim() ? (
            <button onClick={onSendMessage} disabled={sending}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: "var(--neon-green)", opacity: sending ? 0.6 : 1 }}>
              <Icon name="Send" size={16} style={{ color: "var(--bg-dark)" }} />
            </button>
          ) : (
            <button onMouseDown={onStartRecording} onTouchStart={onStartRecording} disabled={isRecording}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: isRecording ? "rgba(255,77,77,0.2)" : "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.3)" }}>
              <Icon name="Mic" size={16} style={{ color: isRecording ? "#ff4d4d" : "var(--neon-green)" }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
