"use client";

import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import ColorPicker, { rememberColor } from "@/components/sticky/ColorPicker";
import { categoryMeta } from "@/components/sticky/categories";
import { STICKY_CATEGORIES } from "@/lib/constants";

const MAX_LENGTH = 500;

export default function StickyModal() {
  const { setStickyModalOpen, createSticky } = useApp();
  const [text, setText] = useState("");
  const [color, setColor] = useState("yellow");
  const [category, setCategory] = useState(null);
  const close = () => setStickyModalOpen(false);

  async function submit(event) {
    event.preventDefault();
    if (await createSticky(text, color, category)) {
      rememberColor(color);
      close();
    }
  }

  return (
    <Modal
      size="wide"
      icon={<StickyNote size={30} strokeWidth={1.8} />}
      eyebrow="Sticky note"
      title="Add a quick reminder"
      subtitle="Write down your note and choose a color."
      onClose={close}
    >
      <form onSubmit={submit} className="grid gap-5">
        <div className="field">
          <div className="flex items-baseline justify-between">
            <label htmlFor="sticky-text" className="text-[15px] font-bold text-ink">
              Note
            </label>
            <span className="text-[14px] font-normal text-muted">
              {text.length}/{MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="sticky-text"
            required
            autoFocus
            rows={4}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. Deploy the staging build before 5 PM"
            className="!rounded-xl !border-brand-300 !px-4 !py-3 !text-[16px]"
          />
        </div>

        <div>
          <p className="mb-2 text-[15px] font-bold">Color</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <p className="mb-2 text-[15px] font-bold">
            Category <span className="font-normal text-muted">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {STICKY_CATEGORIES.map((id) => {
              const { label, Icon, chip } = categoryMeta[id];
              const selected = category === id;
              return (
                <button
                  type="button"
                  key={id}
                  aria-pressed={selected}
                  onClick={() => setCategory(selected ? null : id)}
                  className={`inline-flex h-[38px] items-center gap-2 rounded-lg px-3.5 text-[14px] font-semibold transition ${chip} ${selected ? "ring-2 ring-current" : "opacity-80 hover:opacity-100"}`}
                >
                  <Icon /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className="btn-secondary h-[46px] px-7 text-[15px]" onClick={close}>
            Cancel
          </button>
          <button className="btn-primary h-[46px] px-6 text-[15px]">
            <Plus size={18} /> Add note
          </button>
        </div>
      </form>
    </Modal>
  );
}
