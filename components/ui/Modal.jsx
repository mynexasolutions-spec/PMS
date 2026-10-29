"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const widths = { narrow: "max-w-[460px]", default: "max-w-[580px]", wide: "max-w-[640px]" };

export default function Modal({ eyebrow, title, subtitle, icon, onClose, children, size = "default" }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={`w-full rounded-3xl bg-white p-6 shadow-2xl ${widths[size]}`}>
        <div className="mb-5 flex items-start gap-4">
          {icon && <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl bg-[#e8f7ec] text-brand-600">{icon}</div>}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-ink/60">{eyebrow}</p>
            <h2 className="mt-0.5 text-[24px] font-bold leading-tight tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
