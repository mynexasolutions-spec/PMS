"use client";

import { useState, useRef } from "react";
import { StickyNote, Pin, PinOff, Trash2, Plus, Search, LayoutGrid, List, Ellipsis, Clock, Calendar, X, Check } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { daysBetween, longDate } from "@/lib/datetime";
import { STICKY_CATEGORIES } from "@/lib/constants";
import { stickyTone } from "./tones";
import { categoryMeta } from "./categories";
import StickyDetailModal from "@/components/modals/StickyDetailModal";
import Avatar from "@/components/ui/Avatar";

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

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
  } catch {
    return dateStr;
  }
}

function isSameCalendarDay(noteDateStr, targetYMD) {
  if (!noteDateStr || !targetYMD) return false;
  if (noteDateStr.startsWith(targetYMD)) return true;
  try {
    const iso = noteDateStr.includes("T") ? noteDateStr : `${noteDateStr.replace(" ", "T")}Z`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      const ly = d.getFullYear();
      const lm = String(d.getMonth() + 1).padStart(2, "0");
      const ld = String(d.getDate()).padStart(2, "0");
      if (`${ly}-${lm}-${ld}` === targetYMD) return true;

      const uy = d.getUTCFullYear();
      const um = String(d.getUTCMonth() + 1).padStart(2, "0");
      const ud = String(d.getUTCDate()).padStart(2, "0");
      if (`${uy}-${um}-${ud}` === targetYMD) return true;
    }
  } catch {}
  return false;
}


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

const PREVIEW_LIMIT = 130;
const FOLD_SIZE = 28;

function Note({ note, now, list, onPin, onToggleComplete, onDelete, onRead, index = 0, currentUser }) {
  const isResolved = !!note.completedAt;
  const expiryLeft = getExpiryTimeLeft(note.completedAt);
  const colorSpec = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];
  const isLong = (note.content || "").length > PREVIEW_LIMIT;
  const displayContent = isLong ? note.content.slice(0, PREVIEW_LIMIT).trim() + "..." : note.content;
  const tilt = !list && index % 4 === 0 ? "-rotate-[0.6deg]" : !list && index % 4 === 2 ? "rotate-[0.6deg]" : "rotate-0";
  const authorName = note.authorName || currentUser?.name || "Nexa Admin";
  const authorId = note.userId || currentUser?.id;

  return (
    <div
      onClick={() => onRead(note)}
      className={`group relative min-w-0 ${list ? "min-h-[140px]" : "h-[205px] sm:h-[215px]"} flex flex-col justify-between p-4 pb-3 cursor-pointer transition-all duration-200 hover:rotate-0 hover:scale-[1.02] hover:z-10 ${tilt} ${isResolved ? "opacity-85 hover:opacity-100" : ""}`}
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

      {/* Card Top: Category (Left) + Actions (Right) */}
      <div className="relative z-1 flex items-center justify-between mb-1.5 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.category && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/80 shadow-2xs"
              style={{ color: colorSpec.text }}
            >
              {note.category}
            </span>
          )}
          {isResolved && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold bg-emerald-100/95 text-emerald-800 border border-emerald-300/60 shadow-2xs"
              title={`This note will automatically be deleted 48 hours after being marked resolved (${expiryLeft})`}
            >
              <Clock size={10} /> {expiryLeft}
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
            className={`grid h-6 w-6 place-items-center rounded-lg transition ${
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
            <Check size={12} strokeWidth={isResolved ? 3 : 2.2} />
          </button>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className={`grid h-6 w-6 place-items-center rounded-lg transition ${
              note.pinned
                ? "bg-white/95 text-brand-700 shadow-2xs"
                : "text-black/35 hover:text-black hover:bg-white/50"
            }`}
            title={note.pinned ? "Unpin note" : "Pin to top"}
          >
            <Pin size={13} className={note.pinned ? "fill-brand-700 text-brand-700" : ""} />
          </button>

          {/* Delete Note */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="grid h-6 w-6 place-items-center rounded-lg text-black/35 hover:text-red-700 hover:bg-white/50 transition opacity-60 hover:opacity-100"
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Content: Uniform Fixed-height line-clamp-4 with High Contrast Charcoal Ink */}
      <div className="relative z-1 flex-1 flex flex-col justify-start overflow-hidden my-1">
        <p
          className={`whitespace-pre-wrap break-words text-[14.5px] leading-[1.45] font-semibold line-clamp-4 select-text text-slate-900 tracking-[-0.01em] ${
            isResolved ? "line-through opacity-75 decoration-emerald-700/60" : ""
          }`}
        >
          {displayContent}
        </p>
        {isLong && (
          <span className="mt-auto inline-flex items-center gap-1 text-[11.5px] font-bold underline underline-offset-2 text-slate-700 group-hover:text-black transition">
            Read note &rarr;
          </span>
        )}
      </div>

      {/* Footer: Clean Combined Author + Date (Never Truncates, Zero Collision with Curl) */}
      <div className="relative z-1 mt-auto pt-2 border-t border-black/10 flex items-center text-[11.5px] text-slate-700 pr-7">
        <div className="flex items-center gap-1.5 truncate max-w-full">
          <Avatar name={authorName} id={authorId} size={18} />
          <span className="font-semibold text-slate-800 shrink-0">{authorName}</span>
          <span className="text-slate-400">&bull;</span>
          <span className="shrink-0 text-[10.5px] font-medium text-slate-600">{formatTime(note.createdAt)}</span>
        </div>
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
  const { sticky, now, todayDate, setStickyModalOpen, toggleSticky, toggleStickyComplete, deleteSticky, currentUser } = useApp();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const dateInputRef = useRef(null);
  const [view, setView] = useState("grid");
  const [menuId, setMenuId] = useState(null);
  const [readingNote, setReadingNote] = useState(null);
  useCloseOnOutsideClick(menuId !== null, () => setMenuId(null));

  const count = (id) => sticky.filter((note) => note.category === id).length;
  const needle = search.trim().toLowerCase();
  const visible = sticky.filter((note) => {
    // Category filter
    if (filter !== "all" && note.category !== filter) return false;

    // Search query (content or author)
    if (needle) {
      const contentMatch = (note.content || "").toLowerCase().includes(needle);
      const authorMatch = (note.authorName || "").toLowerCase().includes(needle);
      if (!contentMatch && !authorMatch) return false;
    }

    // Date filter (exact custom date OR presets)
    if (customDate) {
      if (!isSameCalendarDay(note.createdAt, customDate)) return false;
    } else if (dateFilter !== "all" && note.createdAt) {
      try {
        const created = new Date(`${note.createdAt.replace(" ", "T")}Z`);
        const now = new Date();
        const diffDays = Math.round(
          (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime()) /
            86_400_000
        );
        if (dateFilter === "today" && diffDays !== 0) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      } catch {}
    }

    return true;
  });

  const chipBase = "inline-flex h-[46px] items-center gap-2.5 rounded-xl px-4 text-[15px] font-semibold transition";
  const toggleBtn = "grid h-[46px] w-[50px] place-items-center transition";

  return (
    <div>
      <header className="border-b border-line bg-white/50 px-3.5 pb-3.5 pt-3.5 sm:px-5 sm:pb-5 sm:pt-7 md:px-[34px]">
        <p className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink/70">
          {longDate(todayDate, true)}
        </p>
        <div className="mt-1 sm:mt-2 flex items-center justify-between gap-2.5">
          <h1 className="text-[26px] sm:text-[40px] font-extrabold leading-tight sm:leading-none tracking-tight md:text-[46px]">
            My Sticky <span className="text-brand-600">Notes</span>
          </h1>
          <button
            type="button"
            className="md:hidden btn-primary !h-9 !px-3.5 !text-[12.5px] font-semibold shrink-0 whitespace-nowrap shadow-xs"
            onClick={() => setStickyModalOpen(true)}
          >
            <Plus size={15} /> New note
          </button>
        </div>
        <p className="mt-1 sm:mt-3 text-[12.5px] sm:text-[16px] text-muted">
          Your personal quick reminders, thoughts, and scratchpad.
        </p>
      </header>

      <div className="space-y-4 sm:space-y-6 px-3.5 py-4 sm:px-5 sm:py-5 md:px-[34px]">
        {/* Mobile Compact 2-Row Filter Bar (<md) */}
        <div className="md:hidden space-y-2 rounded-2xl border border-line bg-white p-2.5 shadow-xs">
          {/* Row 1: Search + Grid/List View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-[38px] flex-1 min-w-0 items-center gap-2 rounded-xl border border-line bg-[#fbfdfb] px-3 focus-within:border-brand-500">
              <Search size={15} className="shrink-0 text-ink/60 pointer-events-none" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-muted hover:text-ink text-[15px] -mr-1"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex h-[38px] shrink-0 overflow-hidden rounded-xl border border-line bg-white">
              <button
                className={`grid h-full w-9 place-items-center transition ${
                  view === "grid" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"
                }`}
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`grid h-full w-9 place-items-center transition ${
                  view === "list" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"
                }`}
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Row 2: Category Dropdown + Date Filter Dropdown + Pick Date */}
          <div className="flex items-center gap-1.5">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter by category"
              className="h-[38px] flex-1 min-w-0 rounded-xl border border-line bg-white px-2 text-[12px] font-semibold text-ink outline-none focus:border-brand-500"
            >
              <option value="all">All Categories ({sticky.length})</option>
              {STICKY_CATEGORIES.map((id) => (
                <option key={id} value={id}>
                  {categoryMeta[id].label} ({count(id)})
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "all") setCustomDate("");
              }}
              aria-label="Filter by date range"
              className="h-[38px] shrink-0 rounded-xl border border-line bg-white px-2 text-[12px] font-semibold text-ink outline-none focus:border-brand-500"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7d</option>
              <option value="month">Past 30d</option>
            </select>

            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className={`relative flex h-[38px] shrink-0 items-center justify-center gap-1 rounded-xl border px-2.5 text-[11.5px] font-semibold transition cursor-pointer select-none ${
                customDate
                  ? "bg-brand-50 border-brand-500 text-brand-900"
                  : "bg-white border-line text-ink hover:bg-neutral-50"
              }`}
              title="Click to pick an exact date"
            >
              <Calendar size={14} className={customDate ? "text-brand-700" : "text-muted"} />
              {customDate && (
                <>
                  <span className="whitespace-nowrap">{formatDisplayDate(customDate)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomDate("");
                      if (dateInputRef.current) dateInputRef.current.value = "";
                    }}
                    className="relative z-10 -mr-1 rounded-full p-0.5 text-brand-700 hover:bg-brand-100"
                    title="Clear custom date"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Filter Bar (md+) */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
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
            <div className="relative flex h-[46px] w-[280px] max-w-full items-center gap-2.5 rounded-xl border border-line bg-white px-4 shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
              <Search size={18} className="shrink-0 text-ink/70 pointer-events-none" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-muted hover:text-ink text-[16px] -mr-1"
                >
                  &times;
                </button>
              )}
            </div>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "all") setCustomDate("");
              }}
              className="h-[46px] rounded-xl border border-line bg-white px-3.5 text-[14px] font-semibold text-ink outline-none hover:bg-neutral-50 cursor-pointer transition shadow-[0_1px_3px_rgba(16,60,35,0.05)]"
            >
              <option value="all">📅 All dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
            </select>

            {/* Professional Date Picker Pill */}
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className={`relative flex h-[46px] items-center gap-2 rounded-xl border px-3.5 text-[14px] font-semibold transition cursor-pointer shadow-[0_1px_3px_rgba(16,60,35,0.05)] select-none ${
                customDate
                  ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500/30"
                  : "bg-white border-line text-ink hover:bg-neutral-50 hover:border-black/20"
              }`}
              title="Click to pick an exact date"
            >
              <Calendar size={16} className={customDate ? "text-brand-700" : "text-muted"} />
              <span className="font-medium">
                {customDate ? formatDisplayDate(customDate) : "Pick date"}
              </span>

              <input
                ref={dateInputRef}
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  if (e.target.value) setDateFilter("all");
                }}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                tabIndex={-1}
                aria-label="Pick date filter"
              />

              {customDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomDate("");
                    if (dateInputRef.current) dateInputRef.current.value = "";
                  }}
                  className="relative z-10 -mr-1 ml-0.5 rounded-full p-1 text-brand-700 hover:bg-brand-100 hover:text-brand-900 transition"
                  title="Clear custom date"
                >
                  <X size={14} />
                </button>
              )}
            </div>
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

        <div className={`grid gap-4 sm:gap-5 ${view === "grid" ? "grid-cols-[minmax(0,1fr)] sm:grid-cols-2 xl:grid-cols-4 items-start" : "grid-cols-[minmax(0,1fr)]"}`}>
          {visible.map((note, index) => (
            <Note
              key={note.id}
              note={note}
              now={now}
              list={view === "list"}
              onPin={() => toggleSticky(note)}
              onToggleComplete={() => toggleStickyComplete(note)}
              onDelete={() => deleteSticky(note)}
              onRead={(n) => setReadingNote(n)}
              index={index}
              currentUser={currentUser}
            />
          ))}
          {!visible.length && (
            <div className="panel col-span-full p-10 text-center flex flex-col items-center">
              <p className="font-bold text-[16px] text-ink">
                {customDate ? `No personal notes on ${formatDisplayDate(customDate)}` : sticky.length ? "No notes match your filters" : "No sticky notes yet"}
              </p>
              <p className="text-[13px] text-muted mt-1 max-w-sm">
                {customDate
                  ? "Try picking another date or clear the filter to see all your personal notes."
                  : sticky.length
                  ? "Try clearing your search query or date filter."
                  : "Add one for a quick reminder, task or idea."}
              </p>
              {(needle || dateFilter !== "all" || customDate || filter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDateFilter("all");
                    setCustomDate("");
                    setFilter("all");
                    if (dateInputRef.current) dateInputRef.current.value = "";
                  }}
                  className="mt-3 text-[13px] font-bold text-brand-700 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
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
}
