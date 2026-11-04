"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  Folder,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Paperclip,
  Plus,
  Save,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Dropdown from "@/components/ui/Dropdown";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { NOTE_TAGS } from "@/lib/constants";
import { longDate, parseLocalDate } from "@/lib/datetime";
import NoteCard from "./NoteCard";
import NoteDetailModal from "./NoteDetailModal";
import RichEditor from "./RichEditor";
import { TagChip, noteTags } from "./tags";
import { TEMPLATES } from "./templates";

const MAX_TITLE = 100;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip";
const blank = { title: "", content: "", tag: null, projectId: null };
const templateDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Big pale-green circles, a tilted stack of note paper, a bulb card and sparkles, fading in from the right. */
function HeaderArt() {
  const mask = "linear-gradient(to right, transparent 0%, black 34%)";
  return (
    <svg
      viewBox="0 0 760 214"
      preserveAspectRatio="xMaxYMin slice"
      aria-hidden="true"
      className="pointer-events-none absolute -right-[34px] -top-4 hidden h-[175px] w-auto max-w-[540px] xl:block opacity-90"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <linearGradient id="paperFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8efd3" />
          <stop offset="1" stopColor="#7fd197" />
        </linearGradient>
        <linearGradient id="paperBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fdcb1" />
          <stop offset="1" stopColor="#58b975" />
        </linearGradient>
      </defs>
      <circle cx="560" cy="250" r="250" fill="#e6f6ea" />
      <circle cx="560" cy="250" r="190" fill="#d8efde" opacity="0.85" />
      <circle cx="560" cy="250" r="130" fill="#cbe9d3" opacity="0.7" />

      <g transform="rotate(9 600 130)">
        <rect x="506" y="58" width="176" height="128" rx="14" fill="url(#paperBack)" transform="translate(20 12)" />
        <rect x="506" y="58" width="176" height="128" rx="14" fill="url(#paperFront)" />
        <rect x="528" y="82" width="100" height="10" rx="5" fill="#ffffff" opacity="0.95" />
        <rect x="528" y="104" width="128" height="6" rx="3" fill="#ffffff" opacity="0.7" />
        <rect x="528" y="120" width="116" height="6" rx="3" fill="#ffffff" opacity="0.7" />
        <rect x="528" y="136" width="104" height="6" rx="3" fill="#ffffff" opacity="0.7" />
        <rect x="528" y="152" width="82" height="6" rx="3" fill="#ffffff" opacity="0.7" />
      </g>

      <g transform="rotate(12 706 70)">
        <rect x="676" y="38" width="62" height="62" rx="14" fill="#ffffff" />
        <circle cx="707" cy="64" r="11" fill="#fcd34d" />
        <rect x="701" y="77" width="12" height="6" rx="2.5" fill="#e6b422" />
        <path d="M707 44v-4M693 50l-3-3M721 50l3-3" stroke="#f0a020" strokeWidth="2" strokeLinecap="round" />
      </g>

      <path d="M452 30l3 7M468 22l2 8" stroke="#5fb87c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M470 150c4-6 9-8 14-6M742 140c-3 4-3 8 0 12" stroke="#6bbf86" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="486" cy="168" r="3" fill="#6bbf86" />
    </svg>
  );
}

function EmptyArt() {
  return (
    <svg viewBox="0 0 120 90" className="mx-auto h-[84px] w-[112px]" aria-hidden="true">
      <rect x="26" y="24" width="64" height="58" rx="12" fill="#e3f5e8" />
      <rect x="38" y="40" width="30" height="5" rx="2.5" fill="#2fa35a" />
      <rect x="38" y="52" width="40" height="5" rx="2.5" fill="#2fa35a" />
      <rect x="38" y="64" width="26" height="5" rx="2.5" fill="#2fa35a" />
      <path d="M88 14l-3 7M97 20l-7 4M100 32l-8 0" stroke="#2fa35a" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** The green "Use template" link beside "Quick templates": a small menu of the same templates. */
function TemplateMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-2 py-1 text-[13px] sm:text-[14px] font-semibold text-brand-700 hover:underline"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
      >
        Use template
      </button>
      {open && (
        <div className="menu-popover right-0 z-50">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(template);
              }}
            >
              <template.Icon size={16} /> {template.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesView() {
  const { notes, projects, todayDate, notify, createNote, updateNote, deleteNote, removeAttachment } = useApp();
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [view, setView] = useState("grid");
  const titleRef = useRef(null);
  const fileRef = useRef(null);
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const editing = notes.find((note) => note.id === editingId);
  const selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
  const slotsLeft = MAX_FILES - (editing?.attachments.length ?? 0) - files.length;

  const needle = search.trim().toLowerCase();
  const shown = notes.filter(
    (note) =>
      (projectFilter === "all" || note.projectId === projectFilter) &&
      (tagFilter === "all" || note.tag === tagFilter) &&
      (!needle || `${note.title} ${note.content}`.toLowerCase().includes(needle)),
  );

  const focusForm = () => {
    setMobileFormOpen(true);
    setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  function reset() {
    setForm(blank);
    setFiles([]);
    setEditingId(null);
    setMobileFormOpen(false);
  }

  function startEdit(note) {
    setEditingId(note.id);
    setFiles([]);
    setForm({ title: note.title, content: note.content, tag: note.tag, projectId: note.projectId });
    focusForm();
  }

  function applyTemplate(template) {
    const formattedDate = templateDate.format(parseLocalDate(todayDate));
    setEditingId(null);
    setFiles([]);
    setForm((current) => ({
      title: `${template.title} – ${formattedDate}`,
      content: template.content.replace(/\{\{DATE\}\}/g, formattedDate),
      tag: template.tag,
      projectId: current.projectId,
    }));
    focusForm();
  }

  function addFiles(list) {
    let room = slotsLeft;
    const accepted = [];
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        notify(`"${file.name}" is larger than 5 MB.`);
      } else if (room <= 0) {
        notify(`A note can have at most ${MAX_FILES} attachments.`);
        break;
      } else {
        accepted.push(file);
        room -= 1;
      }
    }
    if (accepted.length) setFiles((current) => [...current, ...accepted]);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = { title: form.title, content: form.content, tag: form.tag, projectId: form.projectId };
    const ok = editingId ? await updateNote(editingId, payload, files) : await createNote(payload, files);
    setSaving(false);
    if (ok) reset();
  }

  const chipBase = "inline-flex h-[36px] items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium transition";
  const toggleBtn = "grid h-9 w-9 sm:h-[44px] sm:w-[46px] place-items-center transition";

  const projectOptions = [
    { value: "all", label: "All projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];
  const tagOptions = [
    { value: "all", label: "All tags" },
    ...NOTE_TAGS.map((id) => ({ value: id, label: noteTags[id].label })),
  ];

  return (
    <div className="px-3.5 pb-8 pt-3.5 sm:px-5 sm:pt-6 md:px-[34px]">
      <header className="relative overflow-hidden rounded-2xl xl:min-h-[150px] xl:pt-2">
        <HeaderArt />
        <div className="relative">
          <p className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink/70">
            {longDate(todayDate, true)}
          </p>
          <div className="mt-1 sm:mt-2 flex items-center justify-between gap-2.5">
            <h1 className="text-[26px] sm:text-[42px] md:text-[50px] font-extrabold leading-none tracking-tight">
              My <span className="text-brand-600">notes</span>
            </h1>

            <button
              type="button"
              onClick={() => {
                if (mobileFormOpen && !editingId) {
                  setMobileFormOpen(false);
                } else {
                  setEditingId(null);
                  setForm(blank);
                  focusForm();
                }
              }}
              className="btn-primary h-8 px-3 text-[12px] xl:hidden whitespace-nowrap"
            >
              {mobileFormOpen ? (
                <>
                  <X size={14} /> Close editor
                </>
              ) : (
                <>
                  <Plus size={15} /> New note
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 sm:mt-3 max-w-[560px] text-[12.5px] sm:text-[16px] text-muted">
            Your private workspace for meeting notes, ideas, requirements, and useful links.
          </p>
        </div>
      </header>

      <div className={`mt-3.5 sm:mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 sm:gap-5 ${expanded ? "" : "xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"}`}>
        {/* Note Editor Form: Collapsible on Mobile (<xl), Always Visible on Laptop (xl:) */}
        <form
          onSubmit={submit}
          className={`panel p-4 sm:p-5 ${mobileFormOpen || editingId ? "block" : "hidden xl:block"}`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="grid h-9 w-9 sm:h-[44px] sm:w-[44px] shrink-0 place-items-center rounded-full bg-[#e3f5e8] text-brand-700">
              <FileText size={19} className="sm:h-[22px] sm:w-[22px]" />
            </span>
            <h2 className="flex-1 text-[17px] sm:text-[19px] font-bold tracking-tight">
              {editingId ? "Edit note" : "Create a new note"}
            </h2>
            <button
              type="button"
              className="hidden xl:grid icon-btn h-[40px] w-[40px] !border-transparent !bg-[#f1f6f2]"
              onClick={() => setExpanded((on) => !on)}
              aria-label={expanded ? "Shrink editor" : "Expand editor"}
            >
              {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              className="grid xl:hidden h-8 w-8 place-items-center rounded-lg bg-[#f1f6f2] text-ink/70"
              onClick={reset}
              aria-label="Close editor"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 sm:mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="note-title" className="text-[14px] sm:text-[15px] font-semibold">
                Title
              </label>
              <span className="text-[12px] sm:text-[13px] text-muted">
                {form.title.length}/{MAX_TITLE}
              </span>
            </div>
            <input
              id="note-title"
              ref={titleRef}
              required
              maxLength={MAX_TITLE}
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="e.g. Sprint planning notes..."
              className="mt-1.5 sm:mt-2 h-[42px] sm:h-[48px] w-full rounded-xl border border-line bg-white px-3.5 sm:px-4 text-[14px] sm:text-[15px] outline-none placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="mt-3.5 sm:mt-4">
            <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center gap-2">
              <p className="text-[14px] sm:text-[15px] font-semibold">Content</p>
              {form.tag && (
                <span className="inline-flex items-center gap-1">
                  <TagChip tag={form.tag} className="!py-0.5" />
                  <button
                    type="button"
                    className="dots-btn !h-6 !w-6"
                    aria-label="Remove tag"
                    onClick={() => set({ tag: null })}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>
            <RichEditor
              value={form.content}
              onChange={(content) => set({ content })}
              tall={expanded}
              placeholder="Write your meeting notes, requirements or links here..."
            />
          </div>

          <div className="mt-3.5 sm:mt-4">
            <label htmlFor="note-project" className="mb-1.5 sm:mb-2 block text-[14px] sm:text-[15px] font-semibold">
              Add to project <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <Folder size={18} className="pointer-events-none absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink/70" />
              <select
                id="note-project"
                value={form.projectId ?? ""}
                onChange={(event) => set({ projectId: event.target.value ? Number(event.target.value) : null })}
                className="h-[42px] sm:h-[48px] w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-10 sm:pl-12 pr-10 text-[14px] sm:text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {(editing?.attachments.length > 0 || files.length > 0) && (
            <ul className="mt-3.5 sm:mt-4 flex flex-wrap gap-2">
              {editing?.attachments.map((file) => (
                <li
                  key={file.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#f3f7f4] py-1.5 pl-3 pr-1.5 text-[12.5px] sm:text-[13px] font-medium"
                >
                  <Paperclip size={14} className="shrink-0" />
                  <span className="break-all">{file.filename}</span>
                  <button
                    type="button"
                    className="dots-btn !h-6 !w-6"
                    aria-label={`Remove ${file.filename}`}
                    onClick={() => removeAttachment(editing.id, file.id)}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#e8f6ec] py-1.5 pl-3 pr-1.5 text-[12.5px] sm:text-[13px] font-medium text-brand-800"
                >
                  <Paperclip size={14} className="shrink-0" />
                  <span className="break-all">{file.name}</span>
                  <button
                    type="button"
                    className="dots-btn !h-6 !w-6"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-3 border-t border-line pt-3.5 sm:pt-4">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept={ACCEPT}
              onChange={(event) => {
                addFiles([...event.target.files]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn-secondary h-9 sm:h-[44px] px-3 sm:px-4 text-[12.5px] sm:text-[14px]"
              onClick={() => fileRef.current?.click()}
              disabled={slotsLeft <= 0}
            >
              <Paperclip size={16} /> Attach
            </button>
            <button
              type="button"
              className="btn-secondary ml-auto h-9 sm:h-[44px] px-4 sm:px-5 text-[12.5px] sm:text-[14px]"
              onClick={reset}
            >
              Cancel
            </button>
            <button className="btn-primary h-9 sm:h-[44px] px-4 sm:px-5 text-[12.5px] sm:text-[14px]" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : editingId ? "Update note" : "Save note"}
            </button>
          </div>
        </form>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <section className="panel p-3.5 sm:p-4">
            {/* Toolbar: Search + View Toggle + Filter Dropdowns */}
            <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-[200px]">
                <label className="flex h-9 sm:h-[44px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 sm:px-4">
                  <Search size={16} className="shrink-0 text-ink/60 sm:h-[18px] sm:w-[18px]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notes..."
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] sm:text-[15px] outline-none placeholder:text-muted"
                  />
                </label>

                <div className="flex shrink-0 overflow-hidden rounded-xl border border-line bg-white sm:hidden">
                  <button
                    type="button"
                    className={`${toggleBtn} ${view === "grid" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"}`}
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${toggleBtn} ${view === "list" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"}`}
                    onClick={() => setView("list")}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>

              {/* 2-Column Dropdowns on Mobile, Inline on Desktop */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
                <Dropdown
                  value={projectFilter}
                  options={projectOptions}
                  onChange={setProjectFilter}
                  className="w-full justify-between !h-9 !px-3 !text-[12.5px] sm:w-auto sm:!h-[44px] sm:!text-[14px]"
                />
                <Dropdown
                  value={tagFilter}
                  options={tagOptions}
                  onChange={setTagFilter}
                  align="right"
                  className="w-full justify-between !h-9 !px-3 !text-[12.5px] sm:w-auto sm:!h-[44px] sm:!text-[14px]"
                />
              </div>

              <div className="hidden sm:flex overflow-hidden rounded-xl border border-line bg-white">
                <button
                  type="button"
                  className={`${toggleBtn} ${view === "grid" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"}`}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  type="button"
                  className={`${toggleBtn} ${view === "list" ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"}`}
                  onClick={() => setView("list")}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Tag Chips on Desktop (sm:) */}
            <div className="mt-3 hidden sm:flex sm:flex-wrap sm:gap-2">
              <button
                type="button"
                onClick={() => setTagFilter("all")}
                className={`${chipBase} ${tagFilter === "all" ? "bg-brand-700 text-white shadow-md" : "bg-[#eef3ef] text-ink/80 hover:bg-[#e3ece6]"}`}
              >
                All
              </button>
              {NOTE_TAGS.map((id) => {
                const meta = noteTags[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTagFilter(tagFilter === id ? "all" : id)}
                    className={`${chipBase} ${meta.chip} ${tagFilter === id ? "ring-2 ring-current/50" : "hover:brightness-95"}`}
                  >
                    {meta.Icon && <meta.Icon size={14} fill="currentColor" />}
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 sm:mt-4">
              {notes.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white/60 px-5 py-8 text-center">
                  <EmptyArt />
                  <h3 className="mt-2 text-[19px] sm:text-[22px] font-bold tracking-tight">No notes yet</h3>
                  <p className="mx-auto mt-1 max-w-[380px] text-[13.5px] sm:text-[15px] text-muted">
                    Start capturing your meeting notes, requirements, ideas and important links.
                  </p>
                  <button className="btn-primary mt-4 h-10 sm:h-[46px] px-5 sm:px-6 text-[14px]" onClick={focusForm}>
                    <Plus size={18} /> Create your first note
                  </button>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 ${
                    view === "grid"
                      ? expanded
                        ? "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                        : "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  {shown.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={startEdit}
                      onSelect={(n) => setSelectedNoteId(n.id)}
                    />
                  ))}
                  {!shown.length && <div className="empty-view col-span-full">No notes match your filters.</div>}
                </div>
              )}
            </div>
          </section>

          <section className="panel p-3.5 sm:p-4">
            <div className="flex items-center gap-2 px-1">
              <Zap size={18} className="text-[#f0a020] sm:h-5 sm:w-5" fill="currentColor" />
              <h2 className="text-[16.5px] sm:text-[18px] font-bold tracking-tight">Quick templates</h2>
              <TemplateMenu onPick={applyTemplate} />
            </div>
            <div className={`mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 ${expanded ? "lg:grid-cols-4" : "2xl:grid-cols-4"}`}>
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col justify-between rounded-xl border border-line bg-white p-3 sm:p-3.5 shadow-[0_1px_3px_rgba(16,60,35,0.06)]"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                    <span className={`grid h-8 w-8 sm:h-[38px] sm:w-[38px] shrink-0 place-items-center rounded-lg ${template.tone.tile}`}>
                      <template.Icon size={17} className="sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] sm:text-[15px] font-bold leading-tight">{template.name}</p>
                      <p className="mt-0.5 text-[11px] sm:text-[12.5px] leading-snug text-muted line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className={`mt-2.5 sm:mt-3.5 h-8 sm:h-[38px] rounded-lg text-[12px] sm:text-[14px] font-semibold transition ${template.tone.button}`}
                  >
                    Use template
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Click-to-View Note Detail Modal (Mobile & Laptop) */}
      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedNoteId(null)}
          onEdit={startEdit}
          onDelete={deleteNote}
        />
      )}
    </div>
  );
}
