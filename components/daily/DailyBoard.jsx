"use client";

import { useRef, useState } from "react";
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Columns3,
  Ellipsis,
  List,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  StickyNote,
  Target,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import DayDiscussion from "@/components/comments/DayDiscussion";
import Dropdown from "@/components/ui/Dropdown";
import StickyBoard from "@/components/sticky/StickyBoard";
import TodoBoard from "@/components/overview/TodoBoard";
import { longDate, shiftDate, parseLocalDate } from "@/lib/datetime";
import KanbanBoard from "./KanbanBoard";
import WeekView from "./WeekView";
import FocusPanel from "./FocusPanel";
import NewTodoModal from "./NewTodoModal";

const chip = {
  all: "bg-[#eaf4ed] text-brand-800 hover:bg-[#dcf0e1]",
  high: "bg-[#fde8e8] text-[#d63a3a] hover:bg-[#fad4d4]",
  medium: "bg-[#fef2d6] text-[#9a6f08] hover:bg-[#fae6af]",
  low: "bg-[#dff3e3] text-[#2d7a45] hover:bg-[#c9ebd1]",
};
const navBtn = "icon-btn h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg hover:bg-[#f2f7f4] transition shrink-0";
const modes = [
  { id: "kanban", label: "Kanban", Icon: Columns3 },
  { id: "list", label: "List", Icon: List },
  { id: "calendar", label: "Calendar", Icon: Calendar },
];

function formatShortDate(value) {
  const d = parseLocalDate(value);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
  return `${weekday}, ${day} ${month}`;
}

/** Project filter: a button that is as wide as its label, so a long project name is never cut off. */
function ProjectFilter({ projects, value, onChange }) {
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));
  const current = projects.find((project) => project.id === value);
  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
        className="inline-flex h-[34px] sm:h-[36px] items-center justify-between gap-1.5 rounded-lg border border-line bg-white px-2.5 sm:px-3 text-[12.5px] sm:text-[13px] font-medium shadow-xs hover:bg-[#f6faf7] transition max-w-[150px]"
      >
        <span className="truncate">{current ? current.name : "Project"}</span>
        <ChevronDown size={14} className="shrink-0 text-muted" />
      </button>
      {open && (
        <div className="menu-popover left-0 right-auto min-w-[200px]" role="listbox">
          <button onClick={() => pick("all")}>
            All projects {value === "all" && <Check size={15} className="ml-auto" />}
          </button>
          <hr />
          {projects.map((project) => (
            <button key={project.id} onClick={() => pick(project.id)}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: project.color }} />
              <span className="truncate">{project.name}</span>
              {value === project.id && <Check size={15} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarTabsContent({ sidebarTabs, sidebarTab, setSidebarTab, date, todayDate }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Capsule Tab Bar (Idea A: Generous room so 'Standup' never truncates) */}
      <div className="flex items-center rounded-xl bg-[#f2f6f3] p-1 gap-1 shrink-0">
        {sidebarTabs.map((tab) => {
          const active = sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[12px] sm:text-[12.5px] font-medium transition rounded-lg whitespace-nowrap ${
                active
                  ? "bg-white text-brand-800 shadow-xs font-semibold"
                  : "text-ink/65 hover:text-ink hover:bg-white/50"
              }`}
            >
              <tab.Icon size={14} className={`shrink-0 ${active ? "text-brand-700" : "text-ink/55"}`} />
              <span className="whitespace-nowrap font-medium">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span
                  className={`grid h-[17px] min-w-[17px] shrink-0 place-items-center rounded-full px-1 text-[10px] font-bold ${
                    active ? "bg-brand-100 text-brand-800" : "bg-slate-200/80 text-ink/70"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Body with Clean Independent Scroll */}
      <div className="pt-3.5 flex-1 max-h-[calc(100vh-250px)] min-h-[460px] overflow-y-auto custom-scrollbar px-0.5">
        {sidebarTab === "discussion" && <DayDiscussion date={date} bare />}
        {sidebarTab === "focus" && <FocusPanel title={date === todayDate ? "Today's Focus" : "Focus for the day"} date={date} bare />}
        {sidebarTab === "notes" && <StickyBoard compact bare />}
      </div>
    </div>
  );
}

export default function DailyBoard() {
  const { todos, projects, todayDate, carryOverTodos, users, currentUser, commentCounts, focusItems, sticky, isMember, myProjects } = useApp();
  const [assignee, setAssignee] = useState(currentUser.id); // "all" | "none" | a user id
  const [picked, setPicked] = useState(null);
  const [mode, setMode] = useState("kanban");
  const [priority, setPriority] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [search, setSearch] = useState("");
  const [modalStatus, setModalStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("discussion"); // "discussion" | "focus" | "notes"
  const dateInput = useRef(null);
  useCloseOnOutsideClick(menuOpen, () => setMenuOpen(false));

  const date = picked ?? todayDate;
  const byAssignee = (todo) =>
    isMember ? todo.assigneeId === currentUser.id : assignee === "all" || (assignee === "none" ? todo.assigneeId == null : todo.assigneeId === assignee);
  const assigneeOptions = isMember
    ? [{ value: currentUser.id, label: `${currentUser.name} (me)` }]
    : [
        { value: "all", label: "Everyone" },
        ...users.filter((user) => user.active).map((user) => ({ value: user.id, label: user.id === currentUser.id ? `${user.name} (me)` : user.name })),
        { value: "none", label: "Unassigned" },
      ];
  const dayTodos = todos.filter((todo) => todo.todoDate === date && byAssignee(todo));
  const count = (key) => dayTodos.filter((todo) => todo.priority === key).length;

  const matches = (todo) =>
    byAssignee(todo) &&
    (priority === "all" || todo.priority === priority) &&
    (projectId === "all" || todo.projectId === projectId) &&
    (!search.trim() || `${todo.title} ${todo.projectName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const visible = dayTodos.filter(matches);

  function openPicker() {
    try {
      dateInput.current?.showPicker();
    } catch {
      dateInput.current?.focus();
    }
  }

  function handleToggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileDrawerOpen((open) => !open);
    } else {
      setSidebarOpen((open) => !open);
    }
  }

  const pills = [
    { id: "all", label: "All Tasks", count: dayTodos.length },
    { id: "high", label: "High", count: count("high"), icon: <span className="h-2.5 w-2.5 rounded-full border-2 border-[#e5484d]" /> },
    { id: "medium", label: "Medium", count: count("medium"), icon: <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> },
    { id: "low", label: "Low", count: count("low"), icon: <ChevronsDown size={15} strokeWidth={2.6} className="text-[#2e9e4f]" /> },
  ];

  // Right sidebar tab badges
  const dayCommentsCount = commentCounts[`day:${date}`] ?? 0;
  const pendingFocusCount = focusItems.filter((item) => item.focusDate === date && !item.done).length;
  const stickyCount = sticky?.length ?? 0;

  // Single-word clean tab labels
  const sidebarTabs = [
    { id: "discussion", label: "Standup", Icon: Moon, badge: dayCommentsCount },
    { id: "focus", label: "Focus", Icon: Target, badge: pendingFocusCount },
    { id: "notes", label: "Notes", Icon: StickyNote, badge: stickyCount },
  ];

  return (
    <div className="mx-auto max-w-[1720px] px-3.5 py-4 sm:px-5 sm:py-6 md:px-7 md:py-7">
      {/* 1. Header */}
      <header className="mb-5 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-[28px]">
                Task <span className="text-brand-700">Board</span>
              </h1>
              <span className="inline-flex items-center rounded-md bg-[#edf7f0] px-2 py-0.5 text-[11px] sm:text-[12px] font-semibold text-brand-800 border border-brand-200/60">
                Daily To-Do
              </span>
            </div>
            <p className="mt-0.5 text-[12px] sm:text-[13.5px] text-muted">Organize, track, and review today&apos;s work</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn-primary !h-[36px] sm:!h-[38px] !px-3.5 sm:!px-4 !text-[12.5px] sm:!text-[13.5px] font-semibold gap-1.5 shadow-sm"
              onClick={() => setModalStatus("todo")}
            >
              <Plus size={16} /> <span>Add task</span>
            </button>

            <button
              onClick={handleToggleSidebar}
              className={`relative icon-btn h-[36px] w-[36px] sm:h-[38px] sm:w-[38px] rounded-lg border transition shadow-xs ${
                sidebarOpen || mobileDrawerOpen
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-line bg-white text-ink/70 hover:bg-[#f6faf7]"
              }`}
              title="Review & Standup Panel"
              aria-label="Toggle side panel"
            >
              <PanelRightClose size={17} />
              {(dayCommentsCount > 0 || pendingFocusCount > 0) && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9.5px] font-bold text-white ring-2 ring-white shadow-xs">
                  {dayCommentsCount + pendingFocusCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Controls Row: Date Navigation & View Modes */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Date Controls */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1 rounded-xl border border-line bg-white p-1 shadow-xs">
            <button className={navBtn} onClick={() => setPicked(shiftDate(date, -1))} aria-label="Previous day">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={openPicker}
              className="flex h-8 sm:h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 sm:px-3 text-[12.5px] sm:text-[13.5px] font-medium hover:bg-[#f6faf7] transition"
            >
              <CalendarDays size={15} strokeWidth={1.8} className="text-brand-700 shrink-0" />
              <span className="hidden md:inline">{longDate(date, true)}</span>
              <span className="inline md:hidden">{formatShortDate(date)}</span>
            </button>
            <input
              ref={dateInput}
              type="date"
              value={date}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => event.target.value && setPicked(event.target.value)}
              className="pointer-events-none absolute left-12 top-[38px] h-0 w-0 opacity-0"
            />
            <button className={navBtn} onClick={() => setPicked(shiftDate(date, 1))} aria-label="Next day">
              <ChevronRight size={16} />
            </button>
            <button
              className={`h-8 sm:h-9 rounded-lg px-2.5 sm:px-3 text-[12px] sm:text-[13px] font-medium transition ${
                date === todayDate
                  ? "bg-brand-50 text-brand-800 font-semibold border border-brand-200/50"
                  : "text-ink/75 hover:bg-[#f6faf7]"
              }`}
              onClick={() => setPicked(null)}
            >
              Today
            </button>
          </div>

          {/* View Modes Capsule */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-xl border border-line bg-white p-1 shadow-xs">
            <div className="flex flex-1 sm:flex-initial items-center">
              {modes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`inline-flex flex-1 sm:flex-initial h-8 sm:h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-[12.5px] sm:text-[13px] font-medium transition ${
                    mode === item.id
                      ? "bg-brand-700 font-semibold text-white shadow-xs"
                      : "text-ink/75 hover:bg-[#f6faf7]"
                  }`}
                >
                  <item.Icon size={14} className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="relative ml-1 border-l border-line pl-1 shrink-0">
              <button
                className="icon-btn h-8 sm:h-9 w-8 sm:w-9 rounded-lg hover:bg-[#f6faf7]"
                aria-label="More actions"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((open) => !open);
                }}
              >
                <Ellipsis size={15} />
              </button>
              {menuOpen && (
                <div className="menu-popover right-0 left-auto min-w-[220px]">
                  <button onClick={() => carryOverTodos(date)}>
                    <CalendarClock size={16} /> Move unfinished to tomorrow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Grid Layout (Idea A: 385px right sidebar for comfortable tab spacing) */}
      <div className={`grid gap-5 sm:gap-6 transition-all ${sidebarOpen ? "xl:grid-cols-[minmax(0,1fr)_385px]" : "grid-cols-1"}`}>
        {/* Main Board Area */}
        <div className="min-w-0">
          <section className="panel rounded-2xl border border-line/80 bg-white p-3.5 sm:p-5 md:p-6 shadow-xs">
            {/* Filter Controls: Idea 1 (2 Structured Clean Rows) */}
            <div className="space-y-3.5 border-b border-line/60 pb-4">
              {/* Row 1: Priority Filter Strip + Corner Counter (Zero Scrollbar) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {pills.map((pill) => {
                    const isSelected = priority === pill.id;
                    return (
                      <button
                        key={pill.id}
                        onClick={() => setPriority(pill.id)}
                        className={`inline-flex h-[32px] sm:h-[34px] items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-[12px] sm:text-[12.5px] transition ${
                          isSelected
                            ? "bg-brand-700 font-semibold text-white shadow-xs"
                            : `${chip[pill.id]} font-medium`
                        }`}
                      >
                        {pill.icon}
                        <span className="whitespace-nowrap">{pill.label}</span>
                        <span
                          className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-bold ${
                            isSelected ? "bg-white/25 text-white" : "bg-black/5 text-ink/80"
                          }`}
                        >
                          {pill.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Top Corner Task Counter Badge */}
                <div className="shrink-0 rounded-lg bg-[#f0f4f1] border border-line/70 px-2.5 py-1 text-[11.5px] sm:text-[12px] font-medium text-muted">
                  Showing <span className="font-semibold text-ink/85">{visible.length}</span> of {dayTodos.length} tasks
                </div>
              </div>

              {/* Row 2: Search Input (Full breathing width) + Project & Assignee Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex h-[36px] flex-1 min-w-[180px] items-center gap-2.5 rounded-lg border border-line bg-white px-3 shadow-xs focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition">
                  <Search size={15} className="shrink-0 text-muted" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tasks..."
                    className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted"
                  />
                </label>

                <ProjectFilter projects={isMember ? myProjects : projects} value={projectId} onChange={setProjectId} />

                {!isMember ? (
                  <Dropdown
                    label="For"
                    value={assignee}
                    options={assigneeOptions}
                    onChange={setAssignee}
                    align="right"
                    className="!h-[36px] !rounded-lg !px-3 !text-[13px] !shadow-xs max-w-[190px]"
                  />
                ) : (
                  <span className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-line bg-[#f4fbf6] px-3 text-[13px] font-semibold text-brand-800 shadow-xs">
                    For me
                  </span>
                )}
              </div>
            </div>

            {/* Board Content */}
            <div className="pt-4 sm:pt-5">
              {mode === "kanban" && <KanbanBoard todos={visible} onAdd={setModalStatus} />}
              {mode === "list" && <TodoBoard bare title="Task list" date={date} todos={visible} />}
              {mode === "calendar" && <WeekView date={date} todayDate={todayDate} todos={todos.filter(matches)} onSelect={setPicked} />}
            </div>
          </section>
        </div>

        {/* 3. Desktop Inline Right Sidebar (385px width) */}
        {sidebarOpen && (
          <aside className="hidden xl:flex xl:flex-col rounded-2xl border border-line/80 bg-white p-4 shadow-xs">
            <SidebarTabsContent
              sidebarTabs={sidebarTabs}
              sidebarTab={sidebarTab}
              setSidebarTab={setSidebarTab}
              date={date}
              todayDate={todayDate}
            />
          </aside>
        )}
      </div>

      {/* 4. Mobile Slide-Over Drawer for Standup, Focus & Notes */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 flex w-full max-w-[385px] flex-col bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Moon size={18} className="text-brand-700" />
                <h3 className="text-[15px] font-bold text-ink">Daily Review & Standup</h3>
              </div>
              <button
                className="icon-btn h-8 w-8 rounded-lg hover:bg-slate-100 text-ink/70 transition"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-3 flex-1 overflow-hidden flex flex-col">
              <SidebarTabsContent
                sidebarTabs={sidebarTabs}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                date={date}
                todayDate={todayDate}
              />
            </div>
          </div>
        </div>
      )}

      {modalStatus && <NewTodoModal key={modalStatus} initialStatus={modalStatus} date={date} onClose={() => setModalStatus(null)} />}
    </div>
  );
}
