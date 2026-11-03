import { Briefcase, Pin, User, Lightbulb, Bell, AlertCircle } from "lucide-react";

// Sticky-note categories: label, filter-chip colours and a small icon (used by the modal and the Sticky Notes page).
export const categoryMeta = {
  important: {
    label: "Important",
    chip: "bg-[#fde4e9] text-[#e11d48]",
    Icon: ({ size = 16 }) => <Pin size={size} fill="currentColor" className="rotate-45" />,
    // The little red "!" badge shown on a note itself.
    NoteIcon: ({ size = 18 }) => (
      <span className="grid place-items-center rounded-full bg-current" style={{ width: size, height: size }}>
        <span className="text-[11px] font-extrabold leading-none text-white">!</span>
      </span>
    ),
  },
  work: {
    label: "Work",
    chip: "bg-[#e8edf3] text-[#1f2a37]",
    Icon: ({ size = 16 }) => <Briefcase size={size} fill="currentColor" />,
    NoteIcon: ({ size = 17 }) => <Briefcase size={size} fill="currentColor" />,
  },
  personal: {
    label: "Personal",
    chip: "bg-[#fdefcf] text-[#b45309]",
    Icon: ({ size = 16 }) => <User size={size} fill="currentColor" />,
    NoteIcon: ({ size = 17 }) => <User size={size} fill="currentColor" />,
  },
  ideas: {
    label: "Ideas",
    chip: "bg-[#e8f6ec] text-[#2d7a45]",
    Icon: ({ size = 16 }) => <Lightbulb size={size} fill="currentColor" />,
    NoteIcon: ({ size = 17 }) => <Lightbulb size={size} fill="currentColor" />,
  },
  reminders: {
    label: "Reminders",
    chip: "bg-[#eff6ff] text-[#1d4ed8]",
    Icon: ({ size = 16 }) => <Bell size={size} fill="currentColor" />,
    NoteIcon: ({ size = 17 }) => <Bell size={size} fill="currentColor" />,
  },
  urgent: {
    label: "Urgent",
    chip: "bg-[#fef2f2] text-[#b91c1c]",
    Icon: ({ size = 16 }) => <AlertCircle size={size} fill="currentColor" />,
    NoteIcon: ({ size = 17 }) => <AlertCircle size={size} fill="currentColor" />,
  },
};
