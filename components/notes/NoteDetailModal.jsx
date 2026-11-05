"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Paperclip, Pencil, Trash2, X, Clock } from "lucide-react";
import MarkdownLite from "./markdown";
import { TagChip } from "./tags";
import ListenButton from "@/components/ui/ListenButton";

const fullDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function NoteDetailModal({ note, onClose, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  const images = (note.attachments || []).filter((file) => IMAGE_TYPES.includes(file.mime));
  const files = (note.attachments || []).filter((file) => !IMAGE_TYPES.includes(file.mime));

  const handleCopy = () => {
    const textToCopy = [note.title, note.content].filter(Boolean).join("\n\n");
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
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
        className="relative flex w-full max-w-xl max-h-[85dvh] sm:max-h-[88vh] flex-col rounded-2xl sm:rounded-3xl border border-line bg-white p-4 sm:p-6 shadow-2xl transition animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5 border-b border-line pb-3.5 shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {note.tag ? (
              <TagChip tag={note.tag} />
            ) : (
              <span className="rounded-full bg-[#eef3ef] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-ink/70">
                Note
              </span>
            )}
            {note.projectName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-[#fafcfb] px-2.5 py-1 text-[12px] font-semibold text-ink/75">
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: note.projectColor }} />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{note.projectName}</span>
              </span>
            )}
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-1 sm:gap-1.5 ml-auto">
            <ListenButton text={[note.title, note.content].filter(Boolean).join(". ")} />
            <button
              type="button"
              onClick={handleCopy}
              className="grid h-8 w-8 place-items-center rounded-xl border border-line/80 bg-[#f6f9f7] text-ink/75 transition hover:bg-[#eaf4ed] hover:text-ink cursor-pointer"
              title={copied ? "Copied!" : "Copy note"}
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
                className="grid h-8 w-8 place-items-center rounded-xl border border-line/80 bg-[#f6f9f7] text-ink/75 transition hover:bg-[#eaf4ed] hover:text-brand-700 cursor-pointer"
                title="Edit note"
              >
                <Pencil size={15} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(note.id);
                  onClose();
                }}
                className="grid h-8 w-8 place-items-center rounded-xl border border-line/80 bg-[#f6f9f7] text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                title="Delete note"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl border border-line/80 bg-[#f6f9f7] text-ink/75 transition hover:bg-black/5 hover:text-ink cursor-pointer"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Note Content */}
        <div className="flex-1 overflow-y-auto py-4 sm:py-5 pr-1 select-text space-y-4 no-scrollbar sm:custom-scrollbar">
          <h2 className="break-words text-[19px] sm:text-[22px] font-extrabold leading-snug tracking-tight text-ink">
            {note.title}
          </h2>

          <div className="break-words text-[14.5px] sm:text-[15.5px] leading-[1.7] text-ink/85">
            {note.content ? (
              <MarkdownLite text={note.content} />
            ) : (
              <p className="italic text-muted">No additional content.</p>
            )}
          </div>

          {images.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-muted">
                Attached Images ({images.length})
              </p>
              <div className="flex flex-wrap gap-2.5">
                {images.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/attachments/${file.id}?inline=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={file.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/attachments/${file.id}?inline=1`}
                      alt={file.filename}
                      className="h-[88px] w-[88px] sm:h-[104px] sm:w-[104px] rounded-xl border border-line object-cover shadow-2xs transition hover:opacity-90"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-muted">
                Attachments ({files.length})
              </p>
              <ul className="space-y-1.5">
                {files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/api/attachments/${file.id}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-line/80 bg-[#f6faf7] px-3 py-2 text-[13px] font-medium text-ink/85 transition hover:border-brand-300 hover:bg-[#eaf5ee]"
                    >
                      <Paperclip size={15} className="shrink-0 text-brand-700" />
                      <span className="truncate">{file.filename}</span>
                      <span className="shrink-0 text-[11.5px] font-normal text-muted">
                        ({formatSize(file.size)})
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between border-t border-line pt-3.5 text-[12px] text-muted shrink-0">
          <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
            <Clock size={13} />
            Updated {fullDate.format(new Date(`${note.updatedAt.replace(" ", "T")}Z`))}
          </span>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"
            >
              <Pencil size={13} /> Edit note
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
