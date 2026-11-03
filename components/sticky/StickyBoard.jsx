"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Plus, Pin, Trash2, ArrowRight, Check, Clock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import StickyDetailModal from "@/components/modals/StickyDetailModal";

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

const STICKY_COLORS = [
  { id: "yellow", bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  { id: "green", bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  { id: "blue", bg: "#e0f2fe", border: "#7dd3fc", text: "#0c4a6e" },
  { id: "pink", bg: "#fce7f3", border: "#f472b6", text: "#831843" },
  { id: "purple", bg: "#f3e8ff", border: "#c084fc", text: "#581c87" },
  { id: "orange", bg: "#ffedd5", border: "#fdba74", text: "#7c2d12" },
];

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr.replace(" ", "T")}Z`);
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(d);
  } catch {
    return "";
  }
}

const FOLD_SIZE = 24;

function Note({ note, compact, onPin, onToggleComplete, onDelete, onRead, index = 0, currentUser }) {
  const colorSpec = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];
  const limit = compact ? 100 : 130;
  const isLong = (note.content || "").length > limit;
  const displayContent = isLong ? note.content.slice(0, limit).trim() + "..." : note.content;
  const authorName = note.authorName || currentUser?.name || "Nexa Admin";
  const authorId = note.userId || currentUser?.id;
  const tilt = !compact && index % 4 === 0 ? "-rotate-[0.6deg]" : !compact && index % 4 === 2 ? "rotate-[0.6deg]" : "rotate-0";
  const isResolved = !!note.completedAt;
  const expiryLeft = getExpiryTimeLeft(note.completedAt);

  return (
    <div
      onClick={() => onRead(note)}
      className={`group relative ${compact ? "h-[195px] max-w-[340px] w-full mx-auto" : "h-[215px]"} flex flex-col justify-between p-3.5 pb-2.5 cursor-pointer transition-all duration-200 hover:rotate-0 hover:scale-[1.015] hover:z-10 ${tilt} ${
        isResolved ? "opacity-85 hover:opacity-100" : ""
      }`}
      style={{
        filter: "drop-shadow(0 4px 6px rgba(25, 40, 30, 0.12)) drop-shadow(0 1px 2px rgba(25, 40, 30, 0.08))",
      }}
    >
      {/* Paper Body with Curled Bottom-Right Corner */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${FOLD_SIZE}px), calc(100% - ${FOLD_SIZE}px) 100%, 0 100%)`,
          borderRadius: "14px 14px 0 14px",
          background: `linear-gradient(165deg, ${colorSpec.bg} 0%, ${colorSpec.border}55 100%)`,
          borderTop: "1px solid rgba(255,255,255,0.7)",
        }}
      />

      {/* 3D Curled Flap */}
      <div
        className="pointer-events-none absolute bottom-0 right-0"
        style={{ filter: "drop-shadow(-2px -2px 2px rgba(20, 35, 25, 0.2))" }}
      >
        <div
          style={{
            width: FOLD_SIZE,
            height: FOLD_SIZE,
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            background: `linear-gradient(315deg, rgba(255,255,255,0.7) 0%, ${colorSpec.border} 45%, ${colorSpec.text}33 100%)`,
          }}
        />
      </div>

      {/* Card Top: Category/Status (Left) + Actions (Right) */}
      <div className="relative z-1 flex items-center justify-between mb-1 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.category && (
            <span
              className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-white/80 shadow-2xs"
              style={{ color: colorSpec.text }}
            >
              {note.category}
            </span>
          )}
          {isResolved && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-100/95 text-emerald-800 border border-emerald-300/60 shadow-2xs"
              title={`This note will automatically be deleted 48 hours after being marked resolved (${expiryLeft})`}
            >
              <Clock size={9} /> {expiryLeft}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mark Done / Resolve Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`grid h-5 w-5 place-items-center rounded-md transition ${
              isResolved
                ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                : "text-black/35 hover:text-emerald-700 hover:bg-emerald-500/20"
            }`}
            title={
              isResolved
                ? `Resolved! Auto-deletes in ${expiryLeft} (Click to undo)`
                : "Mark as resolved (auto-deletes in 48 hours)"
            }
          >
            <Check size={11} strokeWidth={isResolved ? 3 : 2.2} />
          </button>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className={`grid h-5 w-5 place-items-center rounded-md transition ${
              note.pinned
                ? "bg-white/95 text-brand-700 shadow-2xs"
                : "text-black/35 hover:text-black hover:bg-white/50"
            }`}
            title={note.pinned ? "Unpin note" : "Pin to top"}
          >
            <Pin size={11} className={note.pinned ? "fill-brand-700 text-brand-700" : ""} />
          </button>

          {/* Delete Note */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="grid h-5 w-5 place-items-center rounded-lg text-black/35 hover:text-red-700 hover:bg-white/50 transition opacity-60 hover:opacity-100"
            title="Delete note"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Content: Uniform Fixed-height line-clamp-3 with High Contrast Charcoal Ink */}
      <div className="relative z-1 flex-1 flex flex-col justify-start overflow-hidden my-0.5">
        <p
          className={`whitespace-pre-wrap break-words text-[13.5px] leading-[1.4] font-semibold line-clamp-3 select-text text-slate-900 tracking-[-0.01em] ${
            isResolved ? "line-through opacity-75 decoration-emerald-700/60" : ""
          }`}
        >
          {displayContent}
        </p>
        {isLong && (
          <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold underline underline-offset-2 text-slate-700 group-hover:text-black transition">
            Read note &rarr;
          </span>
        )}
      </div>

      {/* Footer: Clean Combined Author + Date (Never Truncates, Zero Collision with Curl) */}
      <div className="relative z-1 mt-auto pt-1.5 border-t border-black/10 flex items-center text-[11px] text-slate-700 pr-7">
        <div className="flex items-center gap-1.5 truncate max-w-full">
          <Avatar name={authorName} id={authorId} size={16} />
          <span className="font-semibold text-slate-800 shrink-0 text-[11px]">{authorName}</span>
          <span className="text-slate-400">&bull;</span>
          <span className="shrink-0 text-[10px] font-medium text-slate-600">{formatTime(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/** `compact` = the "Daily Sticky Notes" card (scrollable preview of notes); otherwise the full "All sticky notes" board. */
export default function StickyBoard({ compact = false, className = "", bare = false }) {
  const { sticky, setStickyModalOpen, toggleSticky, toggleStickyComplete, deleteSticky, currentUser } = useApp();
  const router = useRouter();
  const [readingNote, setReadingNote] = useState(null);
  const notes = sticky;

  const content = (
    <div>
      <div className={`flex flex-wrap items-center gap-y-2 ${compact ? "gap-x-2" : "gap-x-3"}`}>
        <StickyNote size={compact ? 20 : 30} strokeWidth={1.8} className="shrink-0 text-brand-800" />
        <h2 className={`whitespace-nowrap font-bold tracking-tight ${compact ? "text-[15px]" : "text-[21px]"}`}>
          {compact ? "Daily Sticky Notes" : "All sticky notes"}
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className={`btn-secondary btn-compact ${compact ? "!px-2.5 !py-1 !text-[12px]" : ""}`}
            onClick={() => setStickyModalOpen(true)}
          >
            <Plus size={14} /> New note
          </button>
          {compact && (
            <button
              type="button"
              onClick={() => router.push("/sticky-notes")}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-ink hover:bg-black/5 transition"
              title="Open full sticky notes"
            >
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      <div
        className={`grid ${
          compact
            ? "mt-3 max-h-[460px] grid-cols-1 sm:grid-cols-2 md:grid-cols-1 overflow-y-auto custom-scrollbar p-1 gap-3.5"
            : "mt-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
        }`}
      >
        {notes.map((note, index) => (
          <Note
            key={note.id}
            note={note}
            compact={compact}
            index={index}
            currentUser={currentUser}
            onPin={() => toggleSticky(note)}
            onToggleComplete={() => toggleStickyComplete(note)}
            onDelete={() => deleteSticky(note)}
            onRead={(n) => setReadingNote(n)}
          />
        ))}
        {!notes.length && (
          <div className="empty-view col-span-full py-6 text-[13px]">
            No sticky notes yet. Add one for a quick reminder.
          </div>
        )}
      </div>

      {readingNote && (
        <StickyDetailModal
          note={readingNote}
          onClose={() => setReadingNote(null)}
          onTogglePin={(note) => {
            toggleSticky(note);
            setReadingNote((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
          }}
          onToggleComplete={(note) => {
            toggleStickyComplete(note);
            const nextCompleted = !note.completedAt;
            const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;
            setReadingNote((prev) => (prev ? { ...prev, completedAt: nextCompletedAt } : null));
          }}
          onDelete={(note) => {
            deleteSticky(note);
            setReadingNote(null);
          }}
          canDelete={true}
        />
      )}
    </div>
  );

  if (bare) return content;
  return (
    <section className={`panel flex flex-col ${compact ? "rounded-2xl p-4 shadow-xs" : "p-5"} ${className}`}>
      {content}
    </section>
  );
}
