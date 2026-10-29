"use client";

import { useEffect } from "react";

/** Closes a popover when anything outside its own toggle button is clicked (toggles stop propagation). */
export function useCloseOnOutsideClick(open, close) {
  useEffect(() => {
    if (!open) return;
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open, close]);
}
