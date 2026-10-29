import { HEX_COLOR_RE } from "@/lib/constants";

// A tone is { body: paper gradient [top, bottom], flap: curled-corner shades [fold edge, middle, tip], pin }.

const parse = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};
const mix = (hex, target, amount) =>
  `#${parse(hex)
    .map((channel, i) => Math.round(channel + (target[i] - channel) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

/** Builds a pastel paper tone from any base colour, so even a dark pick keeps the note text readable. */
export function deriveTone(base) {
  return {
    body: [mix(base, WHITE, 0.72), mix(base, WHITE, 0.5)],
    flap: [mix(base, WHITE, 0.88), mix(base, WHITE, 0.35), mix(base, BLACK, 0.1)],
    pin: mix(base, BLACK, 0.18),
  };
}

export const stickyTones = {
  yellow: { body: ["#fff4c4", "#fbe79c"], flap: ["#fffbe3", "#f7de82", "#e6c25a"], pin: "#f0932b" },
  green: { body: ["#e0f5da", "#cdeac8"], flap: ["#f4fcf1", "#bde0b8", "#9ccd98"], pin: "#2e9e4f" },
  pink: { body: ["#fedde2", "#f9cbd3"], flap: ["#fff2f4", "#f3b6c1", "#e39aa9"], pin: "#e03a4f" },
  blue: { body: ["#d9edfc", "#c3e0f8"], flap: ["#f0f8ff", "#acd3f3", "#8dbde8"], pin: "#2b6fd6" },
  orange: deriveTone("#f59e42"),
  purple: deriveTone("#a78bfa"),
  teal: deriveTone("#2dd4bf"),
  red: deriveTone("#f87171"),
  lime: deriveTone("#a3e635"),
  grey: deriveTone("#94a3b8"),
};

/** Tone for a stored colour: a preset name or a custom "#rrggbb". */
export function stickyTone(color) {
  return stickyTones[color] ?? (HEX_COLOR_RE.test(color ?? "") ? deriveTone(color) : stickyTones.yellow);
}
