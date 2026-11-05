"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pin, Trash2, X, Copy, Check, Clock } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ListenButton from "@/components/ui/ListenButton";
import { categoryMeta } from "@/components/sticky/categories";
import { stickyTone } from "@/components/sticky/tones";

function getExpiryTimeLeft(completedAt) {
  if (!completedAt) return null;
  try {
    const completedDate = new Date(completedAt.includes("T") ? completedAt : `${completedAt.replace(" ", "T")}Z`);
    const now = new Date();
    const diffMs = 48 * 60 * 60 * 1000 - (now.getTime() - completedDate.getTime());
    if (diffMs <= 0) return "Expiring soon";
    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hoursLeft <= 1) return "<1h left";
    return `${hoursLeft}h left`;
  } catch {
    return "48h left";
  }
}

const COLOR_MAP = {
  yellow: { bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  green: { bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  blue: { bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e" },
  pink: { bg: "#fce7f3", border: "#f472b6", text: "#831843" },
  purple: { bg: "#f3e8ff", border: "#c084fc", text: "#581c87" },
  orange: { bg: "#ffedd5", border: "#fdba74", text: "#7c2d12" },
};

export default function StickyDetailModal({ note, onClose, onTogglePin, onToggleComplete, onDelete, canDelete = true }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  const colorConfig = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const tone = stickyTone(note.color);
  const meta = note.category ? categoryMeta[note.category] : null;
  const isResolved = !!note.completedAt;
  const expiryLeft = getExpiryTimeLeft(note.completedAt);

  const handleCopy = () => {
    if (note.content) {
      navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3.5 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[85dvh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl border transition animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: colorConfig.bg,
          borderColor: colorConfig.border,
          boxShadow: `0 20px 40px -15px ${tone.pin}33, 0 8px 16px -6px rgba(0,0,0,0.12)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5 pb-4 border-b border-black/10">
          <div className="flex min-w-0 items-center gap-2 flex-wrap">
            {meta ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider bg-white/80 shadow-2xs"
                style={{ color: tone.pin }}
              >
                <meta.NoteIcon /> {meta.label}
              </span>
            ) : note.category ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider bg-white/80 shadow-2xs"
                style={{ color: colorConfig.text }}
              >
                {note.category}
              </span>
            ) : null}

            {note.pinned && (
              <span
                className="inline-flex items-center gap-1 text-[11.5px] font-bold bg-white/80 px-2.5 py-1 rounded-full shadow-2xs"
                style={{ color: tone.pin }}
              >
                <Pin size={12} fill="currentColor" /> Pinned
              </span>
            )}

            {isResolved && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                title={`This note will automatically be deleted 48 hours after resolution (${expiryLeft})`}
              >
                <Clock size={12} /> Resolved • {expiryLeft}
              </span>
            )}
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-1 sm:gap-1.5 ml-auto">
            <ListenButton
              text={note.content}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/60 hover:bg-white text-ink transition shadow-2xs cursor-pointer"
            />
            {onToggleComplete && (
              <button
                type="button"
                onClick={() => onToggleComplete(note)}
                className={`grid h-8 w-8 place-items-center rounded-xl transition shadow-2xs cursor-pointer ${
                  isResolved
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-white/60 hover:bg-emerald-50 text-ink hover:text-emerald-700"
                }`}
                title={
                  isResolved
                    ? `Resolved! Auto-deletes in ${expiryLeft} (Click to restore)`
                    : "Mark as resolved (auto-deletes in 48h)"
                }
              >
                <Check size={16} strokeWidth={isResolved ? 3 : 2.2} />
              </button>
            )}

            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(note)}
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/60 hover:bg-white text-ink transition shadow-2xs cursor-pointer"
                title={note.pinned ? "Unpin note" : "Pin to top"}
              >
                <Pin size={15} fill={note.pinned ? tone.pin : "none"} color={note.pinned ? tone.pin : "currentColor"} />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/60 hover:bg-white text-ink transition shadow-2xs cursor-pointer"
              title={copied ? "Copied!" : "Copy text"}
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            </button>

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(note);
                  onClose();
                }}
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/60 hover:bg-red-50 text-muted hover:text-red-600 transition shadow-2xs cursor-pointer"
                title="Delete note"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/60 hover:bg-white text-ink transition shadow-2xs cursor-pointer font-bold text-[16px]"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Note Content (Scrollable with High Contrast Charcoal Ink) */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 select-text">
          <p
            className={`whitespace-pre-wrap break-words text-[16px] md:text-[17px] leading-[1.65] font-semibold text-slate-900 ${
              isResolved ? "line-through opacity-75 decoration-emerald-700/60" : ""
            }`}
          >
            {note.content}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-black/10 flex items-center justify-between text-[12px] text-black/60">
          <div className="flex items-center gap-2 truncate">
            {note.authorName ? (
              <>
                <Avatar name={note.authorName} id={note.userId} size={22} />
                <span className="font-semibold truncate text-ink/80">{note.authorName}</span>
              </>
            ) : (
              <span className="font-semibold text-ink/80">Sticky note</span>
            )}
          </div>

          {note.createdAt && (
            <div className="flex items-center gap-3 shrink-0">
              {isResolved && (
                <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-300/50 px-2 py-0.5 rounded-full">
                  <Check size={12} strokeWidth={2.5} /> Auto-deletes in {expiryLeft}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {note.createdAt.slice(0, 10)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
