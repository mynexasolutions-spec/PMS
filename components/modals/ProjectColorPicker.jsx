"use client";

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { hexToHsl, hslToHex, isHex } from "@/lib/color";
import { PickerArea, ShadeSlider } from "@/components/sticky/ColorPicker";

export const PROJECT_COLORS = ["#16a34a", "#8fdc7a", "#4db6c6", "#5eb0ff", "#7367e0", "#bf86fb", "#ff7eb0", "#ff6b6b", "#ffab5e", "#fcd34d", "#b6bccb"];
export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0];

const RECENT_KEY = "nexa.project.recent";
const same = (a, b) => a?.toLowerCase() === b?.toLowerCase();

function loadRecent() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isHex) : [];
  } catch {
    return [];
  }
}

export function rememberProjectColor(color) {
  try {
    const next = [color, ...loadRecent().filter((value) => !same(value, color))].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: recent colours simply aren't remembered.
  }
}

// A white tick on dark swatches, a dark one on light swatches.
const tickClass = (hex) => (hexToHsl(hex).l > 68 ? "text-ink" : "text-white");

/** Eleven preset colours plus an eyedropper that opens a free colour picker. `value` is "#rrggbb". */
export default function ProjectColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null); // hex text while it's being typed
  const [recent] = useState(loadRecent);

  const hsl = hexToHsl(value);
  const recents = [...new Map([...recent, ...PROJECT_COLORS].map((color) => [color.toLowerCase(), color])).values()].slice(0, 10);

  function typeHex(text) {
    const withHash = text.startsWith("#") ? text : `#${text}`;
    setDraft(text);
    if (isHex(withHash)) onChange(withHash.toLowerCase());
  }

  return (
    <div>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {PROJECT_COLORS.map((color) => {
            const selected = same(value, color);
            return (
              <button
                type="button"
                key={color}
                title={color}
                aria-label={color}
                aria-pressed={selected}
                onClick={() => onChange(color)}
                className={`grid h-10 w-10 place-items-center rounded-xl transition hover:scale-105 ${selected ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}
                style={{ background: color }}
              >
                {selected && <Check size={20} strokeWidth={3} className={tickClass(color)} />}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Pick a custom colour"
            aria-expanded={open}
            title="Custom colour"
            onClick={() => setOpen((current) => !current)}
            className={`grid h-10 w-10 place-items-center rounded-xl border border-line bg-white shadow-[0_1px_3px_rgba(16,60,35,0.08)] transition hover:bg-[#f6faf7] ${open ? "ring-2 ring-brand-300" : ""}`}
          >
            <Pipette size={19} />
          </button>
        </div>

        {open && (
          <div className="absolute inset-x-0 top-full z-10 mt-3 rounded-2xl border border-line bg-white p-4 shadow-[0_20px_50px_-15px_rgba(16,60,35,0.4)]">
            <span className="absolute -top-[7px] right-[13px] h-3.5 w-3.5 rotate-45 border-l border-t border-line bg-white" />
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div>
                <PickerArea hsl={hsl} onChange={(next) => onChange(hslToHex(next))} />
                <ShadeSlider hsl={hsl} onChange={(next) => onChange(hslToHex(next))} />
              </div>

              <div>
                <p className="text-[14px] font-bold">Custom color</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="h-[44px] w-[96px] shrink-0 rounded-lg border border-line" style={{ background: value }} />
                  <input
                    value={draft ?? value.toUpperCase()}
                    onChange={(event) => typeHex(event.target.value)}
                    onBlur={() => setDraft(null)}
                    maxLength={7}
                    spellCheck={false}
                    aria-label="Hex colour"
                    className="h-[44px] w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[15px] font-medium uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                </div>

                <p className="mt-4 text-[14px] font-bold">Recent colors</p>
                <div className="mt-2 grid grid-cols-5 justify-items-start gap-2">
                  {recents.map((color) => {
                    const selected = same(value, color);
                    return (
                      <button
                        type="button"
                        key={color}
                        title={color}
                        aria-label={color}
                        aria-pressed={selected}
                        onClick={() => onChange(color)}
                        className={`grid h-[30px] w-[30px] place-items-center rounded-full transition hover:scale-105 ${selected ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}
                        style={{ background: color }}
                      >
                        {selected && <Check size={15} strokeWidth={3} className={tickClass(color)} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The popover floats over the modal, so keep room for it instead of letting it cover the buttons. */}
      {open && <div className="h-[262px]" aria-hidden="true" />}
    </div>
  );
}
