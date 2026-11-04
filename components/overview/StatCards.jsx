"use client";

import { ShieldCheck, FolderKanban, ChartColumn, CalendarDays } from "lucide-react";
import { useApp } from "@/components/AppProvider";

function Spark({ color }) {
  const heights = [11, 17, 23, 30];
  const opacity = [0.35, 0.55, 0.78, 1];
  return (
    <div className="flex h-[24px] sm:h-[30px] shrink-0 items-end gap-[3px] sm:gap-[4px] scale-90 sm:scale-100 origin-bottom-right">
      {heights.map((h, i) => (
        <span key={i} className="w-[5px] sm:w-[6px] rounded-sm" style={{ height: h, background: color, opacity: opacity[i] }} />
      ))}
    </div>
  );
}

function Card({ icon: Icon, tile, iconColor, spark, label, value, foot }) {
  return (
    <div className="panel flex flex-col justify-between min-w-0 p-3.5 sm:p-5 transition hover:shadow-md active:scale-[0.99]">
      <div className="flex items-center justify-between gap-2">
        <div
          className="grid h-9 w-9 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
          style={{ background: tile, color: iconColor }}
        >
          <Icon size={18} strokeWidth={1.9} className="sm:h-6 sm:w-6" />
        </div>
        <Spark color={spark} />
      </div>

      <div className="mt-2.5 sm:mt-4 min-w-0">
        <p className="text-[20px] sm:text-[28px] font-extrabold leading-tight tracking-tight text-ink truncate">
          {value}
        </p>
        <p className="mt-0.5 sm:mt-1 text-[12.5px] sm:text-[14px] font-semibold text-ink/85 truncate">
          {label}
        </p>
        {foot && (
          <p className="mt-0.5 text-[11px] sm:text-[12px] text-muted truncate">
            {foot}
          </p>
        )}
      </div>
    </div>
  );
}

export default function StatCards() {
  const { tasks, projects, completed, progress, active, deadlineDays, deadlineLabel, nextDeadline, isMember, myTasks, myProjects } = useApp();
  const currentTasks = myTasks;
  const currentProjects = myProjects;
  const doneCount = currentTasks.filter((t) => t.status === "done").length;
  const activeCount = currentTasks.filter((t) => t.status === "progress").length;
  const progressPct = currentTasks.length ? Math.round((doneCount / currentTasks.length) * 100) : 0;
  const activeProjects = currentProjects.filter((project) => project.stage !== "complete").length;

  return (
    <section
      className="grid grid-cols-2 gap-2.5 sm:gap-[14px] xl:grid-cols-4"
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
        foot="Assigned to you"
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
