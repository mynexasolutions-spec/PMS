// Local-time date helpers shared by the client components ("YYYY-MM-DD" strings in, strings out).

export function pad(value) {
  return String(value).padStart(2, "0");
}

export function toLocalDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(value, days) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** "09:00" -> "9:00" */
export function formatTime(value) {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  return `${Number(hours)}:${minutes}`;
}

export function formatTimeRange(start, end) {
  if (!start) return "Anytime";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

const fmt = (options) => new Intl.DateTimeFormat("en-GB", options);

const stampDay = fmt({ day: "numeric", month: "short" });
const stampTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const stampFull = fmt({ dateStyle: "full", timeStyle: "short" });

/**
 * A database timestamp ("2026-10-28 20:15:00", stored as UTC) as { label: "Today, 8:15 PM", full } in the viewer's time zone.
 * Uses the current time, so call it from client-only renders (after a fetch), not during server rendering.
 */
export function stamp(createdAt) {
  const date = new Date(`${createdAt.replace(" ", "T")}Z`);
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(new Date()) - midnight(date)) / 86_400_000);
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : stampDay.format(date);
  return { label: `${day}, ${stampTime.format(date)}`, full: stampFull.format(date) };
}

// "Wednesday, 28 October" / "Wednesday, 28 October 2026"
export function longDate(value, withYear = false) {
  const date = parseLocalDate(value);
  const weekday = fmt({ weekday: "long" }).format(date);
  const rest = fmt({ day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(date);
  return `${weekday}, ${rest}`;
}
