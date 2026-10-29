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
  Plus,
  Search,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import DayDiscussion from "@/components/comments/DayDiscussion";
import Dropdown from "@/components/ui/Dropdown";
import StickyBoard from "@/components/sticky/StickyBoard";
import TodoBoard from "@/components/overview/TodoBoard";
import { longDate, shiftDate } from "@/lib/datetime";
import KanbanBoard from "./KanbanBoard";
import WeekView from "./WeekView";
import MiniCalendar from "./MiniCalendar";
import FocusPanel from "./FocusPanel";
import NewTodoModal from "./NewTodoModal";

const chip = {
  all: "bg-[#e9f5ec] text-brand-800 hover:bg-[#dcf0e1]",
  high: "bg-[#fde4e4] text-[#d63a3a]",
  medium: "bg-[#fdf0cc] text-[#9a6f08]",
  low: "bg-[#dcf3e0] text-[#2d7a45]",
};
const navBtn = "icon-btn h-[38px] w-[38px]";
const modes = [
  { id: "kanban", label: "Kanban", Icon: Columns3 },
  { id: "list", label: "List", Icon: List },
  { id: "calendar", label: "Calendar", Icon: Calendar },
];

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
        className="inline-flex h-[36px] items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13.5px] font-medium hover:bg-[#f6faf7]"
      >
        {current ? current.name : "Project"}
        <ChevronDown size={16} className="shrink-0" />
      </button>
      {open && (
        <div className="menu-popover left-0 right-auto min-w-[230px]" role="listbox">
          <button onClick={() => pick("all")}>
            All projects {value === "all" && <Check size={16} className="ml-auto" />}
          </button>
          <hr />
          {projects.map((project) => (
            <button key={project.id} onClick={() => pick(project.id)}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: project.color }} />
              <span>{project.name}</span>
              {value === project.id && <Check size={16} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DailyBoard() {
  const { todos, projects, todayDate, carryOverTodos, users, currentUser } = useApp();
  const [assignee, setAssignee] = useState(currentUser.id); // "all" | "none" | a user id
  const [picked, setPicked] = useState(null);
  const [mode, setMode] = useState("kanban");
  const [priority, setPriority] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [search, setSearch] = useState("");
  const [modalStatus, setModalStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dateInput = useRef(null);
  useCloseOnOutsideClick(menuOpen, () => setMenuOpen(false));

  const date = picked ?? todayDate;
  const byAssignee = (todo) => assignee === "all" || (assignee === "none" ? todo.assigneeId == null : todo.assigneeId === assignee);
  const assigneeOptions = [
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

  const pills = [
    { id: "all", label: "All Tasks", count: dayTodos.length },
    { id: "high", label: "High", count: count("high"), icon: <span className="h-3.5 w-3.5 rounded-full border-2 border-[#e5484d]" /> },
    { id: "medium", label: "Medium", count: count("medium"), icon: <span className="h-3.5 w-3.5 rounded-full bg-[#f59e0b]" /> },
    { id: "low", label: "Low", count: count("low"), icon: <ChevronsDown size={16} strokeWidth={2.6} className="text-[#2e9e4f]" /> },
  ];

  return (
    <div className="relative grid gap-5 px-5 pb-6 md:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative min-w-0">
        {/* Title on the left, date controls on the right of the same row (stacked only on phones). */}
        <header className="flex flex-col gap-4 pb-5 pt-[26px] md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0">
            <p className="eyebrow !text-ink/80">Daily To-Do</p>
            <h1 className="mt-1 text-[38px] font-extrabold leading-tight tracking-tight md:text-[42px]">
              Task <span className="text-brand-600">Board</span>
            </h1>
            <p className="mt-0.5 text-[17px] text-muted">Organize your day with a simple kanban board.</p>
          </div>

          <div className="relative flex shrink-0 items-center gap-2 pb-1">
            <button className={navBtn} onClick={() => setPicked(shiftDate(date, -1))} aria-label="Previous day">
              <ChevronLeft size={19} />
            </button>
            <button
              onClick={openPicker}
              className="flex h-[38px] items-center gap-2.5 whitespace-nowrap rounded-lg border border-line bg-white px-4 text-[14px] font-medium shadow-[0_1px_3px_rgba(16,60,35,0.06)] hover:bg-[#f6faf7]"
            >
              <CalendarDays size={18} strokeWidth={1.7} />
              {longDate(date, true)}
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
              <ChevronRight size={19} />
            </button>
            <button className="btn-secondary h-[38px] px-4" onClick={() => setPicked(null)}>
              Today
            </button>
          </div>
        </header>

        <section className="panel p-[10px]">
          <div className="flex flex-wrap items-center gap-2 px-1 pb-3 pt-1">
            {pills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setPriority(pill.id)}
                className={`inline-flex h-[36px] items-center gap-1.5 rounded-lg px-3 text-[13.5px] transition ${
                  pill.id === "all" && priority === "all" ? "bg-brand-700 font-semibold text-white shadow-md" : `${chip[pill.id]} font-medium`
                } ${pill.id !== "all" && priority === pill.id ? "ring-2 ring-current/40" : ""}`}
              >
                {pill.icon}
                {pill.label} ({pill.count})
              </button>
            ))}

            <ProjectFilter projects={projects} value={projectId} onChange={setProjectId} />
            <Dropdown label="For" value={assignee} options={assigneeOptions} onChange={setAssignee} className="!h-[36px] !rounded-lg !px-3 !text-[13.5px] !shadow-none" />

            <label className="flex h-[36px] min-w-[150px] flex-1 items-center gap-2.5 rounded-lg border border-line bg-white px-3">
              <Search size={18} className="shrink-0 text-ink/70" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-full min-w-0 bg-transparent text-[13.5px] outline-none placeholder:text-muted"
              />
            </label>

            <button className="btn-primary !h-9 !px-3.5 !text-[13.5px]" onClick={() => setModalStatus("todo")}>
              <Plus size={17} /> Add task
            </button>
          </div>

          {mode === "kanban" && <KanbanBoard todos={visible} onAdd={setModalStatus} />}
          {mode === "list" && <TodoBoard bare title="Task list" date={date} todos={visible} />}
          {mode === "calendar" && <WeekView date={date} todayDate={todayDate} todos={todos.filter(matches)} onSelect={setPicked} />}
        </section>
      </div>

      <aside className="relative space-y-4 pt-[26px]">
        <div className="relative z-20 flex items-center gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`inline-flex h-[38px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13.5px] transition ${
                mode === item.id
                  ? "bg-brand-700 font-semibold text-white shadow-md"
                  : "border border-line bg-white font-medium shadow-[0_1px_2px_rgba(16,60,35,0.05)] hover:bg-[#f6faf7]"
              }`}
            >
              <item.Icon size={16} className="shrink-0" />
              {item.label}
            </button>
          ))}
          <div className="relative shrink-0">
            <button
              className="icon-btn h-[38px] w-[38px]"
              aria-label="More actions"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
            >
              <Ellipsis size={18} />
            </button>
            {menuOpen && (
              <div className="menu-popover">
                <button onClick={() => carryOverTodos(date)}>
                  <CalendarClock size={16} /> Move unfinished to tomorrow
                </button>
              </div>
            )}
          </div>
        </div>

        <StickyBoard compact />
        <MiniCalendar date={date} todayDate={todayDate} onSelect={setPicked} />
        <DayDiscussion date={date} />
        <FocusPanel title={date === todayDate ? "Today's Focus" : "Focus for the day"} date={date} />
      </aside>

      {modalStatus && <NewTodoModal key={modalStatus} initialStatus={modalStatus} date={date} onClose={() => setModalStatus(null)} />}
    </div>
  );
}
