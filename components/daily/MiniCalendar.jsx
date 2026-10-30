"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseLocalDate, toLocalDate } from "@/lib/datetime";

const monthTitle = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month grid (Monday first, neighbouring months greyed): click any day to open it. */
export default function MiniCalendar({ date, todayDate, onSelect, bare = false }) {
  const [viewMonth, setViewMonth] = useState(date.slice(0, 7));
  const [lastDate, setLastDate] = useState(date);
  // Follow the selected date when it moves to another month (e.g. via the date picker).
  if (lastDate !== date) {
    setLastDate(date);
    setViewMonth(date.slice(0, 7));
  }

  const first = parseLocalDate(`${viewMonth}-01`);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((lead + total) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, index) => toLocalDate(new Date(first.getFullYear(), first.getMonth(), 1 - lead + index)));

  const shiftMonth = (delta) => setViewMonth(toLocalDate(new Date(first.getFullYear(), first.getMonth() + delta, 1)).slice(0, 7));
  const arrow = "grid h-[28px] w-[28px] place-items-center rounded-md hover:bg-[#f0f6f2] text-ink/75";

  const content = (
    <div>
      <div className="flex items-center">
        <h3 className="text-[16px] font-bold tracking-tight text-ink">{monthTitle.format(first)}</h3>
        <button className={`${arrow} ml-auto`} onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <button className={arrow} onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-7 text-center text-[12px] font-medium text-muted">
        {weekdays.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[13.5px]">
        {cells.map((cell) => {
          const inMonth = cell.startsWith(viewMonth);
          return (
            <button
              key={cell}
              onClick={() => onSelect(cell)}
              className={`mx-auto grid h-[32px] w-[32px] place-items-center rounded-full transition ${
                cell === date
                  ? "bg-brand-700 font-semibold text-white shadow-xs"
                  : cell === todayDate
                    ? "font-semibold text-brand-700 ring-2 ring-brand-300"
                    : inMonth
                      ? "text-ink/85 hover:bg-[#f0f6f2]"
                      : "text-ink/30 hover:bg-[#f0f6f2]"
              }`}
            >
              {Number(cell.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (bare) return content;
  return <section className="panel rounded-xl px-5 py-4">{content}</section>;
}
