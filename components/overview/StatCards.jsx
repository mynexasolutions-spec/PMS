"use client";

import { ShieldCheck, FolderKanban, ChartColumn, CalendarDays } from "lucide-react";
import { useApp } from "@/components/AppProvider";

function Spark({ color }) {
  const heights = [11, 17, 23, 30];
  const opacity = [0.35, 0.55, 0.78, 1];
  return (
    <div className="flex h-[30px] shrink-0 items-end gap-[4px]">
      {heights.map((h, i) => (
        <span key={i} className="w-[6px] rounded-sm" style={{ height: h, background: color, opacity: opacity[i] }} />
      ))}
    </div>
  );
}

function Card({ icon: Icon, tile, iconColor, spark, label, value, foot }) {
  return (
    <div className="panel flex h-[100px] sm:h-[105px] w-[280px] shrink-0 snap-start sm:w-auto items-center justify-between gap-3 px-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div
          className="grid h-[52px] w-[52px] sm:h-[60px] sm:w-[60px] shrink-0 place-items-center rounded-2xl shadow-[0_6px_14px_-4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.8)]"
          style={{ background: tile, color: iconColor }}
        >
          <Icon size={28} strokeWidth={1.7} className="sm:h-[30px] sm:w-[30px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] sm:text-[14.5px] font-medium text-ink/85">{label}</p>
          <p className="truncate text-[20px] sm:text-[26px] 2xl:text-[28px] font-bold leading-tight tracking-tight">{value}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between self-stretch py-2">
        <Spark color={spark} />
        <span className="whitespace-nowrap text-[11.5px] sm:text-[12.5px] text-muted">{foot}</span>
      </div>
    </div>
  );
}

export default function StatCards() {
  const { tasks, projects, completed, progress, active, deadlineDays, deadlineLabel, nextDeadline, isMember, myTasks, myProjects } = useApp();
  const currentTasks = isMember ? myTasks : tasks;
  const currentProjects = isMember ? myProjects : projects;
  const doneCount = isMember ? currentTasks.filter((t) => t.status === "done").length : completed;
  const activeCount = isMember ? currentTasks.filter((t) => t.status === "progress").length : active;
  const progressPct = currentTasks.length ? Math.round((doneCount / currentTasks.length) * 100) : 0;
  const activeProjects = currentProjects.filter((project) => project.stage !== "complete").length;

  return (
    <section
      className="flex gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:gap-[14px] sm:grid-cols-2 2xl:grid-cols-4"
      aria-label="Company summary"
    >
      <Card
        icon={ShieldCheck}
        tile="linear-gradient(145deg,#e3f7e8,#b9e8c6)"
        iconColor="#1f7a42"
        spark="#58c07a"
        label="Tasks completed"
        value={`${doneCount} / ${currentTasks.length}`}
        foot={`${progressPct}% done`}
      />
      <Card
        icon={FolderKanban}
        tile="linear-gradient(145deg,#e8eeff,#cbd8ff)"
        iconColor="#3558d6"
        spark="#7c9cf5"
        label="Active projects"
        value={String(activeProjects)}
        foot={`Of ${currentProjects.length} projects`}
      />
      <Card
        icon={ChartColumn}
        tile="linear-gradient(145deg,#ffefd2,#fcd69a)"
        iconColor="#d97706"
        spark="#f6b04a"
        label="Active tasks"
        value={String(activeCount)}
        foot={isMember ? "Assigned to you" : "Across all projects"}
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
