"use client";

import { ShieldCheck, FolderKanban, ChartColumn, CalendarDays } from "lucide-react";
import { useApp } from "@/components/AppProvider";

function Spark({ color }) {
  const heights = [11, 17, 23, 30];
  const opacity = [0.35, 0.55, 0.78, 1];
  return (
    <div className="flex h-[30px] items-end gap-[4px]">
      {heights.map((h, i) => (
        <span key={i} className="w-[6px] rounded-sm" style={{ height: h, background: color, opacity: opacity[i] }} />
      ))}
    </div>
  );
}

function Card({ icon: Icon, tile, iconColor, spark, label, value, foot }) {
  return (
    <div className="panel relative flex h-[105px] items-center gap-4 px-5">
      <div
        className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl shadow-[0_6px_14px_-4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.8)]"
        style={{ background: tile, color: iconColor }}
      >
        <Icon size={30} strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1 whitespace-nowrap">
        <p className="text-[15px] text-ink/85">{label}</p>
        <p className="text-[30px] font-bold leading-tight tracking-tight">{value}</p>
      </div>
      {/* Pinned to the corners so they never squeeze the label/value. */}
      <div className="absolute right-5 top-[16px]">
        <Spark color={spark} />
      </div>
      <span className="absolute bottom-[13px] right-5 whitespace-nowrap text-[12.5px] text-muted">{foot}</span>
    </div>
  );
}

export default function StatCards() {
  const { tasks, projects, completed, progress, active, deadlineDays, deadlineLabel, nextDeadline } = useApp();
  const activeProjects = projects.filter((project) => project.stage !== "complete").length;

  return (
    <section className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4" aria-label="Company summary">
      <Card
        icon={ShieldCheck}
        tile="linear-gradient(145deg,#e3f7e8,#b9e8c6)"
        iconColor="#1f7a42"
        spark="#58c07a"
        label="Tasks completed"
        value={`${completed} / ${tasks.length}`}
        foot={`${progress}% done`}
      />
      <Card
        icon={FolderKanban}
        tile="linear-gradient(145deg,#e8eeff,#cbd8ff)"
        iconColor="#3558d6"
        spark="#7c9cf5"
        label="Active projects"
        value={String(activeProjects)}
        foot={`Of ${projects.length} projects`}
      />
      <Card
        icon={ChartColumn}
        tile="linear-gradient(145deg,#ffefd2,#fcd69a)"
        iconColor="#d97706"
        spark="#f6b04a"
        label="Active tasks"
        value={String(active)}
        foot="Across all projects"
      />
      <Card
        icon={CalendarDays}
        tile="linear-gradient(145deg,#f1e8fd,#dccaf8)"
        iconColor="#7c3aed"
        spark="#a98bea"
        label="Next deadline"
        value={deadlineDays === null ? "None" : deadlineDays <= 1 ? deadlineLabel : `${deadlineDays} days`}
        foot={nextDeadline?.issueKey ?? "Nothing due"}
      />
    </section>
  );
}
