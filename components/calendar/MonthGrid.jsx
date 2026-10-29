"use client";

import { useMemo } from "react";
import { parseLocalDate, toLocalDate } from "@/lib/datetime";
import { EventPill, byTime } from "./events";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 2;

/** Month grid, Monday first. Each cell shows up to two events and a "+N more" link to that day. */
export default function MonthGrid({ date, todayDate, events, onSelect, onOpenDay }) {
  const first = parseLocalDate(`${date.slice(0, 7)}-01`);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((lead + total) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, index) => toLocalDate(new Date(first.getFullYear(), first.getMonth(), 1 - lead + index)));

  const byDate = useMemo(() => {
    const map = new Map();
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    for (const list of map.values()) list.sort(byTime);
    return map;
  }, [events]);

  const month = date.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-7 bg-[#f4f7f5] text-center text-[13px] font-medium text-ink/70">
        {weekdays.map((day) => (
          <div key={day} className="border-r border-line py-2.5 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const list = byDate.get(cell) ?? [];
          const inMonth = cell.startsWith(month);
          const isToday = cell === todayDate;
          const hidden = list.length - MAX_VISIBLE;
          return (
            <div
              key={cell}
              className={`min-h-[104px] min-w-0 border-r border-t border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 ${cell === date ? "bg-[#f3fbf5]" : "bg-white"}`}
            >
              <button
                onClick={() => onSelect(cell)}
                className={`mb-1 grid h-[26px] min-w-[26px] place-items-center rounded-full px-1 text-[13.5px] transition ${
                  isToday ? "bg-brand-700 font-semibold text-white shadow" : inMonth ? "text-ink hover:bg-[#eef6f0]" : "text-ink/35 hover:bg-[#eef6f0]"
                }`}
                aria-label={`Select ${cell}`}
              >
                {Number(cell.slice(8))}
              </button>
              <div className="space-y-1">
                {list.slice(0, MAX_VISIBLE).map((event) => (
                  <EventPill key={event.id} event={event} />
                ))}
                {hidden > 0 && (
                  <button onClick={() => onOpenDay(cell)} className="px-1 text-[12px] font-medium text-ink/60 hover:text-brand-700 hover:underline">
                    +{hidden} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
