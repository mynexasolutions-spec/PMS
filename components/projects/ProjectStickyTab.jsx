"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pin, Trash2, Search, Calendar, X, Check, Clock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import StickyDetailModal from "@/components/modals/StickyDetailModal";
import { request } from "@/lib/api";

export function getExpiryTimeLeft(completedAt) {
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

const CATEGORIES = ["all", "work", "ideas", "reminders", "urgent"];

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

const PREVIEW_LIMIT = 130;

export default function ProjectStickyTab({ project }) {
  const { currentUser, notify, confirmDialog } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [readingNote, setReadingNote] = useState(null);
  const dateInputRef = useRef(null);

  // Create modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("yellow");
  const [newCategory, setNewCategory] = useState("work");
  const [submitting, setSubmitting] = useState(false);

  const isProjAdmin =
    project?.isProjectAdmin ||
    project?.createdBy === currentUser?.id ||
    (project?.members || []).some((m) => m.userId === currentUser?.id && m.role === "admin");

  // Fetch project sticky notes
  async function fetchNotes() {
    setLoading(true);
    const { ok, data } = await request(`/api/sticky?projectId=${project.id}`);
    setLoading(false);
    if (ok && Array.isArray(data?.notes)) {
      setNotes(data.notes);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [project.id]);

  // Handle create
  async function handleCreate(e) {
    e.preventDefault();
    const content = newContent.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    const { ok, data } = await request("/api/sticky", "POST", {
      content,
      color: newColor,
      category: newCategory === "all" ? "work" : newCategory,
      projectId: project.id,
    });
    setSubmitting(false);

    if (!ok) {
      notify(data?.error ?? "Could not save sticky note.");
      return;
    }

    setNotes((prev) => [data.note, ...prev]);
    setNewContent("");
    setIsCreating(false);
    notify("Sticky note pinned to project! 📌");
  }

  // Handle pin toggle
  async function handleTogglePin(note) {
    const nextPinned = !note.pinned;
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id)
    );

    await request(`/api/sticky/${note.id}`, "PATCH", { pinned: nextPinned });
  }

  // Handle mark done / complete toggle (auto-deletes in 48h)
  async function handleToggleComplete(note) {
    const nextCompleted = !note.completedAt;
    const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;

    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, completedAt: nextCompletedAt } : n))
    );

    const { ok } = await request(`/api/sticky/${note.id}`, "PATCH", { completed: nextCompleted });
    if (!ok) {
      notify("Could not update note status.");
      fetchNotes();
      return;
    }

    notify(nextCompleted ? "Marked as resolved (auto-deletes in 48h) ✓" : "Restored to active 📌");
  }

  // Handle delete
  async function handleDelete(noteId) {
    const ok = await confirmDialog({
      title: "Remove Sticky Note",
      message: "Are you sure you want to remove this sticky note?",
      confirmText: "Remove",
      type: "danger",
    });
    if (!ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await request(`/api/sticky/${noteId}`, "DELETE");
    notify("Sticky note removed.");
  }

  const activeCount = notes.filter((n) => !n.completedAt).length;
  const resolvedCount = notes.filter((n) => !!n.completedAt).length;

  const filteredNotes = notes.filter((n) => {
    // 1. Status filter
    if (statusFilter === "active" && n.completedAt) return false;
    if (statusFilter === "resolved" && !n.completedAt) return false;

    // 2. Category filter
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;

    // 2. Search query (matches note content, author name, or category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const contentMatch = (n.content || "").toLowerCase().includes(q);
      const authorMatch = (n.authorName || "").toLowerCase().includes(q);
      const catMatch = (n.category || "").toLowerCase().includes(q);
      if (!contentMatch && !authorMatch && !catMatch) return false;
    }

    // 3. Date filter (exact custom date OR presets)
    if (customDate) {
      if (!isSameCalendarDay(n.createdAt, customDate)) return false;
    } else if (dateFilter !== "all" && n.createdAt) {
      try {
        const created = new Date(`${n.createdAt.replace(" ", "T")}Z`);
        const now = new Date();
        const diffDays = Math.round(
          (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime()) /
            86_400_000
        );
        if (dateFilter === "today" && diffDays !== 0) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      } catch {
        // preserve note on date parse error
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* ---------------- 1. HEADER & CONTROLS ---------------- */}
      <div className="panel p-4 flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[18px] text-ink">{project.name} Pinboard</h3>
              <span className="rounded-full bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[11px]">
                {filteredNotes.length} of {notes.length} note{notes.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-[13px] text-muted mt-0.5">
              Team sticky notes, quick notices, staging reminders & sprint ideas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-[13.5px] font-bold text-white shadow-xs hover:bg-brand-800 transition shrink-0"
          >
            <Plus size={16} /> Pin a Note
          </button>
        </div>

        {/* Search, Date Filter & Category Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[210px] max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, author..."
                className="w-full rounded-xl border border-line bg-white pl-8 pr-7 py-1.5 text-[12.5px] font-medium outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-[14px]"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink outline-none hover:bg-neutral-50 cursor-pointer transition focus:border-brand-500 shadow-2xs"
            >
              <option value="all">⚡ All Status ({notes.length})</option>
              <option value="active">📌 Active ({activeCount})</option>
              <option value="resolved">✓ Resolved ({resolvedCount})</option>
            </select>

            {/* Date Filter Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "all") setCustomDate("");
              }}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink outline-none hover:bg-neutral-50 cursor-pointer transition focus:border-brand-500 shadow-2xs"
            >
              <option value="all">📅 All dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
            </select>

            {/* Professional Custom Date Picker Pill */}
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold transition cursor-pointer shadow-2xs select-none ${
                customDate
                  ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500/30"
                  : "bg-white border-line text-ink hover:bg-neutral-50 hover:border-black/20"
              }`}
              title="Click to pick an exact date"
            >
              <Calendar size={13} className={customDate ? "text-brand-700" : "text-muted"} />
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
                  className="relative z-10 -mr-1 ml-0.5 rounded-full p-0.5 text-brand-700 hover:bg-brand-100 hover:text-brand-900 transition"
                  title="Clear custom date"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Clear filters button if active */}
            {(searchQuery || statusFilter !== "all" || dateFilter !== "all" || customDate || categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setDateFilter("all");
                  setCustomDate("");
                  setCategoryFilter("all");
                }}
                className="text-[12px] font-semibold text-brand-700 hover:underline px-1 py-1"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-[#f4f7f5] p-1 rounded-xl border border-line overflow-x-auto max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold capitalize transition shrink-0 ${
                  categoryFilter === cat
                    ? "bg-white text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- 2. CREATE STICKY MODAL ---------------- */}
      {isCreating && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-[17px] text-ink mb-1">Pin Note to {project.name}</h3>
            <p className="text-[12.5px] text-muted mb-3">
              Everyone in this project team will be able to see and read this note.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write quick note, reminder, or link..."
                className="w-full rounded-xl border border-line p-3 text-[14px] text-ink outline-none focus:border-brand-500 transition resize-none"
              />

              {/* Color Selector */}
              <div>
                <label className="block text-[12px] font-semibold text-ink/75 mb-1.5">Note Colour</label>
                <div className="flex items-center gap-2">
                  {STICKY_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewColor(col.id)}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        newColor === col.id ? "scale-110 shadow-sm ring-2 ring-brand-500" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.bg, borderColor: col.border }}
                      title={col.id}
                    />
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[12px] font-semibold text-ink/75 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold capitalize border transition ${
                        newCategory === cat
                          ? "bg-brand-50 border-brand-500 text-brand-900"
                          : "border-line bg-white text-muted hover:text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl px-4 py-2 text-[13px] font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim() || submitting}
                  className="rounded-xl bg-brand-700 px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-40"
                >
                  {submitting ? "Pinning..." : "Pin Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- 3. STICKY NOTES PINBOARD GRID ---------------- */}
      {loading ? (
        <div className="panel p-12 text-center text-muted text-[13.5px]">
          <p className="animate-pulse">Loading project pinboard...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="panel p-12 text-center text-muted">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 mb-3">
            <Sparkles size={24} />
          </div>
          <h4 className="font-bold text-[16px] text-ink">No Sticky Notes Pinned Yet</h4>
          <p className="text-[13px] text-muted max-w-sm mx-auto mt-1">
            Pin important project notices, credentials links, or staging reminders for the team.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-brand-800 transition"
          >
            <Plus size={15} /> Pin First Note
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="panel p-8 text-center flex flex-col items-center">
          <p className="font-semibold text-[15px] text-ink">
            {customDate ? `No notes found on ${formatDisplayDate(customDate)}` : "No notes match your filters"}
          </p>
          <p className="text-[13px] text-muted mt-1">
            {customDate
              ? "Try picking another date or clear the filter to see all notes."
              : "Try searching with another keyword or resetting the date filter."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("all");
              setCustomDate("");
              setCategoryFilter("all");
              if (dateInputRef.current) dateInputRef.current.value = "";
            }}
            className="mt-3 text-[13px] font-bold text-brand-700 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {filteredNotes.map((note, index) => {
            const colorSpec = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];
            const isMe = note.userId === currentUser?.id;
            const canDelete = isMe || isProjAdmin;
            const isLong = note.content.length > PREVIEW_LIMIT;
            const previewText = isLong ? `${note.content.slice(0, PREVIEW_LIMIT).trim()}...` : note.content;
            const tilt = index % 4 === 0 ? "-rotate-[0.6deg]" : index % 4 === 2 ? "rotate-[0.6deg]" : "rotate-0";
            const FOLD_SIZE = 28;
            const isResolved = !!note.completedAt;
            const expiryLeft = getExpiryTimeLeft(note.completedAt);

            return (
              <div
                key={note.id}
                onClick={() => setReadingNote(note)}
                className={`group relative h-[215px] flex flex-col justify-between p-4 pb-3 cursor-pointer transition-all duration-200 hover:rotate-0 hover:scale-[1.02] hover:z-10 ${tilt} ${
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
                        handleToggleComplete(note);
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
                        handleTogglePin(note);
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
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="grid h-6 w-6 place-items-center rounded-lg text-black/35 hover:text-red-700 hover:bg-white/50 transition opacity-60 hover:opacity-100"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content: Uniform Fixed-height line-clamp-4 with High Contrast Charcoal Ink */}
                <div className="relative z-1 flex-1 flex flex-col justify-start overflow-hidden my-1">
                  <p
                    className={`whitespace-pre-wrap break-words text-[14.5px] leading-[1.45] font-semibold line-clamp-4 select-text text-slate-900 tracking-[-0.01em] ${
                      isResolved ? "line-through opacity-75 decoration-emerald-700/60" : ""
                    }`}
                  >
                    {previewText}
                  </p>
                  {isLong && (
                    <span
                      className="mt-auto inline-flex items-center gap-1 text-[11.5px] font-bold underline underline-offset-2 text-slate-700 group-hover:text-black transition"
                    >
                      Read note &rarr;
                    </span>
                  )}
                </div>

                {/* Footer Attribution: Clean Combined Author + Date, leaving bottom-right curl completely uncollided */}
                <div className="relative z-1 mt-auto pt-2 border-t border-black/10 flex items-center text-[11.5px] text-slate-700 pr-8">
                  <div className="flex items-center gap-1.5 truncate max-w-full">
                    <Avatar name={note.authorName || "User"} id={note.userId} size={18} />
                    <span className="truncate font-semibold text-slate-800">{note.authorName || "Teammate"}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="shrink-0 text-[11px] font-medium text-slate-600">{formatTime(note.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Note Detail Modal */}
      {readingNote && (
        <StickyDetailModal
          note={readingNote}
          onClose={() => setReadingNote(null)}
          onTogglePin={(note) => {
            handleTogglePin(note);
            setReadingNote((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
          }}
          onToggleComplete={(note) => {
            handleToggleComplete(note);
            const nextCompleted = !note.completedAt;
            const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;
            setReadingNote((prev) => (prev ? { ...prev, completedAt: nextCompletedAt } : null));
          }}
          onDelete={(note) => {
            handleDelete(note.id);
            setReadingNote(null);
          }}
          canDelete={readingNote.userId === currentUser?.id || isProjAdmin}
        />
      )}
    </div>
  );
}
