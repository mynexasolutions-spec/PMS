"use client";

import { useState } from "react";
import { Check, Ellipsis, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { NOTE_TAGS } from "@/lib/constants";
import MarkdownLite from "./markdown";
import { TagChip, noteTags } from "./tags";

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function NoteCard({ note, onEdit }) {
  const { deleteNote, updateNote } = useApp();
  const [menu, setMenu] = useState(false);
  useCloseOnOutsideClick(menu, () => setMenu(false));
  const images = note.attachments.filter((file) => IMAGE_TYPES.includes(file.mime));
  const files = note.attachments.filter((file) => !IMAGE_TYPES.includes(file.mime));

  return (
    <article className="panel relative flex flex-col p-5" style={{ zIndex: menu ? 20 : undefined }}>
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          {note.tag && <TagChip tag={note.tag} />}
          {note.projectName && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink/70">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: note.projectColor }} />
              {note.projectName}
            </span>
          )}
        </div>
        <div className="relative -mr-1.5 -mt-1">
          <button
            className="dots-btn"
            aria-label="More actions"
            aria-expanded={menu}
            onClick={(event) => {
              event.stopPropagation();
              setMenu((open) => !open);
            }}
          >
            <Ellipsis size={20} />
          </button>
          {menu && (
            <div className="menu-popover">
              <button onClick={() => onEdit(note)}>
                <Pencil size={16} /> Edit
              </button>
              <hr />
              <p className="px-3 pb-1 pt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">Tag</p>
              {NOTE_TAGS.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setMenu(false);
                    void updateNote(note.id, { tag: note.tag === id ? null : id });
                  }}
                >
                  {noteTags[id].label}
                  {note.tag === id && <Check size={16} className="ml-auto" />}
                </button>
              ))}
              <hr />
              <button className="danger" onClick={() => deleteNote(note.id)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-3 break-words text-[18px] font-bold leading-snug tracking-tight">{note.title}</h3>
      <div className="mt-2 break-words text-[14.5px] leading-relaxed text-ink/85">
        {note.content ? <MarkdownLite text={note.content} /> : <p className="text-muted">No additional content.</p>}
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((file) => (
            <a key={file.id} href={`/api/attachments/${file.id}?inline=1`} target="_blank" rel="noopener noreferrer" title={file.filename}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/attachments/${file.id}?inline=1`} alt={file.filename} className="h-[72px] w-[72px] rounded-lg border border-line object-cover" />
            </a>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={`/api/attachments/${file.id}`}
                className="inline-flex max-w-full items-start gap-2 rounded-lg bg-[#f3f7f4] px-3 py-1.5 text-[13px] font-medium text-ink/80 hover:bg-[#e8f3ec]"
              >
                <Paperclip size={15} className="mt-0.5 shrink-0" />
                <span className="break-all">{file.filename}</span>
                <span className="shrink-0 font-normal text-muted">{formatSize(file.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <time className="mt-auto pt-4 text-[12.5px] text-muted" suppressHydrationWarning>
        Updated {shortDate.format(new Date(`${note.updatedAt.replace(" ", "T")}Z`))}
      </time>
    </article>
  );
}
