import { Flag, User } from "lucide-react";

// Note tags: label, chip colours and an optional icon (shown on the filter chips and on the notes themselves).
export const noteTags = {
  meeting: { label: "Meeting", chip: "bg-[#eef3ef] text-ink/80" },
  requirement: { label: "Requirement", chip: "bg-[#e6f0fd] text-[#1d4fb8]" },
  ideas: { label: "Ideas", chip: "bg-[#e8f6ec] text-[#2d7a45]" },
  links: { label: "Links", chip: "bg-[#e8f6ec] text-[#2d7a45]" },
  important: { label: "Important", chip: "bg-[#fde4e8] text-[#d63a3a]", Icon: Flag },
  personal: { label: "Personal", chip: "bg-[#f0e8fd] text-[#5b2bb0]", Icon: User },
};

export function TagChip({ tag, className = "" }) {
  const meta = noteTags[tag];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${meta.chip} ${className}`}>
      {meta.Icon && <meta.Icon size={13} fill="currentColor" />}
      {meta.label}
    </span>
  );
}
