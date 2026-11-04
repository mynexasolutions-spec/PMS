"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const widths = {
  narrow: "max-w-[460px]",
  default: "max-w-[580px]",
  wide: "max-w-[720px]",
  extraWide: "max-w-[880px]",
  full: "max-w-[960px]",
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 p-3.5 sm:p-5 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`flex flex-col w-full max-h-[88dvh] sm:max-h-[90vh] overflow-hidden ${
          compact ? "rounded-2xl" : "rounded-2xl sm:rounded-3xl"
        } bg-white shadow-2xl border border-line/80 ${widths[size]} animate-in zoom-in-95 duration-150`}
      >
        <div
          className={`shrink-0 flex items-start gap-2.5 sm:gap-3 border-b border-line/60 ${
            compact ? "px-4 py-3 sm:px-5 sm:py-4" : "px-4 py-3 sm:px-6 sm:py-5"
          }`}
        >
          {icon && (
            <div
              className={`grid ${
                compact ? "h-9 w-9 sm:h-[46px] sm:w-[46px]" : "h-10 w-10 sm:h-[60px] sm:w-[60px]"
              } shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-[#e8f7ec] text-brand-600`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div
                className={`${
                  compact ? "text-[10.5px] sm:text-[11.5px]" : "text-[11px] sm:text-[13px]"
                } font-semibold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-ink/60`}
              >
                {eyebrow}
              </div>
            )}
            <h2
              className={`mt-0.5 ${
                compact ? "text-[15.5px] sm:text-[20px]" : "text-[16px] sm:text-[24px]"
              } font-bold leading-snug tracking-tight`}
            >
              {title}
            </h2>
            {subtitle && (
              <div className={`mt-0.5 ${compact ? "text-[11.5px] sm:text-[13.5px]" : "text-[12px] sm:text-[15px]"} text-muted leading-snug`}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            className="grid h-8 w-8 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink/70 shadow-2xs transition hover:bg-[#f6faf7]"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto overscroll-contain no-scrollbar sm:custom-scrollbar ${
            compact ? "px-4 pt-3.5 pb-4 sm:p-5" : "px-4 pt-3.5 pb-4 sm:p-6"
          }`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
