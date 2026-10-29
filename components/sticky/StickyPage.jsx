"use client";

import { useState } from "react";
import { StickyNote, Pin, PinOff, Trash2, Plus, Search, LayoutGrid, List, Ellipsis, Clock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { daysBetween, longDate } from "@/lib/datetime";
import { STICKY_CATEGORIES } from "@/lib/constants";
import { stickyTone } from "./tones";
import { categoryMeta } from "./categories";

const FOLD = 40; // px size of the curled corner
const cut = `polygon(0 0, 100% 0, 100% calc(100% - ${FOLD}px), calc(100% - ${FOLD}px) 100%, 0 100%)`;

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** "Today, 6:15 PM" — empty until mounted so server and browser time zones can't disagree. */
function noteTime(createdAt, now) {
  if (!now) return "";
  const created = new Date(`${createdAt.replace(" ", "T")}Z`);
  const days = daysBetween(created, now);
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : dayFormat.format(created);
  return `${day}, ${timeFormat.format(created)}`;
}

function Note({ note, now, list, menuOpen, onMenu, onPin, onDelete }) {
  const t = stickyTone(note.color);
  const meta = note.category ? categoryMeta[note.category] : null;

  return (
    <div className="relative" style={{ filter: "drop-shadow(0 3px 5px rgba(40, 60, 45, 0.18))", zIndex: menuOpen ? 20 : 0 }}>
      <div
        className="absolute inset-0"
        style={{ clipPath: cut, borderRadius: "14px 14px 0 14px", background: `linear-gradient(160deg, ${t.body[0]} 0%, ${t.body[1]} 100%)` }}
      />
      <div className={`relative flex flex-col p-5 ${list ? "min-h-[150px]" : "min-h-[262px]"}`}>
        <div className="flex items-start justify-between">
          <Pin
            size={26}
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
              <Ellipsis size={20} />
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

        <p className="mt-4 whitespace-pre-wrap break-words text-[20px] font-medium leading-[1.25] text-ink/90">{note.content}</p>

        <div className="mt-auto pt-5">
          {meta && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14.5px] font-semibold"
              style={{ background: `${t.flap[1]}b3`, color: t.pin }}
            >
              <meta.NoteIcon /> {meta.label}
            </span>
          )}
          <p className="mt-3 flex min-h-[20px] items-center gap-2 text-[14px] text-ink/65">
            <Clock size={17} /> {noteTime(note.createdAt, now)}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0" style={{ filter: "drop-shadow(-3px -3px 3px rgba(30, 50, 35, 0.22))" }}>
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

function Illustration() {
  return (
    <svg viewBox="0 0 96 70" className="h-[62px] w-[84px]" aria-hidden="true">
      <rect x="24" y="14" width="40" height="46" rx="7" fill="#cbbcf6" transform="rotate(-9 44 37)" />
      <rect x="32" y="10" width="40" height="46" rx="7" fill="#e2effd" stroke="#7aa7ee" strokeWidth="2" />
      <path d="M40 24h24M40 32h24M40 40h15" stroke="#7aa7ee" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12 22v9M7.5 26.5h9" stroke="#f0707e" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M86 34v9M81.5 38.5h9" stroke="#f5b041" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function StickyPage() {
  const { sticky, now, todayDate, setStickyModalOpen, toggleSticky, deleteSticky } = useApp();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [menuId, setMenuId] = useState(null);
  useCloseOnOutsideClick(menuId !== null, () => setMenuId(null));

  const count = (id) => sticky.filter((note) => note.category === id).length;
  const needle = search.trim().toLowerCase();
  const visible = sticky.filter(
    (note) => (filter === "all" || note.category === filter) && (!needle || note.content.toLowerCase().includes(needle)),
  );

  const chipBase = "inline-flex h-[46px] items-center gap-2.5 rounded-xl px-4 text-[15px] font-semibold transition";
  const toggleBtn = "grid h-[46px] w-[50px] place-items-center transition";

  return (
    <div>
      <header className="border-b border-line bg-white/50 px-5 pb-5 pt-7 md:px-[34px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">{longDate(todayDate, true)}</p>
        <h1 className="mt-2 text-[40px] font-extrabold leading-none tracking-tight md:text-[46px]">
          Sticky <span className="text-brand-600">Notes</span>
        </h1>
        <p className="mt-3 text-[16px] text-muted">Quick reminders and blockers for the team.</p>
      </header>

      <div className="space-y-6 px-5 py-5 md:px-[34px]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`${chipBase} ${filter === "all" ? "bg-brand-700 text-white shadow-md" : "bg-[#e9f5ec] text-brand-800 hover:bg-[#dcf0e1]"}`}
          >
            <StickyNote size={18} /> All Notes ({sticky.length})
          </button>
          {STICKY_CATEGORIES.map((id) => {
            const { label, chip, Icon } = categoryMeta[id];
            return (
              <button
                key={id}
                onClick={() => setFilter(filter === id ? "all" : id)}
                className={`${chipBase} ${chip} ${filter === id ? "ring-2 ring-current/50" : "hover:brightness-95"}`}
              >
                <Icon /> {label} ({count(id)})
              </button>
            );
          })}

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <label className="flex h-[46px] w-[310px] max-w-full items-center gap-2.5 rounded-xl border border-line bg-white px-4 shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
              <Search size={19} className="shrink-0 text-ink/70" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
              />
            </label>
            <div className="flex overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
              <button className={`${toggleBtn} ${view === "grid" ? "bg-[#eef3ef] text-ink" : "text-ink/60 hover:bg-[#f6faf7]"}`} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}>
                <LayoutGrid size={20} fill={view === "grid" ? "currentColor" : "none"} />
              </button>
              <button className={`${toggleBtn} ${view === "list" ? "bg-[#eef3ef] text-ink" : "text-ink/60 hover:bg-[#f6faf7]"}`} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}>
                <List size={20} />
              </button>
            </div>
            <button className="btn-primary h-[46px] px-5 text-[15px]" onClick={() => setStickyModalOpen(true)}>
              <Plus size={18} /> New note
            </button>
          </div>
        </div>

        <div className={`grid gap-5 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"}`}>
          {visible.map((note) => (
            <Note
              key={note.id}
              note={note}
              now={now}
              list={view === "list"}
              menuOpen={menuId === note.id}
              onMenu={() => setMenuId(menuId === note.id ? null : note.id)}
              onPin={() => toggleSticky(note)}
              onDelete={() => deleteSticky(note)}
            />
          ))}
          {!visible.length && <div className="empty-view col-span-full">{sticky.length ? "No notes match your search." : "No sticky notes yet. Add one for a quick reminder."}</div>}
        </div>

        <section className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line bg-white/50 px-6 py-8 text-center">
          <Illustration />
          <h2 className="mt-3 text-[21px] font-bold tracking-tight">Keep your important notes in one place</h2>
          <p className="mt-1 text-[15px] text-muted">Add quick notes, reminders, or blockers to stay aligned with your team.</p>
          <button className="btn-primary mt-5 h-[48px] px-6 text-[15px]" onClick={() => setStickyModalOpen(true)}>
            <Plus size={18} /> New note
          </button>
        </section>
      </div>
    </div>
  );
}
