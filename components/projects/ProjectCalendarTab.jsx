"use client";

// Project Calendar Tab with date-click event creation
import { useState, useMemo, useEffect } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Flag,
  Calendar as CalendarIcon,
  Sparkles,
  PhoneCall,
  Rocket,
  Milestone as MilestoneIcon,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { longDate, parseLocalDate, shiftDate, startOfDay, toLocalDate } from "@/lib/datetime";
import { buildEvents, formatClock } from "@/components/calendar/events";
import MonthGrid from "@/components/calendar/MonthGrid";
import { AgendaView, WeekView } from "@/components/calendar/Views";
import { request } from "@/lib/api";

const EVENT_TYPES = [
  { id: "meeting", label: "Meeting / Call", icon: PhoneCall, badge: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "milestone", label: "Milestone", icon: MilestoneIcon, badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "release", label: "Release / Deploy", icon: Rocket, badge: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "deadline", label: "Deadline", icon: Timer, badge: "bg-rose-100 text-rose-800 border-rose-200" },
];

const monthTitle = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const shortMonthTitle = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function addMonths(iso, amount) {
  const d = parseLocalDate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toLocalDate(d);
}

export default function ProjectCalendarTab({ project }) {
  const { tasks, now, todayDate, notify, currentUser, confirmDialog } = useApp();
  const [picked, setPicked] = useState(null);
  const [view, setView] = useState("month"); // "month" | "week" | "agenda"
  const [customEvents, setCustomEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  // Selected date popover/modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("meeting");
  const [newTime, setNewTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isProjAdmin =
    project?.isProjectAdmin ||
    project?.createdBy === currentUser?.id ||
    (project?.members || []).some((m) => m.userId === currentUser?.id && m.role === "admin");

  const date = picked ?? todayDate;

  // Load custom project events from API
  async function fetchEvents() {
    setLoadingEvents(true);
    const { ok, data } = await request(`/api/projects/${project.id}/events`);
    setLoadingEvents(false);
    if (ok && Array.isArray(data?.events)) {
      setCustomEvents(data.events);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [project.id]);

  // Filter tasks to only this project
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === project.id), [tasks, project.id]);

  // Combine task deadlines + custom project events
  const combinedEvents = useMemo(() => {
    const taskEvents = buildEvents({ tasks: projectTasks, todos: [] });

    const formattedCustom = customEvents.map((e) => ({
      id: `event-${e.id}`,
      rawId: e.id,
      source: "project_event",
      kind: e.type, // 'meeting' | 'milestone' | 'release' | 'deadline'
      title: e.title,
      key: null,
      date: e.eventDate,
      time: e.eventTime,
      projectId: project.id,
      projectName: project.name,
      priority: e.type === "deadline" ? "high" : "medium",
      done: false,
      href: `/projects/${project.id}?tab=calendar`,
      creatorName: e.creatorName,
      createdBy: e.createdBy,
    }));

    return [...taskEvents, ...formattedCustom];
  }, [projectTasks, customEvents, project.id, project.name]);

  const floor = now ? startOfDay(now).getTime() : null;
  const sortKey = (event) => `${event.date} ${event.time ?? ""}`;
  const upcoming = useMemo(() => {
    if (floor === null) return [];
    return combinedEvents
      .filter((event) => !event.done && new Date(`${event.date}T${event.time ?? "00:00"}`).getTime() >= floor)
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  }, [combinedEvents, floor]);

  // Handle create new event on selected date
  async function handleCreateEvent(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !selectedDate || submitting) return;

    setSubmitting(true);
    const { ok, data } = await request(`/api/projects/${project.id}/events`, "POST", {
      title,
      type: newType,
      eventDate: selectedDate,
      eventTime: newTime || null,
    });
    setSubmitting(false);

    if (!ok) {
      notify(data?.error ?? "Could not create event.");
      return;
    }

    setCustomEvents((prev) => [...prev, data.event]);
    setNewTitle("");
    setNewTime("");
    notify("Event added to project calendar! 📅");
  }

  // Handle delete custom event
  async function handleDeleteEvent(rawId) {
    const ok = await confirmDialog({
      title: "Remove Event",
      message: "Are you sure you want to remove this event from the project calendar?",
      confirmText: "Remove Event",
      type: "danger",
    });
    if (!ok) return;
    setCustomEvents((prev) => prev.filter((e) => e.id !== rawId));
    await request(`/api/projects/${project.id}/events?eventId=${rawId}`, "DELETE");
    notify("Event removed.");
  }

  // Events on the currently selected date
  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return [];
    return combinedEvents.filter((e) => e.date === selectedDate);
  }, [combinedEvents, selectedDate]);

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      {/* ---------------- 1. CLEAN HEADER (No Add Task Button) ---------------- */}
      <div className="panel flex flex-col justify-between gap-3 p-3.5 sm:p-4 lg:flex-row lg:items-center lg:gap-4">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 sm:items-center sm:justify-start">
            <h3 className="text-[16.5px] font-bold leading-snug text-ink sm:text-[18px]">{project.name} Calendar</h3>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              {combinedEvents.length} scheduled item{combinedEvents.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted sm:mt-0.5 sm:text-[13px]">
            Click on any date to schedule meetings, project milestones, releases, or deadlines.
          </p>
        </div>

        <div className="flex flex-nowrap items-center justify-between gap-1.5 sm:flex-wrap sm:justify-start sm:gap-2.5">
          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            {/* Month Stepper */}
            <div className="inline-flex shrink-0 items-center rounded-xl border border-line bg-white p-0.5 shadow-2xs sm:gap-1 sm:p-1">
              <button
                type="button"
                onClick={() => setPicked(addMonths(date, -1))}
                className="grid h-6 w-5 place-items-center rounded-lg text-ink/65 hover:bg-black/5 hover:text-ink sm:h-8 sm:w-8"
                title="Previous month"
              >
                <ChevronLeft size={14} className="sm:h-[15px] sm:w-[15px]" />
              </button>
              <span className="min-w-[58px] px-0.5 text-center text-[11px] font-bold text-ink whitespace-nowrap sm:hidden">
                {shortMonthTitle.format(parseLocalDate(date))}
              </span>
              <span className="hidden min-w-[130px] px-1 text-center text-[13.5px] font-bold text-ink sm:inline">
                {monthTitle.format(parseLocalDate(date))}
              </span>
              <button
                type="button"
                onClick={() => setPicked(addMonths(date, 1))}
                className="grid h-6 w-5 place-items-center rounded-lg text-ink/65 hover:bg-black/5 hover:text-ink sm:h-8 sm:w-8"
                title="Next month"
              >
                <ChevronRight size={14} className="sm:h-[15px] sm:w-[15px]" />
              </button>
            </div>

            {/* Today Button */}
            {date !== todayDate && (
              <button
                type="button"
                onClick={() => setPicked(todayDate)}
                className="shrink-0 rounded-xl border border-line bg-white px-2 py-1 text-[10.5px] font-bold text-brand-700 transition hover:bg-[#f6faf7] sm:px-3 sm:py-1.5 sm:text-[12.5px]"
              >
                Today
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex shrink-0 items-center rounded-xl border border-line bg-[#f4f7f5] p-0.5 text-[10.5px] font-semibold sm:text-[12.5px]">
            {["month", "week", "agenda"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-1.5 py-1 capitalize transition sm:px-2.5 sm:py-1.5 ${
                  view === v ? "bg-white font-bold text-ink shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- 2. UPCOMING DROPDOWN ---------------- */}
      {upcoming.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white shadow-2xs">
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
                Upcoming <span className="hidden sm:inline">Schedule</span>
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
              {upcoming.slice(0, 8).map((evt) => {
                const typeConfig = EVENT_TYPES.find((t) => t.id === evt.kind);
                const Icon = typeConfig?.icon || CalendarIcon;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => {
                      setPicked(evt.date);
                      setSelectedDate(evt.date);
                      setUpcomingOpen(false);
                    }}
                    className="flex w-full items-start justify-between gap-2.5 rounded-xl border border-line/80 bg-white p-2.5 text-left transition hover:border-brand-400 hover:bg-[#f5faf7]"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${
                          typeConfig?.badge || "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <Icon size={12} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold leading-snug text-ink sm:text-[13px]">
                          {evt.title}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted">
                          {typeConfig?.label || (evt.key ? `Task (${evt.key})` : "Task")}
                          {evt.time ? ` · ${formatClock(evt.time)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#f2f6f3] px-2 py-1 text-[11px] font-bold text-brand-800">
                      {dayMonth.format(parseLocalDate(evt.date))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. MAIN CALENDAR GRID ---------------- */}
      <div className="panel min-w-0 p-1.5 sm:p-5">
        {view === "month" && (
          <MonthGrid
            date={date}
            events={combinedEvents}
            todayDate={todayDate}
            enablePopover={false}
            onSelect={(d) => {
              setPicked(d);
              setSelectedDate(d);
            }}
            onOpenDay={(d) => {
              setPicked(d);
              setSelectedDate(d);
            }}
          />
        )}

        {view === "week" && (
          <WeekView
            date={date}
            events={combinedEvents}
            todayDate={todayDate}
            onOpenDay={(d) => {
              setPicked(d);
              setSelectedDate(d);
            }}
          />
        )}

        {view === "agenda" && (
          <div className="max-w-2xl mx-auto py-2">
            <AgendaView events={combinedEvents} todayDate={todayDate} />
          </div>
        )}
      </div>

      {/* ---------------- 4. DATE CLICK MODAL: ADD EVENT & VIEW SCHEDULE ---------------- */}
      {selectedDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3.5 sm:p-4 backdrop-blur-xs"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-150 max-h-[86dvh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-3.5 shrink-0">
              <div>
                <p className="eyebrow">Project Schedule</p>
                <h3 className="text-[19px] font-bold text-ink tracking-tight">
                  {longDate(selectedDate, true)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 custom-scrollbar">
              {/* Existing Items on this Date */}
              <div>
                <h4 className="text-[13px] font-bold text-ink/75 uppercase tracking-wide mb-2">
                  Scheduled on this day ({selectedDayItems.length})
                </h4>

                {selectedDayItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line bg-[#f8faf9] p-4 text-center text-[13px] text-muted">
                    No tasks or events scheduled for this day yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayItems.map((item) => {
                      const isCustom = item.source === "project_event";
                      const typeConfig = EVENT_TYPES.find((t) => t.id === item.kind);
                      const Icon = typeConfig?.icon || CalendarIcon;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[#fafcfb] p-3 text-[13.5px]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${typeConfig?.badge || "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                              <Icon size={14} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate leading-tight">{item.title}</p>
                              <p className="text-[11.5px] text-muted flex items-center gap-1.5 mt-0.5">
                                <span className="capitalize font-semibold text-brand-800">
                                  {typeConfig?.label || (item.key ? `Task (${item.key})` : "Task")}
                                </span>
                                {item.time && <span>· {formatClock(item.time)}</span>}
                                {item.creatorName && <span>· By {item.creatorName}</span>}
                              </p>
                            </div>
                          </div>

                          {/* Delete custom event button */}
                          {isCustom && (isProjAdmin || item.createdBy === currentUser?.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(item.rawId)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink/40 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete event"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Event Form */}
              <div className="rounded-2xl border border-line bg-[#f9fbf9] p-4">
                <h4 className="text-[14px] font-bold text-ink mb-3 flex items-center gap-1.5">
                  <Plus size={16} className="text-brand-700" /> Add Event on this Date
                </h4>

                <form onSubmit={handleCreateEvent} className="space-y-3.5">
                  {/* Event Type Pills */}
                  <div>
                    <label className="block text-[12px] font-semibold text-ink/70 mb-1.5">Event Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map((t) => {
                        const active = newType === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewType(t.id)}
                            className={`flex items-center gap-2 rounded-xl p-2 text-[12.5px] font-medium border transition ${
                              active
                                ? "border-brand-600 bg-white text-brand-900 shadow-2xs ring-1 ring-brand-500 font-bold"
                                : "border-line bg-white text-ink/70 hover:bg-[#f2f5f3]"
                            }`}
                          >
                            <span className={`grid h-6 w-6 place-items-center rounded-lg border ${t.badge}`}>
                              <Icon size={13} />
                            </span>
                            <span className="truncate">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[12px] font-semibold text-ink/70 mb-1">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Client Walkthrough, Beta Launch, Sprint Review..."
                      className="w-full h-[38px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  {/* Time (Optional) */}
                  <div>
                    <label className="block text-[12px] font-semibold text-ink/70 mb-1">
                      Time <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full h-[38px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newTitle.trim() || submitting}
                    className="w-full rounded-xl bg-brand-700 py-2.5 text-[13.5px] font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-40 transition"
                  >
                    {submitting ? "Adding..." : "+ Add Event"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
