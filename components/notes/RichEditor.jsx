"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMdToHtml(text) {
  let out = escapeHtml(text);
  // **bold**
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // ++underline++
  out = out.replace(/\+\+(.+?)\+\+/g, "<u>$1</u>");
  // *italic*
  out = out.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  // `code`
  out = out.replace(
    /`([^`\n]+)`/g,
    '<code class="rounded bg-[#eef3ef] px-1.5 py-0.5 font-mono text-[0.9em] text-[#14632f]">$1</code>'
  );
  // [label](url)
  out = out.replace(
    /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-700 underline">$1</a>'
  );
  return out;
}

/** Converts our lightweight Markdown into clean HTML for the live WYSIWYG editor. */
function markdownToHtml(md) {
  if (!md) return "";
  const lines = md.split("\n");
  const html = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const bullet = /^\s*[-*]\s*(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s*(.*)$/.exec(line);

    // Only treat bare "-" or "1." as a list item if it had "- " or is "- " at end of line
    const isBulletLine = /^\s*[-*]\s+(.*)$/.exec(line) || /^\s*[-*]$/.exec(line);
    const isNumberLine = /^\s*\d+[.)]\s+(.*)$/.exec(line) || /^\s*\d+[.)]$/.exec(line);

    if (isBulletLine && bullet) {
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="list-disc pl-5 my-1 space-y-0.5">');
        inUl = true;
      }
      const itemContent = inlineMdToHtml(bullet[1] || "");
      html.push(`<li>${itemContent || "<br>"}</li>`);
    } else if (isNumberLine && numbered) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol class="list-decimal pl-5 my-1 space-y-0.5">');
        inOl = true;
      }
      const itemContent = inlineMdToHtml(numbered[1] || "");
      html.push(`<li>${itemContent || "<br>"}</li>`);
    } else {
      closeLists();
      if (!line.trim()) {
        html.push("<div><br></div>");
      } else {
        html.push(`<div>${inlineMdToHtml(line)}</div>`);
      }
    }
  }

  closeLists();
  return html.join("");
}

function serializeInline(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue || "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  if (tag === "br") return "";

  const childrenText = Array.from(node.childNodes).map(serializeInline).join("");
  if (!childrenText) return "";

  if (tag === "strong" || tag === "b") {
    return `**${childrenText}**`;
  }
  if (tag === "em" || tag === "i") {
    return `*${childrenText}*`;
  }
  if (tag === "u") {
    return `++${childrenText}++`;
  }
  if (tag === "code") {
    return `\`${childrenText}\``;
  }
  if (tag === "a") {
    const href = node.getAttribute("href") || "";
    return href ? `[${childrenText}](${href})` : childrenText;
  }
  return childrenText;
}

/** Serializes the contentEditable DOM back to lightweight Markdown for saving & previewing. */
function htmlToMarkdown(root) {
  if (!root) return "";
  const lines = [];

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const val = child.nodeValue || "";
      if (val) lines.push(val);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = child.tagName.toLowerCase();
    if (tag === "ul") {
      const items = Array.from(child.querySelectorAll(":scope > li"));
      items.forEach((li) => {
        const text = Array.from(li.childNodes).map(serializeInline).join("").trim();
        lines.push(`- ${text}`);
      });
    } else if (tag === "ol") {
      const items = Array.from(child.querySelectorAll(":scope > li"));
      items.forEach((li, idx) => {
        const text = Array.from(li.childNodes).map(serializeInline).join("").trim();
        lines.push(`${idx + 1}. ${text}`);
      });
    } else if (tag === "div" || tag === "p") {
      // Check if this div contains a nested ul/ol
      const nestedList = child.querySelector("ul, ol");
      if (nestedList) {
        lines.push(htmlToMarkdown(child));
      } else {
        const text = Array.from(child.childNodes).map(serializeInline).join("");
        lines.push(text);
      }
    } else if (tag === "br") {
      lines.push("");
    } else {
      lines.push(serializeInline(child));
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export default function RichEditor({
  value,
  onChange,
  maxLength = 2000,
  placeholder,
  tall = false,
}) {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef(value);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });

  // Sync external `value` changes (like clicking "Use template", "Edit", or "Cancel") into the editor DOM
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      el.innerHTML = markdownToHtml(value);
    } else if (!value && el.innerHTML !== "") {
      el.innerHTML = "";
    }
  }, [value]);

  // Initial mount render
  useEffect(() => {
    const el = editorRef.current;
    if (el && value) {
      el.innerHTML = markdownToHtml(value);
    }
  }, []);

  function updateToolbarState() {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    } catch {}
  }

  function emitChange() {
    const el = editorRef.current;
    if (!el) return;
    const md = htmlToMarkdown(el).slice(0, maxLength);
    lastEmittedRef.current = md;
    onChange(md);
    updateToolbarState();
  }

  function runCmd(command, arg = null) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, arg);
    emitChange();
  }

  function handleCode() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const selectedText = sel && sel.toString() ? sel.toString() : "code";
    document.execCommand(
      "insertHTML",
      false,
      `<code class="rounded bg-[#eef3ef] px-1.5 py-0.5 font-mono text-[0.9em] text-[#14632f]">${escapeHtml(
        selectedText
      )}</code>&nbsp;`
    );
    emitChange();
  }

  function handleLink() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const selectedText = sel && sel.toString() ? sel.toString() : "link";
    const url = window.prompt("Enter link URL:", "https://");
    if (!url || url === "https://") return;
    document.execCommand(
      "insertHTML",
      false,
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-700 underline">${escapeHtml(
        selectedText
      )}</a>&nbsp;`
    );
    emitChange();
  }

  const tools = [
    { label: "Bold", Icon: Bold, active: activeFormats.bold, action: () => runCmd("bold") },
    { label: "Italic", Icon: Italic, active: activeFormats.italic, action: () => runCmd("italic") },
    { label: "Underline", Icon: Underline, active: activeFormats.underline, action: () => runCmd("underline") },
    null,
    { label: "Bulleted list", Icon: List, active: activeFormats.ul, action: () => runCmd("insertUnorderedList") },
    { label: "Numbered list", Icon: ListOrdered, active: activeFormats.ol, action: () => runCmd("insertOrderedList") },
    null,
    { label: "Link", Icon: LinkIcon, active: false, action: handleLink },
    { label: "Code", Icon: Code, active: false, action: handleCode },
  ];

  const isEmpty = !value || !value.trim();

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-line bg-[#f6f9f7] px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        {tools.map((tool, i) =>
          tool ? (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={tool.active}
              onMouseDown={(e) => {
                // Keep selection inside contentEditable when clicking toolbar buttons
                e.preventDefault();
                tool.action();
              }}
              className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg transition ${
                tool.active
                  ? "bg-brand-600 text-white shadow-2xs"
                  : "text-ink/80 hover:bg-white hover:text-ink"
              }`}
            >
              <tool.Icon size={17} strokeWidth={2.1} />
            </button>
          ) : (
            <span key={i} className="mx-1.5 h-5 w-px bg-line" aria-hidden="true" />
          )
        )}
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-4 top-3 text-[14.5px] sm:text-[15px] text-muted select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          className={`block w-full overflow-y-auto px-4 py-3 text-[14.5px] sm:text-[15px] leading-relaxed text-ink outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_strong]:font-bold [&_b]:font-bold [&_u]:underline [&_em]:italic [&_i]:italic ${
            tall ? "min-h-[380px]" : "min-h-[180px]"
          }`}
        />
      </div>

      <p className="px-4 pb-2 text-right text-[12px] text-muted">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
