"use client";

import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import ColorPicker, { rememberColor } from "@/components/sticky/ColorPicker";
import { stickyTone } from "@/components/sticky/tones";
import { categoryMeta } from "@/components/sticky/categories";
import { STICKY_CATEGORIES, STICKY_COLORS } from "@/lib/constants";

const MAX_LENGTH = 2000;

const COLOR_LABELS = {
  yellow: "Yellow",
  green: "Green",
  pink: "Pink",
  blue: "Blue",
  orange: "Orange",
  purple: "Purple",
  teal: "Teal",
  red: "Red",
  lime: "Lime",
  grey: "Grey",
};

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
      compact
      icon={<StickyNote size={22} strokeWidth={1.8} />}
      eyebrow="Sticky note"
      title="Add a quick reminder"
      subtitle="Write down your note and choose a color."
      onClose={close}
    >
      <form onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-3.5">
        <div className="field min-w-0">
          <div className="flex items-baseline justify-between">
            <label htmlFor="sticky-text" className="text-[13.5px] sm:text-[14px] font-bold text-ink">
              Note
            </label>
            <span className="text-[12px] sm:text-[13px] font-normal text-muted">
              {text.length}/{MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="sticky-text"
            required
            autoFocus
            rows={3}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. Deploy the staging build before 5 PM"
            className="w-full min-w-0 !rounded-xl !border-brand-300 !px-3.5 !py-2 sm:!px-4 sm:!py-2.5 !text-[14px] sm:!text-[15px]"
          />
        </div>

        {/* Mobile Side-by-Side Native Color Dropdown + Category Dropdown (<sm) */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          <div className="min-w-0">
            <p className="mb-1.5 text-[13px] font-bold text-ink">Color</p>
            <div className="relative flex items-center">
              <span
                className="pointer-events-none absolute left-3 h-3.5 w-3.5 shrink-0 rounded-full border border-black/20 shadow-2xs"
                style={{ background: stickyTone(color).body[1] }}
              />
              <select
                value={STICKY_COLORS.includes(color) ? color : "yellow"}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Select note color"
                className="h-[38px] w-full rounded-xl border border-line bg-white pl-8 pr-2.5 text-[13px] font-semibold text-ink shadow-2xs outline-none focus:border-brand-500"
              >
                {STICKY_COLORS.map((name) => (
                  <option key={name} value={name}>
                    {COLOR_LABELS[name] || name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-1.5 text-[13px] font-bold text-ink">
              Category <span className="font-normal text-muted text-[11.5px]">(opt)</span>
            </p>
            <select
              value={category ?? ""}
              onChange={(e) => setCategory(e.target.value || null)}
              aria-label="Select category"
              className="h-[38px] w-full rounded-xl border border-line bg-white px-2.5 text-[13px] font-semibold text-ink shadow-2xs outline-none focus:border-brand-500"
            >
              <option value="">None</option>
              {STICKY_CATEGORIES.map((id) => (
                <option key={id} value={id}>
                  {categoryMeta[id].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Color Picker & 1-Line Category Pills (sm+) */}
        <div className="hidden sm:block">
          <p className="mb-1.5 text-[14px] font-bold">Color</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="hidden sm:block">
          <p className="mb-1.5 text-[14px] font-bold">
            Category <span className="font-normal text-muted">(optional)</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {STICKY_CATEGORIES.map((id) => {
              const { label, Icon, chip } = categoryMeta[id];
              const selected = category === id;
              return (
                <button
                  type="button"
                  key={id}
                  aria-pressed={selected}
                  onClick={() => setCategory(selected ? null : id)}
                  className={`inline-flex h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap transition ${chip} ${selected ? "ring-2 ring-current" : "opacity-80 hover:opacity-100"}`}
                >
                  <Icon /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 sm:gap-3 pt-1">
          <button
            type="button"
            className="btn-secondary flex-1 sm:flex-initial justify-center h-[38px] sm:h-[40px] px-4 sm:px-6 text-[13.5px] sm:text-[14px]"
            onClick={close}
          >
            Cancel
          </button>
          <button className="btn-primary flex-1 sm:flex-initial justify-center h-[38px] sm:h-[40px] px-4 sm:px-5 text-[13.5px] sm:text-[14px]">
            <Plus size={16} /> Add note
          </button>
        </div>
      </form>
    </Modal>
  );
}
