"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useApp } from "@/components/AppProvider";

const labels = ["M", "T", "W", "T", "F", "S", "S"];
const fullDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeekChart() {
  const { weekLoad } = useApp();
  const counts = weekLoad?.counts ?? [];

  return (
    <section className="panel flex flex-1 flex-col justify-between p-5">
      <div className="flex items-center justify-between pb-1">
        <div>
          <p className="eyebrow">Workload</p>
          <h2 className="text-[19px] sm:text-[20px] font-bold tracking-tight text-ink">This week</h2>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0f7f2] px-3 py-1.5 text-[13px] font-semibold text-brand-800 transition hover:bg-[#e2f2e6]"
        >
          View calendar <ArrowRight size={14} />
        </Link>
      </div>

      <div className="my-3 flex items-end justify-between gap-1.5 px-1 sm:gap-3 sm:px-2">
        {weekLoad.heights.map((height, index) => {
          const today = index === weekLoad.todayIndex;
          const count = counts[index] ?? 0;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Daily task count indicator */}
              <span
                className={`text-[11.5px] font-bold transition-opacity ${
                  count > 0
                    ? today
                      ? "text-brand-800"
                      : "text-ink/75"
                    : "opacity-0"
                }`}
              >
                {count > 0 ? count : 0}
              </span>

              {/* Bar track container with 100px height */}
              <div className="flex h-[100px] w-full items-end justify-center rounded-lg bg-[#f4faf6] p-1">
                <div
                  title={`${fullDayNames[index]}: ${count} task${count === 1 ? "" : "s"} due`}
                  className={`w-full max-w-[28px] sm:max-w-[36px] rounded-md transition-all duration-300 ${
                    today
                      ? "bg-gradient-to-b from-[#2f9d58] to-[#16692f] shadow-[0_4px_12px_rgba(22,105,47,0.35)] ring-2 ring-brand-400/40"
                      : count > 0
                      ? "bg-gradient-to-b from-[#bfe8cc] to-[#92d6a9] hover:brightness-95"
                      : "bg-gradient-to-b from-[#e3f2e7] to-[#d8ede0]"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>

              {/* Day pill */}
              <span
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] ${
                  today
                    ? "bg-brand-700 font-bold text-white shadow-xs"
                    : "font-medium text-ink/70"
                }`}
              >
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line/80 pt-3 text-[13px] sm:text-[13.5px] text-ink/75">
        <span className="flex items-center gap-2">
          <CalendarDays size={16} className="text-brand-600" />
          <span>Open tasks due this week</span>
        </span>
        <span className="rounded-md bg-[#eef7f1] px-2.5 py-0.5 text-[14.5px] font-bold text-brand-900">
          {weekLoad.total}
        </span>
      </div>
    </section>
  );
}
