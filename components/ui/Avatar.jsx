// A round initials badge. The colour is picked from the person's id so it stays the same everywhere.
const PALETTE = [
  ["#1b2b3a", "#ffffff"],
  ["#1f7a42", "#ffffff"],
  ["#2b5fd6", "#ffffff"],
  ["#7c3aed", "#ffffff"],
  ["#c2410c", "#ffffff"],
  ["#0f766e", "#ffffff"],
  ["#be185d", "#ffffff"],
  ["#4d5b6a", "#ffffff"],
];

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ user, name, id, size = 28, className = "", ring = false }) {
  const label = name ?? user?.name ?? user?.assigneeName ?? "";
  const colourKey = id ?? user?.id ?? 0;
  const [bg, fg] = PALETTE[Math.abs(Number(colourKey) || 0) % PALETTE.length];
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-grid shrink-0 select-none place-items-center rounded-full font-semibold ${ring ? "ring-2 ring-white" : ""} ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.max(10, Math.round(size * 0.4)) }}
    >
      {initials(label)}
    </span>
  );
}
