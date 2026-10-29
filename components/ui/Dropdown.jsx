"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useCloseOnOutsideClick } from "./useCloseOnOutsideClick";

/** A button that shows the current choice (as wide as its label, never cut off) and opens a list of options. */
export default function Dropdown({ label, value, options, onChange, className = "" }) {
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
        className={`inline-flex h-[44px] items-center gap-2.5 whitespace-nowrap rounded-xl border border-line bg-white px-4 text-[14.5px] font-medium shadow-[0_1px_3px_rgba(16,60,35,0.05)] transition hover:bg-[#f6faf7] ${className}`}
      >
        {label && <span className="text-ink/70">{label}:</span>}
        {current?.label}
        <ChevronDown size={16} className="shrink-0" />
      </button>
      {open && (
        <div className="menu-popover left-0 right-auto min-w-[210px]" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value && <Check size={16} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
