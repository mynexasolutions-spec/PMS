"use client";

import { formatTimeRange, parseLocalDate, shiftDate } from "@/lib/datetime";

const weekdayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const statusDot = { todo: "#e5484d", progress: "#2b6fd6", review: "#f59e0b", done: "#1f8a4c" };

/** Monday-to-Sunday overview of the week containing `date`. */
export default function WeekView({ date, todayDate, todos, onSelect }) {
  const monday = shiftDate(date, -((parseLocalDate(date).getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {days.map((day) => {
        const items = todos.filter((todo) => todo.todoDate === day);
        const selected = day === date;
        return (
          <section key={day} className={`min-h-[180px] rounded-xl border p-2 ${selected ? "border-brand-400 bg-[#eef8f0]" : "border-line bg-[#f6f9f7]"}`}>
            <button onClick={() => onSelect(day)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/70">
              <span className="text-[13px] text-muted">{weekdayShort.format(parseLocalDate(day))}</span>
              <strong
                className={`grid h-7 min-w-7 place-items-center rounded-full px-1 text-[14px] ${day === todayDate ? "bg-brand-700 text-white" : ""}`}
              >
                {parseLocalDate(day).getDate()}
              </strong>
            </button>
            <ul className="mt-1.5 space-y-1.5">
              {items.map((todo) => (
                <li key={todo.id} className={`flex gap-2 rounded-lg bg-white px-2.5 py-2 text-[13px] shadow-sm ${todo.done ? "opacity-60" : ""}`}>
                  <i className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: statusDot[todo.status] }} />
                  <div className="min-w-0">
                    <span className={`block leading-snug ${todo.done ? "line-through" : ""}`}>{todo.title}</span>
                    <small className="text-muted">{formatTimeRange(todo.startTime, todo.endTime)}</small>
                  </div>
                </li>
              ))}
              {!items.length && <li className="px-2 py-3 text-center text-[12.5px] text-muted">Nothing planned</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
