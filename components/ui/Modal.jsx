"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const widths = { narrow: "max-w-[460px]", default: "max-w-[580px]", wide: "max-w-[640px]" };

export default function Modal({ eyebrow, title, subtitle, icon, onClose, children, size = "default" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 sm:p-6 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={`my-auto w-full rounded-3xl bg-white p-6 shadow-2xl ${widths[size]} animate-in zoom-in-95 duration-150`}>
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
    </div>,
    document.body
  );
}
