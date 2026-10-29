import { CalendarDays, Lightbulb, ListChecks, Users } from "lucide-react";

// Starting points for the editor. `tone` picks the colours of the card; the content uses the editor's markup.
export const TEMPLATES = [
  {
    id: "meeting",
    name: "Meeting Notes",
    description: "Structured meeting notes template",
    Icon: Users,
    tone: { tile: "bg-[#e0ecff] text-[#2b6fd6]", button: "bg-[#e6f0fd] text-[#1d4fb8] hover:bg-[#d8e8fc]" },
    tag: "meeting",
    title: "Meeting notes",
    content: "**Date:** \n**Attendees:** \n\n**Agenda**\n- \n\n**Discussion**\n- \n\n**Decisions**\n- \n\n**Action items**\n- ",
  },
  {
    id: "requirements",
    name: "Requirements",
    description: "Product requirement template",
    Icon: ListChecks,
    tone: { tile: "bg-[#d9f3df] text-[#1f7a42]", button: "bg-[#dcf3e1] text-[#1f6b3a] hover:bg-[#cdeed4]" },
    tag: "requirement",
    title: "Requirements",
    content: "**Overview**\n\n**Goals**\n- \n\n**Requirements**\n1. \n2. \n\n**Acceptance criteria**\n- \n\n**Open questions**\n- ",
  },
  {
    id: "weekly",
    name: "Weekly Sync",
    description: "Team sync template",
    Icon: CalendarDays,
    tone: { tile: "bg-[#ece3fb] text-[#7c3aed]", button: "bg-[#efe7fc] text-[#5b2bb0] hover:bg-[#e5d9fa]" },
    tag: "meeting",
    title: "Weekly sync",
    content: "**Wins this week**\n- \n\n**Blockers**\n- \n\n**Plans for next week**\n- \n\n**Shout-outs**\n- ",
  },
  {
    id: "ideas",
    name: "Ideas",
    description: "Capture and organize ideas",
    Icon: Lightbulb,
    tone: { tile: "bg-[#fdf0c4] text-[#c78a00]", button: "bg-[#fdf1cf] text-[#9a6f08] hover:bg-[#fbe9b4]" },
    tag: "ideas",
    title: "Idea",
    content: "**The idea**\n\n**Why it matters**\n- \n\n**What it needs**\n- \n\n**Next steps**\n1. ",
  },
];
