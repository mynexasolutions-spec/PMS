"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { StageChip } from "@/components/projects/stages";

function Ring({ percent }) {
  const r = 82;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[88px] w-[88px] sm:h-[128px] sm:w-[128px] md:h-[180px] md:w-[180px] shrink-0 place-items-center">
      <svg viewBox="0 0 180 180" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5cc47f" />
            <stop offset="1" stopColor="#14632f" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="16" stroke="#d3ecd9" />
        <circle
          cx="90" cy="90" r={r} fill="none" strokeWidth="16" strokeLinecap="round" stroke="url(#ringGrad)"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="grid h-[70px] w-[70px] sm:h-[104px] sm:w-[104px] md:h-[148px] md:w-[148px] place-items-center rounded-full bg-white shadow-[0_2px_16px_rgba(20,80,40,0.14)]">
        <div className="text-center leading-tight">
          <p className="text-[19px] sm:text-[26px] md:text-[38px] font-bold tracking-tight">{percent}%</p>
          <p className="text-[10px] sm:text-[12.5px] md:text-[16px] text-ink/80">Complete</p>
        </div>
      </div>
    </div>
  );
}

function PhaseBadge({ n, done, current }) {
  const tone = done ? "bg-brand-700 text-white" : current ? "bg-[#cdeed4] text-brand-800" : "bg-[#eceeed] text-ink/80";
  return (
    <span className={`hidden sm:grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[15px] font-bold ${tone}`}>
      {done ? <Check size={16} strokeWidth={3} /> : n}
    </span>
  );
}

export default function ProjectProgress() {
  const { projectProgress } = useApp();

  // Filter to user's active projects (excluding vault-only containers)
  const list = projectProgress.filter(({ project }) => !project.isVaultOnly);

  // Overall completion percent across user's projects
  const totalTasks = list.reduce((sum, item) => sum + item.total, 0);
  const doneTasks = list.reduce((sum, item) => sum + item.done, 0);
  const displayProgress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <section className="panel p-4 sm:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center gap-3.5">
        <div>
          <p className="eyebrow text-[11px] sm:text-[12.5px]">My Projects</p>
          <h2 className="text-[18px] sm:text-[21px] font-bold tracking-tight">Project progress</h2>
        </div>
        <Link href="/projects" className="ml-auto inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-brand-700 hover:underline">
          View all <ArrowRight size={15} />
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#fafcfb] py-10 text-center">
          <p className="text-[16px] font-bold text-ink">No projects yet</p>
          <p className="mt-1 max-w-[360px] text-[13.5px] text-muted">
            You are not part of any project teams yet. Create a project or get invited by an admin to track progress here.
          </p>
        </div>
      ) : (
        <div className="mt-3.5 sm:mt-4 flex flex-1 flex-row items-center gap-3.5 sm:gap-6 md:gap-8">
          <div className="flex flex-col items-center gap-1.5 md:pl-3">
            <Ring percent={displayProgress} />
            <span className="rounded-full bg-[#eef7f1] px-2 py-0.5 text-[10.5px] font-semibold text-brand-800 md:hidden">
              {doneTasks}/{totalTasks} done
            </span>
          </div>
          <ul className="min-w-0 flex-1 space-y-2.5 sm:space-y-[13px] border-l border-line pl-3.5 sm:pl-6 md:pl-8">
            {list.map(({ project, total, done, percent }, index) => {
              const complete = total > 0 && percent === 100;
              const current = percent > 0 && percent < 100;
              return (
                <li key={project.id} className="flex items-center gap-2.5 sm:gap-3.5">
                  <PhaseBadge n={index + 1} done={complete} current={current} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="truncate text-[13.5px] sm:text-[15px] font-semibold leading-tight hover:text-brand-700 hover:underline transition"
                        >
                          {project.name}
                        </Link>
                        <span className="hidden sm:inline-flex">
                          <StageChip stage={project.stage} />
                        </span>
                      </div>
                      <span className="shrink-0 text-right text-[12.5px] sm:text-[14px] font-semibold sm:font-normal text-ink/80">
                        {percent}%
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="text-[11.5px] sm:text-[13px] text-muted">
                        {done} of {total} tasks done
                      </p>
                      <span className="scale-90 origin-right sm:hidden">
                        <StageChip stage={project.stage} />
                      </span>
                    </div>
                    <div className="mt-1 sm:mt-1.5 h-[5px] sm:h-[6px] rounded-full bg-[#e8ecea]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3cb865] to-[#1f8a4c] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
