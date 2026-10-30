"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Plus, Pin, PinOff, Trash2, Ellipsis, ArrowRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { stickyTone } from "./tones";

const FOLD = 30; // px size of the curled corner
const cut = `polygon(0 0, 100% 0, 100% calc(100% - ${FOLD}px), calc(100% - ${FOLD}px) 100%, 0 100%)`;

function Note({ note, compact, menuOpen, onMenu, onPin, onDelete }) {
  const t = stickyTone(note.color);

  return (
    <div className="relative" style={{ filter: "drop-shadow(0 2px 3px rgba(40, 60, 45, 0.16))", zIndex: menuOpen ? 20 : 0 }}>
      <div
        className="absolute inset-0"
        style={{ clipPath: cut, borderRadius: "8px 8px 0 8px", background: `linear-gradient(160deg, ${t.body[0]} 0%, ${t.body[1]} 100%)` }}
      />
      <div className={`relative min-h-[120px] pb-8 ${compact ? "p-3" : "p-3.5"}`}>
        <div className="flex items-start justify-between">
          <Pin
            size={compact ? 16 : 19}
            fill={note.pinned ? t.pin : "none"}
            color={note.pinned ? t.pin : "rgba(18,28,22,0.4)"}
            strokeWidth={1.8}
            className="rotate-45"
          />
          <div className="relative">
            <button
              className="dots-btn -mr-1 -mt-1"
              aria-label="More actions"
              aria-expanded={menuOpen}
              onClick={(event) => {
                event.stopPropagation();
                onMenu();
              }}
            >
              <Ellipsis size={16} />
            </button>
            {menuOpen && (
              <div className="menu-popover">
                <button onClick={onPin}>
                  {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  {note.pinned ? "Unpin" : "Pin to top"}
                </button>
                <hr />
                <button className="danger" onClick={onDelete}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className={`mt-1.5 whitespace-pre-wrap break-words leading-[1.28] text-ink/90 ${compact ? "max-h-[120px] overflow-y-auto custom-scrollbar text-[13.5px]" : "text-[16px]"}`}>{note.content}</p>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0" style={{ filter: "drop-shadow(-2px -2px 2px rgba(30, 50, 35, 0.22))" }}>
        <div
          style={{
            width: FOLD,
            height: FOLD,
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            background: `linear-gradient(315deg, ${t.flap[0]} 0%, ${t.flap[1]} 45%, ${t.flap[2]} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

/** `compact` = the "Daily Sticky Notes" card (scrollable preview of notes); otherwise the full "All sticky notes" board. */
export default function StickyBoard({ compact = false, className = "", bare = false }) {
  const { sticky, setStickyModalOpen, toggleSticky, deleteSticky } = useApp();
  const router = useRouter();
  const [menuId, setMenuId] = useState(null);
  useCloseOnOutsideClick(menuId !== null, () => setMenuId(null));
  const notes = sticky;

  const content = (
    <div>
      <div className={`flex flex-wrap items-center gap-y-2 ${compact ? "gap-x-2" : "gap-x-3"}`}>
        <StickyNote size={compact ? 20 : 30} strokeWidth={1.8} className="shrink-0 text-brand-800" />
        <h2 className={`whitespace-nowrap font-bold tracking-tight ${compact ? "text-[15px]" : "text-[21px]"}`}>{compact ? "Daily Sticky Notes" : "All sticky notes"}</h2>
        <button className={`btn-secondary btn-compact ml-auto ${compact ? "!px-2 !py-1 !text-[12px]" : ""}`} onClick={() => setStickyModalOpen(true)}>
          <Plus size={14} /> New note
        </button>
        {compact && (
          <div className="relative">
            <button
              className="dots-btn"
              aria-label="More actions"
              aria-expanded={menuId === "header"}
              onClick={(event) => {
                event.stopPropagation();
                setMenuId(menuId === "header" ? null : "header");
              }}
            >
              <Ellipsis size={16} />
            </button>
            {menuId === "header" && (
              <div className="menu-popover right-0 left-auto">
                <button onClick={() => setStickyModalOpen(true)}>
                  <Plus size={15} /> New note
                </button>
                <hr />
                <button onClick={() => router.push("/sticky-notes")}>
                  <ArrowRight size={15} /> Open full notes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`grid gap-2.5 ${compact ? "mt-3 max-h-[380px] grid-cols-1 overflow-y-auto custom-scrollbar p-1" : "mt-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
        {notes.map((note) => (
          <Note
            key={note.id}
            note={note}
            compact={compact}
            menuOpen={menuId === note.id}
            onMenu={() => setMenuId(menuId === note.id ? null : note.id)}
            onPin={() => toggleSticky(note)}
            onDelete={() => deleteSticky(note)}
          />
        ))}
        {!notes.length && <div className="empty-view col-span-full py-6 text-[13px]">No sticky notes yet. Add one for a quick reminder.</div>}
      </div>
    </div>
  );

  if (bare) return content;
  return <section className={`panel flex flex-col ${compact ? "rounded-xl p-3.5" : "p-5"} ${className}`}>{content}</section>;
}
