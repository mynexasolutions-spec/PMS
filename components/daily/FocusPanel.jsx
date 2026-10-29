"use client";

import { useState } from "react";
import { Target, Check, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function FocusPanel({ title, date }) {
  const { focusItems, addFocus, toggleFocus, deleteFocus } = useApp();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const items = focusItems.filter((item) => item.focusDate === date);

  async function submit(event) {
    event.preventDefault();
    if (await addFocus(text, date)) setText("");
  }

  return (
    <section className="panel rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <Target size={26} strokeWidth={1.9} className="text-brand-600" />
        <h3 className="text-[17px] font-bold tracking-tight">{title}</h3>
        <button className="ml-auto rounded-lg bg-[#f0f3f1] px-4 py-2 text-[14px] font-medium hover:bg-[#e6ebe8]" onClick={() => setEditing((value) => !value)}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3.5">
            <button
              className="check-box"
              aria-pressed={item.done}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              onClick={() => toggleFocus(item)}
            >
              {item.done && <Check size={15} strokeWidth={3.2} />}
            </button>
            <span className={`flex-1 text-[15.5px] ${item.done ? "text-ink/45 line-through" : ""}`}>{item.title}</span>
            {editing && (
              <button className="dots-btn" onClick={() => deleteFocus(item)} aria-label="Remove">
                <X size={16} />
              </button>
            )}
          </li>
        ))}
        {!items.length && <li className="text-[14px] text-muted">Nothing set yet. Click Edit to add your top priorities.</li>}
      </ul>

      {editing && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a focus item"
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-brand-500"
          />
          <button className="btn-primary btn-compact">Add</button>
        </form>
      )}
    </section>
  );
}
