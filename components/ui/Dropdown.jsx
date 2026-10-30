"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useCloseOnOutsideClick } from "./useCloseOnOutsideClick";

/** A button that shows the current choice and opens a list of options. */
export default function Dropdown({ label, value, options, onChange, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));
  const current = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
        className={`inline-flex h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-3 text-[14px] font-medium shadow-[0_1px_3px_rgba(16,60,35,0.05)] transition hover:bg-[#f6faf7] ${className}`}
      >
        {label && <span className="text-ink/70 shrink-0">{label}:</span>}
        <span className="truncate">{current?.label}</span>
        <ChevronDown size={15} className="shrink-0 text-muted" />
      </button>
      {open && (
        <div
          className={`menu-popover ${align === "right" ? "right-0 left-auto" : "left-0 right-auto"} min-w-[210px] max-w-[280px]`}
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check size={16} className="ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
