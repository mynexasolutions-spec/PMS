"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Clock,
  Edit3,
  Flame,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CommentButton from "@/components/comments/CommentButton";
import AssigneePicker from "@/components/ui/AssigneePicker";
import { can } from "@/lib/permissions";

const columns = [
  { id: "todo", label: "To do", hint: "Ready to start", dot: "bg-slate-400", badge: "bg-slate-200/70 text-slate-700", border: "border-slate-200/80", bg: "bg-[#f8fafc]" },
  { id: "progress", label: "In progress", hint: "Active work", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700", border: "border-blue-200/70", bg: "bg-[#f5f8ff]" },
  { id: "review", label: "In Review / QA", hint: "Testing & QA", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700", border: "border-purple-200/70", bg: "bg-[#faf7ff]" },
  { id: "done", label: "Done", hint: "Completed", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", border: "border-emerald-200/70", bg: "bg-[#f4fbf6]" },
];

const STATUS_ORDER = ["todo", "progress", "review", "done"];

const typeStyle = {
  Feature: { badge: "bg-[#efe4fb] text-[#7c3aed]", border: "#8b5cf6" },
  Task: { badge: "bg-[#e0ecff] text-[#2b5fd6]", border: "#3b82f6" },
  Bug: { badge: "bg-[#fde4e4] text-[#c02626]", border: "#e5484d" },
  Subtask: { badge: "bg-[#fdf0cc] text-[#8a6508]", border: "#f0a020" },
};
const priorityDot = { high: "#e5484d", medium: "#f0a020", low: "#2e9e4f" };

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const formatDue = (value) => (value ? shortDate.format(new Date(value)) : "No due date");

function IssueCard({ task }) {
  const { updateTask, deleteTask, openIssueModal, currentUser } = useApp();
  const style = typeStyle[task.type] ?? typeStyle.Task;

  const isBlocked = task.status === "blocked" || Boolean(task.blockerReason && task.status !== "done");
  const effectiveStatus = task.status === "blocked" ? "progress" : task.status;
  const statusIndex = STATUS_ORDER.indexOf(effectiveStatus);
  const canMoveLeft = statusIndex > 0;
  const canMoveRight = statusIndex < STATUS_ORDER.length - 1;

  const moveLeft = () => canMoveLeft && updateTask(task.id, { status: STATUS_ORDER[statusIndex - 1] });
  const moveRight = () => canMoveRight && updateTask(task.id, { status: STATUS_ORDER[statusIndex + 1] });

  const hasTime = (task.estimateHours ?? 0) > 0 || (task.loggedHours ?? 0) > 0;
  const isOverEstimate = (task.estimateHours ?? 0) > 0 && (task.loggedHours ?? 0) > (task.estimateHours ?? 0);
  const progressPct = task.estimateHours > 0 ? Math.min(100, Math.round(((task.loggedHours ?? 0) / task.estimateHours) * 100)) : 0;

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("taskId", String(task.id))}
      className={`group relative cursor-grab overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md hover:border-slate-300 active:cursor-grabbing ${
        isBlocked ? "ring-2 ring-rose-400/80 border-rose-300" : ""
      }`}
      style={{ borderLeftWidth: "4px", borderLeftColor: isBlocked ? "#e11d48" : style.border }}
    >
      {/* Floating Action Bar (Only shows on group hover, DOES NOT steal width from the header!) */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 rounded-lg border border-line/80 bg-white/95 px-1 py-0.5 shadow-md backdrop-blur-xs z-10">
        {canMoveLeft && (
          <button
            className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-ink hover:bg-black/5"
            title={`Move to ${columns.find((c) => c.id === STATUS_ORDER[statusIndex - 1])?.label}`}
            onClick={moveLeft}
          >
            <ArrowLeft size={12} />
          </button>
        )}
        {canMoveRight && (
          <button
            className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-ink hover:bg-black/5"
            title={`Move to ${columns.find((c) => c.id === STATUS_ORDER[statusIndex + 1])?.label}`}
            onClick={moveRight}
          >
            <ArrowRight size={12} />
          </button>
        )}
        <button
          className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-brand-700 hover:bg-[#e8f6ec]"
          title="Create subtask"
          onClick={() => openIssueModal(task)}
        >
          <Plus size={12} />
        </button>
        <button
          className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-brand-700 hover:bg-black/5"
          title="Edit task & hours"
          onClick={() => openIssueModal(null, null, null, task)}
        >
          <Edit3 size={11} />
        </button>
        {can.deleteTask(currentUser, task) && (
          <button
            className="grid h-5 w-5 place-items-center rounded-md text-ink/40 hover:text-red-600 hover:bg-red-50"
            title="Delete task"
            onClick={() => deleteTask(task)}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Top Header: Badge + Issue Key (Clean, single-line, NO WRAPPING!) */}
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold shrink-0 ${style.badge}`}>
          {task.type}
        </span>
        <button
          onClick={() => openIssueModal(null, null, null, task)}
          className="text-[12px] font-mono font-semibold text-ink/65 hover:text-brand-700 transition whitespace-nowrap"
          title="Click to view/edit task"
        >
          {task.issueKey}
        </button>
      </div>

      {/* Task Title */}
      <h4
        onClick={() => openIssueModal(null, null, null, task)}
        className="mt-1.5 text-[13.5px] font-semibold text-ink/90 leading-[1.35] line-clamp-2 hover:text-brand-700 transition cursor-pointer"
        title={task.title}
      >
        {task.title}
      </h4>

      {/* Subtask Parent Reference (Compact chip instead of long cut-off text) */}
      {task.parentKey && (
        <p
          className="mt-1 inline-flex items-center gap-1 rounded bg-black/[0.03] px-1.5 py-0.5 text-[10.5px] text-muted font-medium max-w-full truncate"
          title={`Subtask of ${task.parentKey} · ${task.parentTitle}`}
        >
          <span>↳ Subtask of</span>
          <b className="font-semibold text-ink/70">{task.parentKey}</b>
        </p>
      )}

      {/* Blocker Alert Banner on Card */}
      {isBlocked && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50/95 p-2 text-[11px] text-rose-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-600 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 font-bold text-rose-700 uppercase text-[9.5px] tracking-wide">
              <span>Blocked</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTask(task.id, { status: "progress", blockerReason: null });
                }}
                className="text-brand-700 hover:underline normal-case font-semibold text-[10.5px]"
              >
                Unblock
              </button>
            </div>
            <p className="line-clamp-2 font-medium leading-tight text-rose-900 mt-0.5">
              {task.blockerReason || "Waiting on external dependency"}
            </p>
          </div>
        </div>
      )}

      {/* Time Tracking Progress */}
      {hasTime && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className={`inline-flex items-center gap-1 font-medium ${isOverEstimate ? "text-rose-600 font-semibold" : "text-ink/65"}`}>
              <Clock size={11} className="shrink-0" />
              <span>{task.loggedHours ?? 0}h / {task.estimateHours ?? 0}h</span>
            </span>
            {isOverEstimate && (
              <span className="text-[9.5px] font-bold text-rose-600">Over estimate!</span>
            )}
          </div>
          {task.estimateHours > 0 && (
            <div className="h-1 w-full rounded-full bg-black/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isOverEstimate ? "bg-rose-500" : "bg-brand-600"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Footer (Single Clean Row) */}
      <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-line/60 pt-2 text-[11px] text-ink/65">
        <div className="flex min-w-0 items-center gap-1 truncate">
          <i
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: priorityDot[task.priority] }}
            title={`${task.priority} priority`}
          />
          <span className="truncate font-medium">{task.projectName}</span>
          <span className="text-black/30">·</span>
          <time className="shrink-0 whitespace-nowrap text-muted">{formatDue(task.dueAt)}</time>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <CommentButton scope="task" refId={task.id} title={`${task.issueKey} · ${task.title}`} />
          <AssigneePicker
            align="right"
            size={20}
            value={task.assigneeId}
            onChange={(assigneeId) => updateTask(task.id, { assigneeId })}
          />
        </div>
      </div>
    </article>
  );
}

/** 4-Column Zero-Scroll Task Board with Collapsible Done Column & Floating Actions */
export default function IssueBoard({ tasks, eyebrow, title, subtitle }) {
  const { updateTask, openIssueModal, currentUser } = useApp();
  const [over, setOver] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'mine' | 'blocked' | 'high'
  const [doneCollapsed, setDoneCollapsed] = useState(false);

  // Quick Filters logic
  const filteredTasks = useMemo(() => {
    switch (filterMode) {
      case "mine":
        return tasks.filter((t) => t.assigneeId === currentUser?.id);
      case "blocked":
        return tasks.filter((t) => t.status === "blocked" || Boolean(t.blockerReason));
      case "high":
        return tasks.filter((t) => t.priority === "high");
      default:
        return tasks;
    }
  }, [tasks, filterMode, currentUser?.id]);

  const blockedCount = tasks.filter((t) => t.status === "blocked" || Boolean(t.blockerReason)).length;
  const myCount = tasks.filter((t) => t.assigneeId === currentUser?.id).length;
  const highCount = tasks.filter((t) => t.priority === "high").length;

  function drop(event, status) {
    event.preventDefault();
    setOver(null);
    const id = Number(event.dataTransfer.getData("taskId"));
    const task = tasks.find((item) => item.id === id);
    if (task && task.status !== status) void updateTask(id, { status });
  }

  return (
    <section className="panel p-4 sm:p-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="text-[19px] sm:text-[21px] font-bold tracking-tight">{title}</h2>
          <span className="text-[12.5px] sm:text-[13.5px] text-muted">{subtitle}</span>
        </div>
        <button className="btn-primary btn-compact shrink-0 ml-auto sm:ml-0" onClick={() => openIssueModal()}>
          <Plus size={16} /> Create task
        </button>
      </div>

      {/* Filter Chips + Legend */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-line/60 pb-3">
        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode("all")}
            className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              filterMode === "all"
                ? "bg-ink text-white shadow-xs"
                : "bg-black/[0.04] text-ink/70 hover:bg-black/[0.08]"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilterMode("mine")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              filterMode === "mine"
                ? "bg-ink text-white shadow-xs"
                : "bg-black/[0.04] text-ink/70 hover:bg-black/[0.08]"
            }`}
          >
            <User size={13} /> My tasks ({myCount})
          </button>
          <button
            onClick={() => setFilterMode("blocked")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              filterMode === "blocked"
                ? "bg-rose-600 text-white shadow-xs"
                : blockedCount > 0
                ? "bg-rose-100 text-rose-700 font-bold hover:bg-rose-200"
                : "bg-black/[0.04] text-ink/70 hover:bg-black/[0.08]"
            }`}
          >
            <AlertCircle size={13} /> Blocked ({blockedCount})
          </button>
          <button
            onClick={() => setFilterMode("high")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              filterMode === "high"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-black/[0.04] text-ink/70 hover:bg-black/[0.08]"
            }`}
          >
            <Flame size={13} /> High priority ({highCount})
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11.5px] font-semibold">
          {Object.entries(typeStyle).map(([type, style]) => (
            <span key={type} className={`rounded-md px-1.5 py-0.5 ${style.badge}`}>{type}</span>
          ))}
        </div>
      </div>

      {/* Board Columns: Zero Horizontal Scroll */}
      <div className="mt-3.5 flex items-start gap-3.5">
        {columns.map((column) => {
          const isDone = column.id === "done";
          const isCollapsed = isDone && doneCollapsed;

          const items = filteredTasks.filter((task) => {
            if (column.id === "progress") {
              return task.status === "progress" || task.status === "blocked";
            }
            return task.status === column.id;
          });

          // Collapsed Done Column (Slim 44px vertical strip)
          if (isCollapsed) {
            return (
              <section
                key={column.id}
                onClick={() => setDoneCollapsed(false)}
                className="flex flex-col items-center justify-between w-[44px] shrink-0 min-h-[420px] rounded-2xl border border-emerald-200/80 bg-[#f4fbf6] p-2.5 cursor-pointer hover:bg-[#e8f7ec] transition group shadow-xs"
                title="Click to expand Done column"
              >
                <div className="flex flex-col items-center gap-2 pt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="grid h-[20px] min-w-[20px] place-items-center rounded-full bg-emerald-100 px-1 text-[11px] font-bold text-emerald-800">
                    {items.length}
                  </span>
                </div>
                <div className="[writing-mode:vertical-lr] rotate-180 text-[13px] font-bold text-emerald-900 tracking-wide select-none">
                  Done Column
                </div>
                <div className="grid h-6 w-6 place-items-center rounded-md text-emerald-700 group-hover:bg-emerald-200/50">
                  <ChevronLeft size={16} />
                </div>
              </section>
            );
          }

          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(column.id);
              }}
              onDragLeave={() => setOver((current) => (current === column.id ? null : current))}
              onDrop={(event) => drop(event, column.id)}
              className={`flex flex-col flex-1 min-w-0 min-h-[420px] rounded-2xl border p-2.5 transition ${
                over === column.id
                  ? "border-brand-400 bg-[#e8f6ec] shadow-inner"
                  : `${column.border} ${column.bg}`
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 pt-1 px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${column.dot}`} />
                  <h3 className="text-[14px] font-bold text-ink leading-none truncate">{column.label}</h3>
                  <span
                    className={`grid h-[19px] min-w-[19px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold ${column.badge}`}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openIssueModal(null, null, null, null, column.id)}
                    title={`Add task to ${column.label}`}
                    className="grid h-5 w-5 place-items-center rounded-md text-ink/40 hover:text-ink hover:bg-black/5 transition"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Collapse button on Done column */}
                  {isDone && (
                    <button
                      onClick={() => setDoneCollapsed(true)}
                      title="Collapse Done column to give other columns more width"
                      className="grid h-5 w-5 place-items-center rounded-md text-ink/40 hover:text-ink hover:bg-black/5 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto custom-scrollbar px-0.5 py-0.5 pr-1 flex-1">
                {items.map((task) => (
                  <IssueCard key={task.id} task={task} />
                ))}
                {!items.length && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line/80 py-8 text-center text-muted">
                    <p className="text-[12px]">No tasks</p>
                    <button
                      onClick={() => openIssueModal(null, null, null, null, column.id)}
                      className="mt-1 text-[11px] font-semibold text-brand-700 hover:underline"
                    >
                      + Add task
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
