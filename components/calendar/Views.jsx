"use client";

import { useMemo } from "react";
import { longDate, parseLocalDate, shiftDate } from "@/lib/datetime";
import { EventCard, byTime } from "./events";

const weekdayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const empty = "rounded-lg border border-dashed border-line px-3 py-5 text-center text-[13px] text-muted";

const onDate = (events, date) => events.filter((event) => event.date === date).sort(byTime);

/** Monday-to-Sunday columns for the week containing `date`. */
export function WeekView({ date, todayDate, events, onOpenDay }) {
  const monday = shiftDate(date, -((parseLocalDate(date).getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {days.map((day) => {
        const list = onDate(events, day);
        return (
          <section key={day} className={`min-h-[220px] min-w-0 rounded-xl border p-2 ${day === date ? "border-brand-300 bg-[#f1faf4]" : "border-line bg-[#f6f9f7]"}`}>
            <button
              onClick={() => onOpenDay(day)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/70"
            >
              <span className="text-[13px] text-muted">{weekdayShort.format(parseLocalDate(day))}</span>
              <strong className={`grid h-7 min-w-7 place-items-center rounded-full px-1 text-[14px] ${day === todayDate ? "bg-brand-700 text-white" : ""}`}>
                {parseLocalDate(day).getDate()}
              </strong>
            </button>
            <div className="mt-1.5 space-y-2">
              {list.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {!list.length && <p className="px-2 py-3 text-center text-[12.5px] text-muted">Nothing scheduled</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function DayView({ date, events }) {
  const list = onDate(events, date);
  return (
    <div className="space-y-2.5">
      <h3 className="text-[15px] font-semibold text-ink/80">{longDate(date, true)}</h3>
      {list.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      {!list.length && <div className={empty}>Nothing scheduled for this day.</div>}
    </div>
  );
}

/** Everything from today onwards, grouped by day. */
export function AgendaView({ todayDate, events }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (event.date < todayDate) continue;
      map.set(event.date, [...(map.get(event.date) ?? []), event]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => [day, list.sort(byTime)]);
  }, [events, todayDate]);

  if (!groups.length) return <div className={empty}>Nothing coming up. Nice work!</div>;

  return (
    <div className="space-y-5">
      {groups.map(([day, list]) => (
        <section key={day}>
          <h3 className="mb-2 text-[14px] font-semibold text-ink/75">{longDate(day, true)}</h3>
          <div className="space-y-2">
            {list.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
