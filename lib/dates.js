// All "today" logic runs in IST so the VPS timezone (usually UTC) doesn't shift the day.
const TZ = "Asia/Kolkata";

export function istDate(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

export function istHour(d = new Date()) {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(d);
  return Number(h) % 24;
}

const utc = (iso) => new Date(`${iso}T00:00:00Z`);

export function addDays(iso, n) {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing `iso`.
export function weekStart(iso) {
  return addDays(iso, -((utc(iso).getUTCDay() + 6) % 7));
}

export function daysBetween(fromIso, toIso) {
  return Math.round((utc(toIso) - utc(fromIso)) / 86400000);
}

const weekday = (iso) => utc(iso).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
const dayMonth = (iso, extra = {}) =>
  utc(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC", ...extra });

// "Wednesday, 28 October"
export function formatLong(iso) {
  return `${weekday(iso)}, ${dayMonth(iso)}`;
}

// "Wednesday, 28 October 2026"
export function formatFull(iso) {
  return `${weekday(iso)}, ${dayMonth(iso, { year: "numeric" })}`;
}
