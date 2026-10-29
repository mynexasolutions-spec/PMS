"use client";

import { useRef, useState } from "react";
import { Check, Pipette } from "lucide-react";
import { STICKY_COLORS } from "@/lib/constants";
import { hexToHsl, hslToHex, isHex } from "@/lib/color";
import { stickyTone } from "./tones";

const RECENT_KEY = "nexa.sticky.recent";
const DEFAULT_CUSTOM = "#22c55e";
const L_MAX = 85; // lightest / darkest the shade slider reaches
const L_MIN = 15;
const S_MIN = 20; // the picker's lower edge is the least saturated colour it offers

export function loadRecent() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((value) => STICKY_COLORS.includes(value) || isHex(value)) : [];
  } catch {
    return [];
  }
}

export function rememberColor(color) {
  try {
    const next = [color, ...loadRecent().filter((value) => value !== color)].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode / blocked storage: recent colours simply aren't remembered.
  }
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const swatchBase = "relative grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 transition";

function Swatch({ color, selected, onPick, size }) {
  return (
    <button
      type="button"
      title={color}
      aria-label={color}
      aria-pressed={selected}
      onClick={() => onPick(color)}
      className={`${size ?? swatchBase} ${selected ? "border-brand-500 ring-2 ring-brand-200" : "border-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:scale-105"}`}
      style={{ background: stickyTone(color).body[1] }}
    >
      {selected && <Check size={size ? 15 : 18} strokeWidth={2.6} className="text-ink" />}
    </button>
  );
}

/** Drag area: x = hue, y = saturation. */
export function PickerArea({ hsl, onChange }) {
  const ref = useRef(null);

  function move(event) {
    const rect = ref.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    onChange({ ...hsl, h: x * 360, s: 100 - y * (100 - S_MIN) });
  }

  return (
    <div
      ref={ref}
      role="presentation"
      className="relative h-[160px] cursor-crosshair touch-none rounded-xl"
      style={{
        background:
          "linear-gradient(to bottom, rgba(60,40,40,0), rgba(60,40,40,0.85)), linear-gradient(to right, #f33, #fd3, #3d5, #3dd, #35f, #e3f, #f33)",
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => event.buttons === 1 && move(event)}
    >
      <span
        className="pointer-events-none absolute h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{
          left: `${(hsl.h / 360) * 100}%`,
          top: `${((100 - hsl.s) / (100 - S_MIN)) * 100}%`,
          background: hslToHex(hsl),
        }}
      />
    </div>
  );
}

/** Shade slider: light on the left, dark on the right, in the current hue. */
export function ShadeSlider({ hsl, onChange }) {
  const ref = useRef(null);

  function move(event) {
    const rect = ref.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    onChange({ ...hsl, l: L_MAX - x * (L_MAX - L_MIN) });
  }

  return (
    <div
      ref={ref}
      role="presentation"
      className="relative mt-4 h-[14px] cursor-pointer touch-none rounded-full"
      style={{ background: `linear-gradient(to right, hsl(${hsl.h} ${hsl.s}% ${L_MAX}%), hsl(${hsl.h} ${hsl.s}% ${L_MIN}%))` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => event.buttons === 1 && move(event)}
    >
      <span
        className="pointer-events-none absolute top-1/2 h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{ left: `${((L_MAX - hsl.l) / (L_MAX - L_MIN)) * 100}%`, background: hslToHex(hsl) }}
      />
    </div>
  );
}

/** Ten preset swatches plus an eyedropper that opens a free colour picker. `value` is a preset name or "#rrggbb". */
export default function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null); // hex text while it's being typed
  const [recent] = useState(loadRecent);

  const custom = isHex(value);
  const hex = custom ? value : DEFAULT_CUSTOM;
  const hsl = hexToHsl(hex);
  const recents = [...new Set([...recent, ...STICKY_COLORS])].slice(0, 10);

  const setHsl = (next) => onChange(hslToHex(next));

  function typeHex(text) {
    const withHash = text.startsWith("#") ? text : `#${text}`;
    setDraft(text);
    if (isHex(withHash)) onChange(withHash.toLowerCase());
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        {STICKY_COLORS.map((name) => (
          <Swatch key={name} color={name} selected={value === name} onPick={onChange} />
        ))}
        <button
          type="button"
          aria-label="Pick a custom colour"
          aria-expanded={open}
          title="Custom colour"
          onClick={() => setOpen((current) => !current)}
          className={`${swatchBase} !rounded-xl border-brand-400 text-brand-800 ${open ? "ring-2 ring-brand-200" : ""}`}
          style={{ background: custom ? stickyTone(value).body[1] : "#eefaf1" }}
        >
          {custom && !open ? <Check size={18} strokeWidth={2.6} className="text-ink" /> : <Pipette size={18} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,60,35,0.25)]">
          <p className="mb-3 text-[15px] font-bold">Custom color</p>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div>
              <PickerArea hsl={hsl} onChange={setHsl} />
              <ShadeSlider hsl={hsl} onChange={setHsl} />
            </div>

            <div>
              <p className="text-[13px] text-ink/80">Selected color</p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="h-[42px] w-[78px] shrink-0 rounded-lg border border-line" style={{ background: stickyTone(hex).body[1] }} />
                <input
                  value={draft ?? hex.toUpperCase()}
                  onChange={(event) => typeHex(event.target.value)}
                  onBlur={() => setDraft(null)}
                  maxLength={7}
                  spellCheck={false}
                  aria-label="Hex colour"
                  className="h-[42px] w-full min-w-0 rounded-lg border border-line bg-white px-3 text-[15px] font-medium uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <p className="mt-4 text-[13px] text-ink/80">Recent colors</p>
              <div className="mt-2 grid grid-cols-5 justify-items-start gap-2">
                {recents.map((color) => (
                  <Swatch key={color} color={color} selected={value === color} onPick={onChange} size="relative grid h-[34px] w-[34px] place-items-center rounded-full border-2 transition" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
