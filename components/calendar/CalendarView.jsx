"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  Plus,
  SquareCheckBig,
} from "lucide-react";
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
const shortMonthTitle = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[12px] font-semibold transition sm:h-9 sm:gap-2 sm:px-3.5 sm:text-[13px] ${
        active ? tone : "border border-line bg-white text-ink/50 hover:text-ink/75"
      }`}
    >
      <Icon size={14} className="shrink-0 sm:h-4 sm:w-4" /> {label}
    </button>
  );
}

export default function CalendarView() {
  const { now, todayDate, filterTasks, openIssueModal, myTasks, myTodos, myProjects } = useApp();
  const [picked, setPicked] = useState(null);
  const [view, setView] = useState("month");
  const [projectId, setProjectId] = useState("all");
  const [kinds, setKinds] = useState({ task: true, todo: true, milestone: true });
  const [highOnly, setHighOnly] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  useCloseOnOutsideClick(scheduleOpen, () => setScheduleOpen(false));
  useCloseOnOutsideClick(filterMenuOpen, () => setFilterMenuOpen(false));

  const date = picked ?? todayDate;
  const calendarTasks = myTasks;
  const calendarTodos = myTodos;
  const calendarProjects = myProjects;
  const events = buildEvents({ tasks: filterTasks(calendarTasks), todos: calendarTodos }).filter(
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
          .slice(0, 8);

  const openDay = (day) => {
    setPicked(day);
    setView("day");
  };
  const step = (direction) =>
    setPicked(
      view === "month"
        ? addMonths(date, direction)
        : view === "week"
        ? shiftDate(date, 7 * direction)
        : shiftDate(date, direction)
    );
  const toggleKind = (kind) => setKinds((current) => ({ ...current, [kind]: !current[kind] }));
  const schedule = () => openIssueModal(null, projectId === "all" ? null : projectId, `${date}T09:00`);

  const title =
    view === "month"
      ? monthTitle.format(parseLocalDate(date))
      : view === "week"
      ? weekRange(date)
      : view === "day"
      ? longDate(date, true)
      : "Upcoming";
  const shortTitle =
    view === "month"
      ? shortMonthTitle.format(parseLocalDate(date))
      : view === "week"
      ? weekRange(date)
      : view === "day"
      ? dayMonth.format(parseLocalDate(date))
      : "Agenda";

  const projectOptions = [
    { value: "all", label: "All projects" },
    ...calendarProjects.map((project) => ({ value: project.id, label: project.name })),
  ];

  const activeKindsCount = [kinds.task, kinds.todo, kinds.milestone].filter(Boolean).length;
  const filterSummaryLabel =
    activeKindsCount === 3 && !highOnly
      ? "All types"
      : highOnly && activeKindsCount === 3
      ? "High Priority"
      : `${activeKindsCount} type${activeKindsCount === 1 ? "" : "s"}${highOnly ? " · High" : ""}`;

  return (
    <div className="space-y-3 px-3.5 pb-6 pt-3.5 sm:space-y-4 sm:px-5 sm:pb-8 sm:pt-6 md:px-[34px]">
      {/* Page Title & Schedule Action */}
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/65 sm:text-[13px] sm:tracking-[0.18em]">
          {longDate(todayDate, true)}
        </p>
        <div className="flex items-center justify-between gap-2.5">
          <h1 className="text-[26px] font-extrabold leading-none tracking-tight sm:text-[38px] md:text-[46px]">
            My <span className="text-brand-600">Calendar</span>
          </h1>

          <div className="relative flex shrink-0">
            <button
              type="button"
              className="btn-primary h-8 rounded-r-none px-3 text-[12px] sm:h-[42px] sm:px-4 sm:text-[14px]"
              onClick={schedule}
            >
              <Plus size={15} className="sm:h-[17px] sm:w-[17px]" /> Schedule task
            </button>
            <button
              type="button"
              className="grid h-8 w-7 place-items-center rounded-r-xl border-l border-white/30 bg-brand-700 text-white hover:bg-brand-800 sm:h-[42px] sm:w-9"
              aria-label="More scheduling options"
              aria-expanded={scheduleOpen}
              onClick={(event) => {
                event.stopPropagation();
                setScheduleOpen((open) => !open);
              }}
            >
              <ChevronDown size={14} className="sm:h-4 sm:w-4" />
            </button>
            {scheduleOpen && (
              <div className="menu-popover right-0 z-50">
                <button type="button" onClick={schedule}>
                  <Plus size={16} /> Schedule task
                </button>
                <Link
                  href="/daily-todo"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium hover:bg-[#eef6f0]"
                >
                  <ListChecks size={16} className="text-ink/55" /> Open Daily To-Do
                </Link>
              </div>
            )}
          </div>
        </div>
        <p className="text-[12.5px] text-muted sm:text-[14.5px]">
          See your scheduled tasks, to-dos, and project deadlines in one place.
        </p>
      </header>

      <div className="grid gap-3.5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {/* ---------------- 1. PROJECT-CALENDAR STYLE HEADER & TOOLBAR ---------------- */}
          <div className="panel space-y-3 p-3.5 sm:p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 sm:items-center sm:justify-start">
                  <h2 className="text-[16.5px] font-bold leading-snug text-ink sm:text-[18px]">
                    Workspace Schedule
                  </h2>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    {events.length} scheduled item{events.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted sm:text-[13px]">
                  Click any date to inspect or schedule tasks across your projects.
                </p>
              </div>

              {/* Single-Line Month Stepper + Today + View Switcher */}
              <div className="flex flex-nowrap items-center justify-between gap-1.5 sm:flex-wrap sm:justify-start sm:gap-2.5">
                <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                  {view !== "agenda" && (
                    <div className="inline-flex shrink-0 items-center rounded-xl border border-line bg-white p-0.5 shadow-2xs sm:gap-1 sm:p-1">
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        className="grid h-6 w-5 place-items-center rounded-lg text-ink/65 hover:bg-black/5 hover:text-ink sm:h-8 sm:w-8"
                        title="Previous"
                      >
                        <ChevronLeft size={14} className="sm:h-[15px] sm:w-[15px]" />
                      </button>
                      <span className="min-w-[58px] whitespace-nowrap px-0.5 text-center text-[11px] font-bold text-ink sm:hidden">
                        {shortTitle}
                      </span>
                      <span className="hidden min-w-[130px] px-1 text-center text-[13.5px] font-bold text-ink sm:inline">
                        {title}
                      </span>
                      <button
                        type="button"
                        onClick={() => step(1)}
                        className="grid h-6 w-5 place-items-center rounded-lg text-ink/65 hover:bg-black/5 hover:text-ink sm:h-8 sm:w-8"
                        title="Next"
                      >
                        <ChevronRight size={14} className="sm:h-[15px] sm:w-[15px]" />
                      </button>
                    </div>
                  )}

                  {date !== todayDate && view !== "agenda" && (
                    <button
                      type="button"
                      onClick={() => setPicked(null)}
                      className={`shrink-0 rounded-xl border border-line bg-white px-2 py-1 text-[10.5px] font-bold text-brand-700 transition hover:bg-[#f6faf7] sm:px-3 sm:py-1.5 sm:text-[12.5px] ${
                        view === "day" ? "hidden sm:inline-block" : ""
                      }`}
                    >
                      Today
                    </button>
                  )}
                </div>

                <div className="inline-flex shrink-0 items-center rounded-xl border border-line bg-[#f4f7f5] p-0.5 text-[10.5px] font-semibold sm:text-[12.5px]">
                  {views.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`rounded-lg px-2 py-1 capitalize transition sm:px-2.5 sm:py-1.5 ${
                        item.id === "day" && view !== "day" ? "hidden sm:inline-block" : ""
                      } ${
                        view === item.id ? "bg-white font-bold text-ink shadow-xs" : "text-muted hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Row: 2-Column Dropdowns on Mobile (<sm), Project Dropdown + Chips on Desktop (sm:) */}
            <div className="border-t border-line/70 pt-2.5">
              {/* Mobile 2-Column Dropdowns */}
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Dropdown
                  value={projectId}
                  options={projectOptions}
                  onChange={setProjectId}
                  className="w-full justify-between !h-9 !px-3 !text-[12.5px]"
                />

                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={filterMenuOpen}
                    onClick={(event) => {
                      event.stopPropagation();
                      setFilterMenuOpen((open) => !open);
                    }}
                    className="inline-flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-3 text-[12.5px] font-medium shadow-[0_1px_3px_rgba(16,60,35,0.05)] transition hover:bg-[#f6faf7]"
                  >
                    <span className="truncate">{filterSummaryLabel}</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-muted transition-transform duration-150 ${
                        filterMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {filterMenuOpen && (
                    <div
                      className="menu-popover right-0 left-auto z-50 min-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleKind("task")}
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2">
                          <SquareCheckBig size={15} className="text-emerald-600" /> Task
                        </span>
                        <input
                          type="checkbox"
                          checked={kinds.task}
                           readOnly
                          className="h-4 w-4 rounded accent-brand-700 pointer-events-none"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleKind("todo")}
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ListChecks size={15} className="text-blue-600" /> To-do
                        </span>
                        <input
                          type="checkbox"
                          checked={kinds.todo}
                          readOnly
                          className="h-4 w-4 rounded accent-brand-700 pointer-events-none"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleKind("milestone")}
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock size={15} className="text-purple-600" /> Milestone
                        </span>
                        <input
                          type="checkbox"
                          checked={kinds.milestone}
                          readOnly
                          className="h-4 w-4 rounded accent-brand-700 pointer-events-none"
                        />
                      </button>
                      <hr />
                      <button
                        type="button"
                        onClick={() => setHighOnly((on) => !on)}
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold">
                          <Flag size={15} className="text-rose-600" /> High Priority
                        </span>
                        <input
                          type="checkbox"
                          checked={highOnly}
                          readOnly
                          className="h-4 w-4 rounded accent-rose-600 pointer-events-none"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Filter Bar */}
              <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                <Dropdown value={projectId} options={projectOptions} onChange={setProjectId} />
                <Chip
                  active={kinds.task}
                  onClick={() => toggleKind("task")}
                  Icon={SquareCheckBig}
                  label="Task"
                  tone={`${TONES.green.bg} ${TONES.green.text}`}
                />
                <Chip
                  active={kinds.todo}
                  onClick={() => toggleKind("todo")}
                  Icon={ListChecks}
                  label="To-do"
                  tone={`${TONES.blue.bg} ${TONES.blue.text}`}
                />
                <Chip
                  active={kinds.milestone}
                  onClick={() => toggleKind("milestone")}
                  Icon={CalendarClock}
                  label="Milestone"
                  tone={`${TONES.purple.bg} ${TONES.purple.text}`}
                />
                <Chip
                  active={highOnly}
                  onClick={() => setHighOnly((on) => !on)}
                  Icon={Flag}
                  label="High Priority"
                  tone={`${TONES.red.bg} ${TONES.red.text} ring-1 ring-[#e5484d]/30`}
                />
              </div>
            </div>
          </div>

          {/* ---------------- 2. UPCOMING DROPDOWN (Project Calendar Style on <xl) ---------------- */}
          {upcoming.length > 0 && (
            <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white shadow-2xs xl:hidden">
              <button
                type="button"
                aria-expanded={upcomingOpen}
                onClick={() => setUpcomingOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-[#fafcfb] sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eaf6ee] text-brand-700">
                    <Clock size={14} />
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-bold text-ink sm:text-[13.5px]">
                    Upcoming <span className="hidden sm:inline">Tasks</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                    {upcoming.length}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-lg border border-line/80 bg-[#f6f9f7] px-2 py-1 text-[11px] font-semibold text-ink/75">
                    Next: <b className="font-bold text-brand-800">{dayMonth.format(parseLocalDate(upcoming[0].date))}</b>
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#f3f6f4] text-ink/70">
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-150 ${upcomingOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </div>
              </button>

              {upcomingOpen && (
                <div className="max-h-[260px] space-y-1.5 overflow-y-auto border-t border-line/80 bg-[#fafcfb] p-2.5 sm:p-3">
                  {upcoming.map((event) => (
                    <Link
                      key={event.id}
                      href={event.href}
                      onClick={() => setUpcomingOpen(false)}
                      className="flex w-full items-start justify-between gap-2.5 rounded-xl border border-line/80 bg-white p-2.5 text-left transition hover:border-brand-400 hover:bg-[#f5faf7]"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <i
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: toneOf(event).dot }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold leading-snug text-ink sm:text-[13px]">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-muted">
                            {event.projectName} · {formatClock(event.time)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#f2f6f3] px-2 py-1 text-[11px] font-bold text-brand-800">
                        {dayMonth.format(parseLocalDate(event.date))}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- 3. MAIN CALENDAR GRID ---------------- */}
          <section className="panel min-w-0 p-1.5 sm:p-5">
            {view === "month" && (
              <MonthGrid
                date={date}
                todayDate={todayDate}
                events={events}
                onSelect={setPicked}
                onOpenDay={openDay}
              />
            )}
            {view === "week" && <WeekView date={date} todayDate={todayDate} events={events} onOpenDay={openDay} />}
            {view === "day" && <DayView date={date} events={events} />}
            {view === "agenda" && <AgendaView todayDate={todayDate} events={events} />}
          </section>
        </div>

        {/* Desktop Sidebar (xl and up) */}
        <aside className="hidden space-y-5 xl:block">
          <MiniCalendar date={date} todayDate={todayDate} onSelect={setPicked} />

          <section className="panel p-5">
            <div className="flex items-center">
              <h2 className="text-[19px] font-bold tracking-tight">Upcoming Tasks</h2>
              <button
                type="button"
                className="ml-auto text-[14px] font-medium text-brand-700 hover:underline"
                onClick={() => setView("agenda")}
              >
                View all
              </button>
            </div>
            <ul className="mt-2">
              {upcoming.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <Link
                    href={event.href}
                    className="flex items-center gap-3 border-t border-line py-3 transition first:border-t-0 hover:bg-[#f7fbf8]"
                  >
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
              {!upcoming.length && (
                <li className="py-4 text-[14px] text-muted">{floor === null ? "" : "No upcoming tasks."}</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
