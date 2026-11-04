"use client";

import { useState } from "react";
import { Check, Ellipsis, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { NOTE_TAGS } from "@/lib/constants";
import { TagChip, noteTags } from "./tags";

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

function cleanPreview(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\+\+(.+?)\+\+/g, "$1")
    .replace(/\*([^*\n]+?)\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export default function NoteCard({ note, onEdit, onSelect }) {
  const { deleteNote, updateNote } = useApp();
  const [menu, setMenu] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  useCloseOnOutsideClick(menu, () => setMenu(false));

  const attachmentCount = (note.attachments || []).length;
  const previewText = cleanPreview(note.content);

  return (
    <article
      onClick={() => onSelect?.(note)}
      className="panel group relative flex h-[200px] sm:h-[210px] min-w-0 cursor-pointer flex-col justify-between overflow-visible p-4 sm:p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
      style={{ zIndex: menu ? 30 : undefined }}
    >
      {/* Top Row: Tag, Project & 3-Dots Menu */}
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
          {note.tag ? (
            <TagChip tag={note.tag} className="!px-2.5 !py-0.5 !text-[11.5px]" />
          ) : (
            <span className="rounded-full bg-[#eef3ef] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink/60">
              Note
            </span>
          )}
          {note.projectName && (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-ink/70">
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: note.projectColor }} />
              <span className="truncate max-w-[130px]">{note.projectName}</span>
            </span>
          )}
        </div>

        <div className="relative -mr-1.5 -mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="dots-btn"
            aria-label="More actions"
            aria-expanded={menu}
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              setOpenUp(window.innerHeight - rect.bottom < 240);
              setMenu((open) => !open);
            }}
          >
            <Ellipsis size={19} />
          </button>
          {menu && (
            <div
              className={`menu-popover right-0 z-50 ${
                openUp ? "!top-auto bottom-[calc(100%+6px)]" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onEdit(note);
                }}
              >
                <Pencil size={15} /> Edit
              </button>
              <hr />
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Tag
              </p>
              {NOTE_TAGS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    void updateNote(note.id, { tag: note.tag === id ? null : id });
                  }}
                >
                  {noteTags[id].label}
                  {note.tag === id && <Check size={15} className="ml-auto" />}
                </button>
              ))}
              <hr />
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenu(false);
                  deleteNote(note.id);
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Clamped Title & Preview */}
      <div className="my-auto min-h-0 min-w-0 flex-1 overflow-hidden pt-2.5">
        <h3 className="line-clamp-1 wrap-anywhere text-[16.5px] sm:text-[17.5px] font-bold leading-snug tracking-tight text-ink group-hover:text-brand-800 transition-colors">
          {note.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 wrap-anywhere text-[13.5px] sm:text-[14px] leading-relaxed text-ink/75">
          {previewText || <span className="italic text-muted">No additional content.</span>}
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2.5 text-[12px] text-muted shrink-0">
        <div className="flex items-center gap-2.5">
          <time suppressHydrationWarning>
            Updated {shortDate.format(new Date(`${note.updatedAt.replace(" ", "T")}Z`))}
          </time>
          {attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef5f0] px-2 py-0.5 text-[11px] font-semibold text-brand-800">
              <Paperclip size={11} /> {attachmentCount}
            </span>
          )}
        </div>

        <span className="text-[11.5px] font-semibold text-brand-700 opacity-75 group-hover:opacity-100 transition">
          View →
        </span>
      </div>
    </article>
  );
}
