"use client";

import { useState } from "react";
import { Target, Check, X, Plus } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function FocusPanel({ title, date, bare = false }) {
  const { focusItems, addFocus, toggleFocus, deleteFocus } = useApp();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const items = focusItems.filter((item) => item.focusDate === date);
  const doneCount = items.filter((i) => i.done).length;

  async function submit(event) {
    event.preventDefault();
    if (await addFocus(text, date)) setText("");
  }

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          {!bare && <Target size={18} strokeWidth={2.2} className="text-brand-600" />}
          <span className="text-[13px] font-semibold text-ink">
            {doneCount} of {items.length} completed
          </span>
        </div>
        <button
          className="rounded-lg bg-[#f0f3f1] px-2.5 py-1 text-[12px] font-medium text-ink/75 hover:bg-[#e6ebe8] hover:text-ink transition"
          onClick={() => setEditing((value) => !value)}
        >
          {editing ? "Done" : "Edit items"}
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2.5 rounded-lg border border-line/60 bg-white p-2.5 shadow-xs transition hover:border-brand-200"
          >
            <button
              className="check-box shrink-0"
              aria-pressed={item.done}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              onClick={() => toggleFocus(item)}
            >
              {item.done && <Check size={14} strokeWidth={3.2} />}
            </button>
            <span
              className={`flex-1 text-[13.5px] leading-snug break-words ${
                item.done ? "text-ink/40 line-through" : "text-ink/90 font-medium"
              }`}
            >
              {item.title}
            </span>
            {editing && (
              <button
                className="dots-btn shrink-0 text-red-500 hover:bg-red-50"
                onClick={() => deleteFocus(item)}
                aria-label="Remove"
              >
                <X size={15} />
              </button>
            )}
          </li>
        ))}
        {!items.length && (
          <li className="rounded-lg border border-dashed border-line/80 p-5 text-center text-[13px] text-muted">
            No focus items set for today yet.
          </li>
        )}
      </ul>

      {editing ? (
        <form onSubmit={submit} className="flex gap-2 pt-1">
          <input
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a focus goal..."
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-brand-500"
          />
          <button className="btn-primary btn-compact">Add</button>
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-[12.5px] font-medium text-muted hover:border-brand-300 hover:text-brand-700 hover:bg-[#f6faf7] transition"
        >
          <Plus size={14} /> Add new focus goal
        </button>
      )}
    </div>
  );

  if (bare) return content;
  return <section className="panel rounded-xl px-5 py-4">{content}</section>;
}
