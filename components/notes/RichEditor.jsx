"use client";

import { useRef } from "react";
import { Bold, Code, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Underline } from "lucide-react";

const btn = "grid h-9 w-9 place-items-center rounded-lg text-ink/80 transition hover:bg-white hover:text-ink";

/**
 * Textarea with a formatting toolbar. The buttons insert the same lightweight markup that
 * MarkdownLite renders (**bold**, *italic*, ++underline++, lists, links, images, `code`).
 */
export default function RichEditor({ value, onChange, maxLength = 2000, placeholder, tall = false }) {
  const ref = useRef(null);

  // Runs an edit against the current selection, then restores focus and selection.
  function edit(change) {
    const el = ref.current;
    const result = change(value, el.selectionStart, el.selectionEnd);
    onChange(result.value.slice(0, maxLength));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  }

  const wrap = (before, after, fallback) => () =>
    edit((text, start, end) => {
      const selected = text.slice(start, end) || fallback;
      return { value: text.slice(0, start) + before + selected + after + text.slice(end), start: start + before.length, end: start + before.length + selected.length };
    });

  const prefixLines = (prefix) => () =>
    edit((text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const found = text.indexOf("\n", end);
      const lineEnd = found === -1 ? text.length : found;
      const block = text
        .slice(lineStart, lineEnd)
        .split("\n")
        .map((line, i) => prefix(i) + line)
        .join("\n");
      return { value: text.slice(0, lineStart) + block + text.slice(lineEnd), start: lineStart, end: lineStart + block.length };
    });

  // Inserts [label](https://) and selects the URL so it can be typed or pasted straight away.
  const insertLink = (image) => () =>
    edit((text, start, end) => {
      const label = text.slice(start, end) || (image ? "image description" : "link text");
      const markup = `${image ? "!" : ""}[${label}](https://)`;
      const urlStart = start + markup.length - "https://)".length;
      return { value: text.slice(0, start) + markup + text.slice(end), start: urlStart, end: urlStart + "https://".length };
    });

  const tools = [
    ["Bold", Bold, wrap("**", "**", "bold text")],
    ["Italic", Italic, wrap("*", "*", "italic text")],
    ["Underline", Underline, wrap("++", "++", "underlined text")],
    null,
    ["Bulleted list", List, prefixLines(() => "- ")],
    ["Numbered list", ListOrdered, prefixLines((i) => `${i + 1}. `)],
    null,
    ["Link", LinkIcon, insertLink(false)],
    ["Image", ImageIcon, insertLink(true)],
    ["Code", Code, wrap("`", "`", "code")],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-[#f6f9f7] px-2 py-1.5" role="toolbar" aria-label="Formatting">
        {tools.map((tool, i) =>
          tool ? (
            <button key={tool[0]} type="button" title={tool[0]} aria-label={tool[0]} className={btn} onClick={tool[2]}>
              {(() => {
                const Icon = tool[1];
                return <Icon size={18} strokeWidth={2} />;
              })()}
            </button>
          ) : (
            <span key={i} className="mx-1.5 h-5 w-px bg-line" aria-hidden="true" />
          ),
        )}
      </div>
      <textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`block w-full resize-y border-0 bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted ${tall ? "min-h-[420px]" : "min-h-[190px]"}`}
      />
      <p className="px-4 pb-2 text-right text-[12.5px] text-muted">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
