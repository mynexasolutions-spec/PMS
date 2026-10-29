"use client";

import { CalendarCheck } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { pad } from "@/lib/datetime";

const monthName = new Intl.DateTimeFormat("en", { month: "long" });

export default function DeadlineCard() {
  const { nextDeadline: task, deadlineLabel, deadlineProgress } = useApp();
  const due = task ? new Date(task.dueAt) : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#d6ebdb] bg-gradient-to-br from-[#f6fcf7] via-[#e9f7ed] to-[#d3efdb] p-5 shadow-card">
      <svg viewBox="0 0 300 130" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <path d="M120 130 C150 60 200 20 300 10 V130Z" fill="#9fdcb4" opacity=".28" />
        <path d="M190 130 C220 80 250 55 300 48 V130Z" fill="#7fcf9b" opacity=".25" />
      </svg>

      <div className="relative">
        <div className="flex items-start gap-3">
          <CalendarCheck size={34} strokeWidth={1.6} className="mt-0.5 shrink-0 text-brand-800" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] text-ink/75">Upcoming Deadline</p>
            <p className="text-[18px] font-bold tracking-tight">{task ? task.title : "Nothing due. Nice work!"}</p>
          </div>
          {task && (
            <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-[14px] font-semibold shadow-[0_2px_8px_rgba(20,80,40,0.12)]">{deadlineLabel}</span>
          )}
        </div>

        {task && (
          <>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-[42px] font-extrabold leading-none tracking-tight">{pad(due.getDate())}</span>
              <div className="pb-0.5 leading-tight">
                <p className="text-[16px] font-bold">{monthName.format(due)}</p>
                <p className="text-[13px] text-ink/70">{task.projectName}</p>
              </div>
            </div>
            <div className="mt-2.5 h-[6px] rounded-full bg-white/70">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2c9d57] to-[#14632f]" style={{ width: `${deadlineProgress}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-ink/75">
              {task.issueKey} · {task.projectName} is {deadlineProgress}% complete.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
