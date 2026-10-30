"use client";

import { Moon } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { longDate } from "@/lib/datetime";
import CommentThread from "./CommentThread";

/** The team's review for one day: what got done, what is blocked, what carries over. */
export default function DayDiscussion({ date, bare = false }) {
  const { commentCounts } = useApp();
  const count = commentCounts[`day:${date}`] ?? 0;

  const content = (
    <div className="space-y-3">
      {!bare ? (
        <div className="flex items-center gap-3">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl bg-[#e4efff] text-[#2b5fd6]">
            <Moon size={18} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="text-[15px] font-bold tracking-tight">Daily Standup & Review</h3>
            <p className="text-[12px] text-muted">{longDate(date)}</p>
          </div>
          {count > 0 && <span className="rounded-full bg-[#e4efff] px-2 py-0.5 text-[11px] font-semibold text-[#2b5fd6]">{count} updates</span>}
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 text-[12.5px] text-muted">
          <span>Updates for {longDate(date, true)}</span>
          {count > 0 && <span className="rounded-full bg-[#e4efff] px-2 py-0.5 text-[11px] font-medium text-[#2b5fd6]">{count} posts</span>}
        </div>
      )}
      <div>
        <CommentThread
          scope="day"
          refId={date}
          compact
          placeholder="What got done today? Anything blocked? Plan for tomorrow?"
          empty="Nothing yet. Add your update for the day's review."
        />
      </div>
    </div>
  );

  if (bare) return content;
  return <section className="panel rounded-xl px-5 py-4">{content}</section>;
}
