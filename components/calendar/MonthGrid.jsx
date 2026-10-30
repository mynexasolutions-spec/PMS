"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { X, Plus, ExternalLink, Calendar } from "lucide-react";
import { parseLocalDate, toLocalDate, longDate } from "@/lib/datetime";
import { byTime, toneOf, KINDS, formatClock } from "./events";
import { useApp } from "@/components/AppProvider";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Quick Popover shown when clicking a day with events (Apple Calendar Style) */
function DayPopover({ date, events, onClose, onOpenDay, onSchedule }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] rounded-2xl border border-line bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3.5">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-700">
              {events.length} {events.length === 1 ? "Event" : "Events"} Scheduled
            </p>
            <h3 className="mt-0.5 text-[18px] font-bold text-ink truncate">
              {longDate(date, true)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Event List */}
        <div className="my-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="py-8 text-center text-[14px] text-muted">
              Nothing scheduled for this day.
            </div>
          ) : (
            events.map((event) => {
              const tone = toneOf(event);
              return (
                <Link
                  key={event.id}
                  href={event.href}
                  className="group flex items-start gap-3 rounded-xl border border-line/80 bg-[#fbfdfb] p-3 transition hover:border-brand-300 hover:bg-[#f3f9f5]"
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: tone.dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                      <span className="font-semibold text-ink/75">
                        {formatClock(event.time)}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${tone.bg} ${tone.text}`}>
                        {KINDS[event.kind]?.label ?? "Task"}
                      </span>
                      {event.priority === "high" && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-red-700">
                          High
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-[14px] font-semibold leading-snug text-ink group-hover:text-brand-900 ${
                        event.done ? "line-through opacity-60" : ""
                      }`}
                    >
                      {event.title}
                    </p>
                    {event.projectName && (
                      <p className="mt-0.5 text-[12px] text-muted truncate">
                        {event.projectName}
                      </p>
                    )}
                  </div>
                  <ExternalLink
                    size={15}
                    className="mt-1 shrink-0 text-ink/30 opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDay(date);
            }}
            className="text-[13.5px] font-semibold text-brand-700 hover:underline"
          >
            Open day view →
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSchedule(date);
            }}
            className="btn-primary h-9 px-4 text-[13.5px]"
          >
            <Plus size={16} /> Add task
          </button>
        </div>
      </div>
    </div>
  );
}

/** Month grid (Apple Calendar style) with Category Dots and Quick Popover on click. */
export default function MonthGrid({ date, todayDate, events, onSelect, onOpenDay }) {
  const { openIssueModal } = useApp();
  const [popoverDate, setPopoverDate] = useState(null);

  const first = parseLocalDate(`${date.slice(0, 7)}-01`);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((lead + total) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, index) =>
    toLocalDate(new Date(first.getFullYear(), first.getMonth(), 1 - lead + index))
  );

  const byDate = useMemo(() => {
    const map = new Map();
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    for (const list of map.values()) list.sort(byTime);
    return map;
  }, [events]);

  const month = date.slice(0, 7);
  const popoverEvents = popoverDate ? byDate.get(popoverDate) ?? [] : [];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-line">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 bg-[#f4f7f5] text-center text-[13px] font-medium text-ink/70">
          {weekdays.map((day) => (
            <div key={day} className="border-r border-line py-2.5 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const list = byDate.get(cell) ?? [];
            const inMonth = cell.startsWith(month);
            const isToday = cell === todayDate;
            const isSelected = cell === date;

            return (
              <div
                key={cell}
                onClick={() => {
                  onSelect(cell);
                  if (list.length > 0) setPopoverDate(cell);
                }}
                className={`group relative flex min-h-[96px] cursor-pointer flex-col justify-between border-r border-t border-line p-2 transition last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
                  isSelected
                    ? "bg-[#f2f9f4]"
                    : inMonth
                    ? "bg-white hover:bg-[#f7faf8]"
                    : "bg-[#fafbfa] hover:bg-[#f4f7f5]"
                }`}
              >
                {/* Top: Date Number & Count */}
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] font-medium transition ${
                      isToday
                        ? "bg-brand-700 font-bold text-white shadow-sm"
                        : isSelected
                        ? "font-bold text-brand-800 bg-brand-100/70"
                        : inMonth
                        ? "text-ink group-hover:text-brand-800"
                        : "text-ink/30"
                    }`}
                  >
                    {Number(cell.slice(8))}
                  </span>

                  {list.length > 0 && (
                    <span className="text-[11px] font-semibold text-muted/70 group-hover:text-brand-700">
                      {list.length}
                    </span>
                  )}
                </div>

                {/* Middle / Bottom: Color Dots + Category Badge */}
                {list.length > 0 ? (
                  <div className="my-auto flex flex-col items-center gap-1.5 py-1">
                    {/* Category Dots */}
                    <div className="flex items-center justify-center gap-1.5">
                      {list.slice(0, 4).map((event) => {
                        const tone = toneOf(event);
                        return (
                          <span
                            key={event.id}
                            className="h-2 w-2 rounded-full ring-1 ring-white shadow-xs"
                            style={{ background: tone.dot }}
                            title={event.title}
                          />
                        );
                      })}
                      {list.length > 4 && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-ink/30"
                          title={`+${list.length - 4} more`}
                        />
                      )}
                    </div>

                    {/* Category Pill / Count Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                        list.length === 1
                          ? `${toneOf(list[0]).bg} ${toneOf(list[0]).text}`
                          : "bg-ink/5 text-ink/75 group-hover:bg-brand-100 group-hover:text-brand-800"
                      }`}
                    >
                      {list.length === 1
                        ? KINDS[list[0].kind]?.label ?? "Task"
                        : `${list.length} Tasks`}
                    </span>
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Popover */}
      {popoverDate && (
        <DayPopover
          date={popoverDate}
          events={popoverEvents}
          onClose={() => setPopoverDate(null)}
          onOpenDay={onOpenDay}
          onSchedule={(targetDate) => openIssueModal(null, null, `${targetDate}T09:00`)}
        />
      )}
    </>
  );
}
