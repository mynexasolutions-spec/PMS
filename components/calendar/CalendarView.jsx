"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Flag, ListChecks, Plus, SquareCheckBig } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Dropdown from "@/components/ui/Dropdown";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import MiniCalendar from "@/components/daily/MiniCalendar";
import { longDate, parseLocalDate, shiftDate, startOfDay, toLocalDate } from "@/lib/datetime";
import MonthGrid from "./MonthGrid";
import { AgendaView, DayView, WeekView } from "./Views";
import { TONES, buildEvents, formatClock, toneOf } from "./events";

const views = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

const monthTitle = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const upcomingDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function addMonths(iso, amount) {
  const d = parseLocalDate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toLocalDate(d);
}

function weekRange(iso) {
  const monday = shiftDate(iso, -((parseLocalDate(iso).getDay() + 6) % 7));
  const sunday = shiftDate(monday, 6);
  return `${dayMonth.format(parseLocalDate(monday))} – ${dayMonth.format(parseLocalDate(sunday))} ${parseLocalDate(sunday).getFullYear()}`;
}

function Chip({ active, onClick, Icon, label, tone }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-[44px] items-center gap-2.5 rounded-xl px-4 text-[14.5px] font-semibold transition ${
        active ? tone : "border border-line bg-white text-ink/45 hover:text-ink/70"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

export default function CalendarView() {
  const { tasks, todos, projects, now, todayDate, filterTasks, openIssueModal } = useApp();
  const [picked, setPicked] = useState(null);
  const [view, setView] = useState("month");
  const [projectId, setProjectId] = useState("all");
  const [kinds, setKinds] = useState({ task: true, todo: true, milestone: true });
  const [highOnly, setHighOnly] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  useCloseOnOutsideClick(scheduleOpen, () => setScheduleOpen(false));

  const date = picked ?? todayDate;
  const events = buildEvents({ tasks: filterTasks(tasks), todos }).filter(
    (event) => kinds[event.kind] && (projectId === "all" || event.projectId === projectId) && (!highOnly || event.priority === "high"),
  );

  const floor = now ? startOfDay(now).getTime() : null;
  const sortKey = (event) => `${event.date} ${event.time ?? ""}`;
  const upcoming =
    floor === null
      ? []
      : events
          .filter((event) => event.source === "issue" && !event.done && new Date(`${event.date}T${event.time ?? "00:00"}`).getTime() >= floor)
          .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
          .slice(0, 5);

  const openDay = (day) => {
    setPicked(day);
    setView("day");
  };
  const step = (direction) => setPicked(view === "month" ? addMonths(date, direction) : view === "week" ? shiftDate(date, 7 * direction) : shiftDate(date, direction));
  const toggleKind = (kind) => setKinds((current) => ({ ...current, [kind]: !current[kind] }));
  const schedule = () => openIssueModal(null, projectId === "all" ? null : projectId, `${date}T09:00`);

  const title =
    view === "month" ? monthTitle.format(parseLocalDate(date)) : view === "week" ? weekRange(date) : view === "day" ? longDate(date, true) : "Upcoming";
  const projectOptions = [{ value: "all", label: "All projects" }, ...projects.map((project) => ({ value: project.id, label: project.name }))];
  const navBtn = "grid h-[34px] w-[34px] place-items-center rounded-lg hover:bg-[#eef6f0]";

  return (
    <div className="px-5 pb-8 pt-6 md:px-[34px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">{longDate(todayDate, true)}</p>
          <h1 className="mt-2 text-[44px] font-extrabold leading-none tracking-tight md:text-[50px]">Calendar</h1>
          <p className="mt-3 text-[16px] text-muted">See upcoming project deadlines and meetings in one place.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 rounded-xl border border-line bg-[#f3f7f4] p-1.5">
            {views.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                aria-pressed={view === item.id}
                className={`h-[42px] rounded-lg px-5 text-[15px] transition ${
                  view === item.id ? "bg-brand-700 font-semibold text-white shadow-md" : "border border-line bg-white font-medium hover:bg-[#f6faf7]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative flex">
            <button className="btn-primary h-[54px] rounded-r-none px-6 text-[16px]" onClick={schedule}>
              <Plus size={19} /> Schedule task
            </button>
            <button
              className="grid h-[54px] w-[50px] place-items-center rounded-r-xl border-l border-white/30 bg-brand-700 text-white hover:bg-brand-800"
              aria-label="More scheduling options"
              aria-expanded={scheduleOpen}
              onClick={(event) => {
                event.stopPropagation();
                setScheduleOpen((open) => !open);
              }}
            >
              <ChevronDown size={18} />
            </button>
            {scheduleOpen && (
              <div className="menu-popover">
                <button onClick={schedule}>
                  <Plus size={16} /> Schedule task
                </button>
                <Link href="/daily-todo" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14.5px] font-medium hover:bg-[#eef6f0]">
                  <ListChecks size={16} className="text-ink/55" /> Open Daily To-Do
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Dropdown value={projectId} options={projectOptions} onChange={setProjectId} />
            <Chip active={kinds.task} onClick={() => toggleKind("task")} Icon={SquareCheckBig} label="Task" tone={`${TONES.green.bg} ${TONES.green.text}`} />
            <Chip active={kinds.todo} onClick={() => toggleKind("todo")} Icon={ListChecks} label="To-do" tone={`${TONES.blue.bg} ${TONES.blue.text}`} />
            <Chip active={kinds.milestone} onClick={() => toggleKind("milestone")} Icon={CalendarClock} label="Milestone" tone={`${TONES.purple.bg} ${TONES.purple.text}`} />
            <Chip active={highOnly} onClick={() => setHighOnly((on) => !on)} Icon={Flag} label="High Priority" tone={`${TONES.red.bg} ${TONES.red.text} ring-2 ring-[#e5484d]/30`} />
          </div>

          <section className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-bold tracking-tight">{title}</h2>
              {view !== "agenda" && (
                <>
                  <button className={`${navBtn} ml-3`} onClick={() => step(-1)} aria-label="Previous">
                    <ChevronLeft size={19} />
                  </button>
                  <button className={navBtn} onClick={() => step(1)} aria-label="Next">
                    <ChevronRight size={19} />
                  </button>
                  <button className="btn-secondary ml-2 h-[40px] px-5" onClick={() => setPicked(null)}>
                    Today
                  </button>
                </>
              )}
            </div>

            {view === "month" && <MonthGrid date={date} todayDate={todayDate} events={events} onSelect={setPicked} onOpenDay={openDay} />}
            {view === "week" && <WeekView date={date} todayDate={todayDate} events={events} onOpenDay={openDay} />}
            {view === "day" && <DayView date={date} events={events} />}
            {view === "agenda" && <AgendaView todayDate={todayDate} events={events} />}
          </section>
        </div>

        <aside className="space-y-5">
          <MiniCalendar date={date} todayDate={todayDate} onSelect={setPicked} />

          <section className="panel p-5">
            <div className="flex items-center">
              <h2 className="text-[19px] font-bold tracking-tight">Upcoming Tasks</h2>
              <button className="ml-auto text-[14px] font-medium text-brand-700 hover:underline" onClick={() => setView("agenda")}>
                View all
              </button>
            </div>
            <ul className="mt-2">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Link href={event.href} className="flex items-center gap-3 border-t border-line py-3 transition first:border-t-0 hover:bg-[#f7fbf8]">
                    <i className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: toneOf(event).dot }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold leading-snug">{event.title}</p>
                      <p className="text-[13px] text-muted">{event.projectName}</p>
                      <p className="text-[13px] text-muted">
                        {upcomingDate.format(parseLocalDate(event.date))} • {formatClock(event.time)}
                      </p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-ink/50" />
                  </Link>
                </li>
              ))}
              {!upcoming.length && <li className="py-4 text-[14px] text-muted">{floor === null ? "" : "No upcoming tasks."}</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
