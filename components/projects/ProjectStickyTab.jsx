"use client";

import { useEffect, useState } from "react";
import { Plus, Pin, Trash2, Sparkles, PinOff, Tag, User } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";

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

export default function ProjectStickyTab({ project }) {
  const { currentUser, notify } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  // Handle delete
  async function handleDelete(noteId) {
    if (!confirm("Are you sure you want to remove this sticky note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await request(`/api/sticky/${noteId}`, "DELETE");
    notify("Sticky note removed.");
  }

  const filteredNotes = notes.filter((n) => {
    if (categoryFilter === "all") return true;
    return n.category === categoryFilter;
  });

  return (
    <div className="space-y-4">
      {/* ---------------- 1. HEADER & CONTROLS ---------------- */}
      <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[18px] text-ink">{project.name} Pinboard</h3>
            <span className="rounded-full bg-amber-100 text-amber-800 font-bold px-2 py-0.5 text-[11px]">
              {notes.length} note{notes.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[13px] text-muted mt-0.5">
            Team sticky notes, quick notices, staging reminders & sprint ideas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="hidden md:flex items-center gap-1 bg-[#f4f7f5] p-1 rounded-xl border border-line">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold capitalize transition ${
                  categoryFilter === cat
                    ? "bg-white text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-[13.5px] font-bold text-white shadow-xs hover:bg-brand-800 transition"
          >
            <Plus size={16} /> Pin a Note
          </button>
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
                maxLength={500}
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
      ) : filteredNotes.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note) => {
            const colorSpec = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];
            const isMe = note.userId === currentUser?.id;
            const canDelete = isMe || isProjAdmin;

            return (
              <div
                key={note.id}
                className="relative rounded-2xl p-4 shadow-xs transition hover:shadow-md flex flex-col justify-between min-h-[170px] border"
                style={{
                  backgroundColor: colorSpec.bg,
                  borderColor: colorSpec.border,
                }}
              >
                {/* Top Pin Bar */}
                <div className="flex items-center justify-between mb-2">
                  {note.category && (
                    <span
                      className="rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide bg-white/70 shadow-2xs"
                      style={{ color: colorSpec.text }}
                    >
                      {note.category}
                    </span>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Pin Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note)}
                      className={`grid h-6 w-6 place-items-center rounded-lg transition ${
                        note.pinned
                          ? "bg-white/90 text-brand-700 shadow-2xs"
                          : "text-black/30 hover:text-black hover:bg-white/40"
                      }`}
                      title={note.pinned ? "Unpin note" : "Pin to top"}
                    >
                      <Pin size={13} className={note.pinned ? "fill-brand-700" : ""} />
                    </button>

                    {/* Delete Note */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="grid h-6 w-6 place-items-center rounded-lg text-black/30 hover:text-red-700 hover:bg-white/40 transition"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p
                  className="whitespace-pre-wrap break-words text-[14px] leading-relaxed flex-1 font-medium select-text"
                  style={{ color: colorSpec.text }}
                >
                  {note.content}
                </p>

                {/* Footer Attribution */}
                <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-black/55">
                  <div className="flex items-center gap-1.5 truncate">
                    <Avatar name={note.authorName || "User"} id={note.userId} size={18} />
                    <span className="truncate font-semibold">{note.authorName || "Teammate"}</span>
                  </div>
                  <span className="shrink-0">{formatTime(note.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
