"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { copyText } from "@/lib/clipboard";

/**
 * Copies `text` (a string, or a function returning one, possibly async, for values fetched only when asked for).
 * With a `label` it is a labelled button; without, a small icon button. `className` can restyle the icon button.
 */
export default function CopyButton({ text, label, className = "" }) {
  const { notify } = useApp();
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const value = typeof text === "function" ? await text() : text;
    if (value == null) return;
    if (!(await copyText(value))) return notify("Could not copy. Select the text and copy it by hand.");
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1500);
  }

  const Icon = done ? Check : Copy;
  if (label) {
    return (
      <button type="button" className={`btn-secondary btn-compact ${className}`} onClick={copy}>
        <Icon size={15} /> {done ? "Copied" : label}
      </button>
    );
  }
  return (
    <button type="button" className={`dots-btn ${className}`} onClick={copy} aria-label="Copy">
      <Icon size={14} />
    </button>
  );
}
