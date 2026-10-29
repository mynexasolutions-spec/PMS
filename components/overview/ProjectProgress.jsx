"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { StageChip } from "@/components/projects/stages";

function Ring({ percent }) {
  const r = 82;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[180px] w-[180px] shrink-0 place-items-center">
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
      <div className="grid h-[148px] w-[148px] place-items-center rounded-full bg-white shadow-[0_2px_16px_rgba(20,80,40,0.14)]">
        <div className="text-center leading-tight">
          <p className="text-[38px] font-bold tracking-tight">{percent}%</p>
          <p className="text-[16px] text-ink/80">Complete</p>
        </div>
      </div>
    </div>
  );
}

function PhaseBadge({ n, done, current }) {
  const tone = done ? "bg-brand-700 text-white" : current ? "bg-[#cdeed4] text-brand-800" : "bg-[#eceeed] text-ink/80";
  return <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[15px] font-bold ${tone}`}>{done ? <Check size={16} strokeWidth={3} /> : n}</span>;
}

export default function ProjectProgress() {
  const { progress, projectProgress } = useApp();

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3.5">
        <div>
          <p className="eyebrow">All projects</p>
          <h2 className="text-[21px] font-bold tracking-tight">Project progress</h2>
        </div>
        <Link href="/tasks" className="ml-auto inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline">
          All tasks <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-3 flex flex-col items-center gap-8 md:flex-row">
        <div className="md:pl-3">
          <Ring percent={progress} />
        </div>
        <ul className="w-full flex-1 space-y-[13px] md:border-l md:border-line md:pl-8">
          {projectProgress.map(({ project, total, done, percent }, index) => {
            const complete = total > 0 && percent === 100;
            const current = percent > 0 && percent < 100;
            return (
              <li key={project.id} className="flex items-center gap-3.5">
                <PhaseBadge n={index + 1} done={complete} current={current} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[15px] font-semibold leading-tight">{project.name}</p>
                    <StageChip stage={project.stage} />
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{done} of {total} tasks done</p>
                  {current && (
                    <div className="mt-1.5 h-[6px] rounded-full bg-[#e8ecea]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#3cb865] to-[#1f8a4c]" style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </div>
                <span className="w-[44px] text-right text-[14px] text-ink/80">{percent}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
