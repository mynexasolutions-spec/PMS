"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";

export default function ConfirmDialog({ state, onClose }) {
  const [mounted, setMounted] = useState(false);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!state?.isOpen) return;

    // Auto-focus confirm button for rapid keyboard interaction
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Only trigger if not typing inside an input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== "textarea") {
          e.preventDefault();
          onClose?.(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state?.isOpen, onClose]);

  if (!mounted || !state?.isOpen) return null;

  const {
    mode = "confirm", // 'confirm' | 'alert'
    variant = "danger", // 'danger' | 'warning' | 'info' | 'error' | 'success'
    title = mode === "confirm" ? "Confirm Action" : "Notice",
    message = "",
    confirmText = mode === "confirm" ? "Confirm" : "Understood",
    cancelText = "Cancel",
  } = state;

  const isAlertMode = mode === "alert" || !cancelText;

  // Icon & Theme Styling Configuration
  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
      case "error":
        return {
          icon: variant === "danger" ? <Trash2 size={24} className="text-rose-600" /> : <AlertTriangle size={24} className="text-rose-600" />,
          badgeBg: "bg-rose-50 border-rose-100 text-rose-600 ring-4 ring-rose-50/60",
          btnBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-600/25 focus-visible:ring-rose-500",
        };
      case "warning":
        return {
          icon: <AlertCircle size={24} className="text-amber-600" />,
          badgeBg: "bg-amber-50 border-amber-100 text-amber-600 ring-4 ring-amber-50/60",
          btnBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm shadow-amber-600/25 focus-visible:ring-amber-500",
        };
      case "success":
        return {
          icon: <CheckCircle2 size={24} className="text-emerald-600" />,
          badgeBg: "bg-emerald-50 border-emerald-100 text-emerald-600 ring-4 ring-emerald-50/60",
          btnBg: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/25 focus-visible:ring-emerald-500",
        };
      case "info":
      default:
        return {
          icon: <Info size={24} className="text-brand-700" />,
          badgeBg: "bg-brand-50 border-brand-100 text-brand-700 ring-4 ring-brand-50/60",
          btnBg: "bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white shadow-sm shadow-brand-700/25 focus-visible:ring-brand-500",
        };
    }
  };

  const config = getVariantConfig();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-ink/45 backdrop-blur-[3px] animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-dialog-title"
    >
      <div
        className="relative my-auto w-full max-w-[440px] md:max-w-[470px] lg:max-w-[480px] 2xl:max-w-[500px] overflow-hidden rounded-2xl sm:rounded-3xl border border-line/80 bg-white p-5 sm:p-6 md:p-7 shadow-2xl animate-in zoom-in-95 duration-150 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon in corner */}
        <button
          type="button"
          onClick={() => onClose?.(false)}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-ink/40 hover:bg-black/5 hover:text-ink transition focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Close dialog"
        >
          <X size={17} />
        </button>

        <div className="flex items-start gap-4">
          {/* Badge Icon */}
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${config.badgeBg}`}
          >
            {config.icon}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id="platform-dialog-title"
              className="text-[18px] sm:text-[19px] md:text-[20px] font-bold text-ink leading-snug tracking-tight"
            >
              {title}
            </h3>
            <p className="mt-2 text-[13.5px] sm:text-[14.5px] text-muted leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons: Responsive across Mobile, Tablet, Laptop, and Ultrawide */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          {!isAlertMode && (
            <button
              type="button"
              onClick={() => onClose?.(false)}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl border border-line bg-white px-4 text-[14px] font-semibold text-ink/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-black/5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onClose?.(true)}
            className={`inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl px-5 text-[14px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${config.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
