"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";

const labels = ["M", "T", "W", "T", "F", "S", "S"];

export default function WeekChart() {
  const { weekLoad } = useApp();

  return (
    <section className="panel px-5 py-4">
      <div className="flex items-center">
        <h2 className="text-[19px] font-bold tracking-tight">This week</h2>
        <Link href="/calendar" className="ml-auto inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-700 hover:underline">
          View calendar <ArrowRight size={14} />
        </Link>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 px-1">
        {weekLoad.heights.map((height, index) => {
          const today = index === weekLoad.todayIndex;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-[62px] w-full items-end justify-center">
                <div
                  className={`w-[34px] rounded-md transition-[height] ${
                    today ? "bg-gradient-to-b from-[#2f9d58] to-[#16692f] shadow-[0_3px_8px_rgba(22,105,47,0.3)]" : "bg-gradient-to-b from-[#cdeed7] to-[#b9e6c8]"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className={`text-[12px] ${today ? "font-semibold text-ink" : "text-muted"}`}>{labels[index]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[13.5px] text-ink/75">
        <span>Open tasks due</span>
        <strong className="text-[16px] text-ink">{weekLoad.total}</strong>
      </div>
    </section>
  );
}
