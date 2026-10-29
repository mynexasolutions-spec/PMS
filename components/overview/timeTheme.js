// Time-of-day looks for the greeting banner: sky, sun/moon and hill colours change with the hour.

export const THEMES = {
  morning: {
    greeting: "Good morning",
    emoji: "👋",
    sky: ["#e3f3ee", "#f5fbf7"],
    sun: { x: 470, y: 34, core: "#fff6d8", glow: "#fff4c6" },
    hills: ["#cde5dc", "#a8d3c1", "#7dbf9e", "#5aa87c"],
    tree: "#4f9b74",
    ink: "#3a5a4c",
    quote: "border-ink/50 text-ink/75",
  },
  afternoon: {
    greeting: "Good afternoon",
    emoji: "👋",
    sky: ["#d3eafa", "#f1f9fd"],
    sun: { x: 410, y: 22, core: "#fffbe2", glow: "#ffef9e" },
    hills: ["#cfe6e0", "#a2d4c0", "#74bf98", "#4fa575"],
    tree: "#3f8f66",
    ink: "#3a5a4c",
    clouds: true,
    quote: "border-ink/50 text-ink/75",
  },
  evening: {
    greeting: "Good evening",
    emoji: "🌇",
    sky: ["#f8c9ae", "#fdf0e4"],
    sun: { x: 520, y: 86, core: "#ffd9a0", glow: "#ffae6b" },
    hills: ["#e6cbc8", "#c9aab6", "#8fa691", "#5f8c70"],
    tree: "#3f6f58",
    ink: "#7a4b4b",
    quote: "border-[#7a4b4b]/50 text-[#5a3a3a]",
  },
  night: {
    greeting: "Working late",
    emoji: "🌙",
    sky: ["#12203b", "#2a4466"],
    sun: { x: 470, y: 36, core: "#f6f2dc", glow: "#9fb4e6" },
    moon: true,
    hills: ["#2b475c", "#223e4e", "#1b3541", "#14292f"],
    tree: "#0f2226",
    ink: "#cfd8e8",
    stars: [[250, 18], [300, 40], [345, 12], [395, 52], [430, 20], [520, 14], [560, 46], [610, 24], [655, 58], [700, 16], [740, 40], [330, 74]],
    quote: "border-white/50 text-white/85",
  },
};

/** 5-12 morning, 12-17 afternoon, 17-20 evening, otherwise night. No hour yet (server render) = morning. */
export function themeKey(hour) {
  if (hour === undefined || hour === null) return "morning";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}
