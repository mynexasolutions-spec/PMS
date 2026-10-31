"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const widths = {
  narrow: "max-w-[460px]",
  default: "max-w-[580px]",
  wide: "max-w-[720px]",
};

export default function Modal({
  eyebrow,
  title,
  subtitle,
  icon,
  onClose,
  children,
  size = "default",
  compact = false,
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-3 sm:p-5 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`my-auto w-full ${
          compact ? "rounded-2xl p-5" : "rounded-3xl p-6"
        } bg-white shadow-2xl ${widths[size]} animate-in zoom-in-95 duration-150`}
      >
        <div className={`${compact ? "mb-3" : "mb-5"} flex items-start gap-3`}>
          {icon && (
            <div
              className={`grid ${
                compact ? "h-[46px] w-[46px]" : "h-[60px] w-[60px]"
              } shrink-0 place-items-center rounded-2xl bg-[#e8f7ec] text-brand-600`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`${
                compact ? "text-[11.5px]" : "text-[13px]"
              } font-semibold uppercase tracking-[0.2em] text-ink/60`}
            >
              {eyebrow}
            </p>
            <h2
              className={`mt-0.5 ${
                compact ? "text-[19px] sm:text-[20px]" : "text-[24px]"
              } font-bold leading-tight tracking-tight`}
            >
              {title}
            </h2>
            {subtitle && (
              <p className={`mt-0.5 ${compact ? "text-[13.5px]" : "text-[15px]"} text-muted`}>
                {subtitle}
              </p>
            )}
          </div>
          <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
