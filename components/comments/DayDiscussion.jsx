"use client";

import { Moon } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { longDate } from "@/lib/datetime";
import CommentThread from "./CommentThread";

/** The team's evening review for one day: what got done, what is blocked, what carries over. */
export default function DayDiscussion({ date }) {
  const { commentCounts } = useApp();
  const count = commentCounts[`day:${date}`] ?? 0;

  return (
    <section className="panel rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-[#e4efff] text-[#2b5fd6]">
          <Moon size={20} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h3 className="text-[17px] font-bold tracking-tight">Night discussion</h3>
          <p className="text-[12.5px] text-muted">{longDate(date)}</p>
        </div>
        {count > 0 && <span className="rounded-full bg-[#e4efff] px-2.5 py-1 text-[12px] font-semibold text-[#2b5fd6]">{count}</span>}
      </div>
      <div className="mt-4">
        <CommentThread
          scope="day"
          refId={date}
          compact
          placeholder="What got done today? Anything blocked? Plan for tomorrow?"
          empty="Nothing yet. Add your update for the day's review."
        />
      </div>
    </section>
  );
}
