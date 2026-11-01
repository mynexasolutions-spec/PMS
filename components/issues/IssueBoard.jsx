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
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
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
const priorityDot = { high: "#e5484d", medium: "#f0a020", low: "#2e9e4f" };

function IssueCard({ task, targetProjectId }) {
  const { updateTask, deleteTask, openIssueModal, currentUser } = useApp();

  const isBlocked = task.status === "blocked" || Boolean(task.blockerReason && task.status !== "done");
  const effectiveStatus = task.status === "blocked" ? "progress" : task.status;
  const statusIndex = STATUS_ORDER.indexOf(effectiveStatus);
  const canMoveLeft = statusIndex > 0;
  const canMoveRight = statusIndex < STATUS_ORDER.length - 1;

  const moveLeft = () => canMoveLeft && updateTask(task.id, { status: STATUS_ORDER[statusIndex - 1] });
  const moveRight = () => canMoveRight && updateTask(task.id, { status: STATUS_ORDER[statusIndex + 1] });

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("taskId", String(task.id))}
      className={`group relative cursor-grab overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md hover:border-slate-300 active:cursor-grabbing ${
        isBlocked ? "ring-2 ring-rose-400/80 border-rose-300" : ""
      }`}
      style={{ borderLeftWidth: "4px", borderLeftColor: isBlocked ? "#e11d48" : priorityDot[task.priority] || "#3b82f6" }}
    >
      {/* Floating Action Bar */}
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
          onClick={() => openIssueModal(task, targetProjectId || task.projectId)}
        >
          <Plus size={12} />
        </button>
        <button
          className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-brand-700 hover:bg-black/5"
          title="Edit task"
          onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
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

      {/* Top Header: Issue Key */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
          className="text-[12px] font-mono font-semibold text-brand-800 hover:text-brand-900 transition whitespace-nowrap"
          title="Click to view/edit task"
        >
          {task.issueKey}
        </button>
      </div>

      {/* Task Title */}
      <h4
        onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
        className="mt-1.5 text-[13.5px] font-semibold text-ink/90 leading-[1.35] line-clamp-2 hover:text-brand-700 transition cursor-pointer"
        title={task.title}
      >
        {task.title}
      </h4>

      {/* Subtask Parent Reference */}
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

      {/* Bottom Footer */}
      <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-line/60 pt-2 text-[11px] text-ink/65">
        <div className="flex min-w-0 items-center gap-1.5 truncate">
          <i
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: priorityDot[task.priority] }}
            title={`${task.priority} priority`}
          />
          <span className="capitalize font-semibold text-ink/80 text-[11.5px]">{task.priority}</span>
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

/** Rich Tabular View grouped by stage with inline status change, sort, and actions */
function TaskTableView({ filteredTasks, columns, openIssueModal, updateTask, deleteTask, currentUser, targetProjectId }) {
  const [collapsedStages, setCollapsedStages] = useState({});

  const toggleStage = (stageId) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  return (
    <div className="mt-3.5 space-y-3.5">
      {columns.map((column) => {
        const isCollapsed = Boolean(collapsedStages[column.id]);
        const items = filteredTasks.filter((task) => {
          if (column.id === "progress") {
            return task.status === "progress" || task.status === "blocked";
          }
          return task.status === column.id;
        });

        return (
          <div key={column.id} className="rounded-xl border border-line bg-white overflow-hidden shadow-xs">
            {/* Stage Accordion Header */}
            <div
              onClick={() => toggleStage(column.id)}
              className="flex items-center justify-between px-4 py-2.5 bg-[#f8faf9] border-b border-line/70 cursor-pointer select-none hover:bg-[#f0f5f2] transition"
            >
              <div className="flex items-center gap-2.5">
                <button type="button" className="text-ink/60 hover:text-ink">
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                <span className="font-bold text-[14.5px] text-ink">{column.label}</span>
                <span className={`grid h-[20px] min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-bold ${column.badge}`}>
                  {items.length}
                </span>
                <span className="text-[12px] text-muted hidden sm:inline">· {column.hint}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openIssueModal(null, targetProjectId, null, null, column.id);
                }}
                className="btn-secondary h-7 px-2.5 text-[12px] inline-flex items-center gap-1"
                title={`Add task to ${column.label}`}
              >
                <Plus size={13} /> Add task
              </button>
            </div>

            {/* Table Content */}
            {!isCollapsed && (
              items.length === 0 ? (
                <div className="p-6 text-center text-muted text-[13px]">
                  No tasks in {column.label}. Click &quot;+ Add task&quot; to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-line bg-black/[0.015] text-[11.5px] uppercase font-bold tracking-wider text-muted">
                        <th className="py-2.5 px-4 w-[110px]">Key</th>
                        <th className="py-2.5 px-4 min-w-[280px]">Task Title</th>
                        <th className="py-2.5 px-3 w-[130px]">Priority</th>
                        <th className="py-2.5 px-3 w-[160px]">Stage / Status</th>
                        <th className="py-2.5 px-3 w-[150px]">Assignee</th>
                        <th className="py-2.5 px-4 text-right w-[110px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {items.map((task) => {
                        const isBlocked = task.status === "blocked" || Boolean(task.blockerReason && task.status !== "done");

                        return (
                          <tr key={task.id} className="hover:bg-[#fbfdfc] transition">
                            {/* Key */}
                            <td className="py-2.5 px-4 font-mono font-semibold text-[12.5px] text-brand-800">
                              <button
                                type="button"
                                onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
                                className="hover:underline transition"
                              >
                                {task.issueKey}
                              </button>
                            </td>

                            {/* Title & Subtask/Blocker */}
                            <td className="py-2.5 px-4">
                              <div className="min-w-0">
                                <span
                                  onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
                                  className="font-semibold text-ink hover:text-brand-700 cursor-pointer transition line-clamp-1"
                                  title={task.title}
                                >
                                  {task.title}
                                </span>
                                {task.parentKey && (
                                  <span className="text-[11px] text-muted block truncate">
                                    ↳ Subtask of <b>{task.parentKey}</b>
                                  </span>
                                )}
                                {isBlocked && (
                                  <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10.5px] font-bold text-rose-700">
                                    <AlertCircle size={11} className="shrink-0" /> {task.blockerReason || "Blocked"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1.5 font-medium capitalize text-[13px]">
                                <i className="h-2 w-2 rounded-full shrink-0" style={{ background: priorityDot[task.priority] }} />
                                {task.priority}
                              </span>
                            </td>

                            {/* Status dropdown */}
                            <td className="py-2.5 px-3">
                              <select
                                value={task.status === "blocked" ? "progress" : task.status}
                                onChange={(e) => updateTask(task.id, { status: e.target.value })}
                                className="h-7 text-[12px] font-semibold rounded-lg border border-line bg-white px-2 py-0.5 outline-none cursor-pointer focus:border-brand-500"
                              >
                                {columns.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Assignee */}
                            <td className="py-2.5 px-3">
                              <AssigneePicker
                                size={22}
                                value={task.assigneeId}
                                onChange={(assigneeId) => updateTask(task.id, { assigneeId })}
                              />
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <CommentButton scope="task" refId={task.id} title={`${task.issueKey} · ${task.title}`} />
                                <button
                                  type="button"
                                  onClick={() => openIssueModal(null, targetProjectId || task.projectId, null, task)}
                                  className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
                                  title="Edit task"
                                >
                                  <Edit3 size={13} />
                                </button>
                                {can.deleteTask(currentUser, task) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(task)}
                                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition"
                                    title="Delete task"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 4-Column Zero-Scroll Task Board with View Mode (Kanban Board vs Tabular View) */
export default function IssueBoard({ tasks, eyebrow, title, subtitle, projectId }) {
  const { updateTask, deleteTask, openIssueModal, currentUser } = useApp();
  const [viewMode, setViewMode] = useState("board"); // "board" | "table"
  const [over, setOver] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'mine' | 'blocked' | 'high'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [doneCollapsed, setDoneCollapsed] = useState(false);

  const targetProjectId = projectId || tasks[0]?.projectId || null;

  // Extract unique categories for tasks in this board
  const categories = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.category && typeof t.category === "string" && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Quick Filters logic with Category Filter
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter);
    }
    switch (filterMode) {
      case "mine":
        return list.filter((t) => t.assigneeId === currentUser?.id);
      case "blocked":
        return list.filter((t) => t.status === "blocked" || Boolean(t.blockerReason));
      case "high":
        return list.filter((t) => t.priority === "high");
      default:
        return list;
    }
  }, [tasks, filterMode, categoryFilter, currentUser?.id]);

  const blockedCount = tasks.filter((t) => t.status === "blocked" || Boolean(t.blockerReason)).length;
  const myCount = tasks.filter((t) => t.assigneeId === currentUser?.id).length;
  const highCount = tasks.filter((t) => t.priority === "high").length;
  const isPersonalBoard = title?.toLowerCase().includes("personal") || myCount === tasks.length;

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

        {/* View Switcher (Board vs Table) + Create Task Button */}
        <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-0">
          <div className="inline-flex items-center rounded-xl border border-line bg-[#f5f8f6] p-0.5 text-[12.5px] font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "board"
                  ? "bg-white text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={15} /> Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "table"
                  ? "bg-white text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink"
              }`}
              title="Tabular / List View"
            >
              <TableIcon size={15} /> Table
            </button>
          </div>

          <button className="btn-primary btn-compact shrink-0" onClick={() => openIssueModal(null, targetProjectId)}>
            <Plus size={16} /> Create task
          </button>
        </div>
      </div>

      {/* Filter Chips */}
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
          {!isPersonalBoard && (
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
          )}
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

        {/* Category Dropdown Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <span className="text-[12px] font-medium text-muted">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-[12.5px] font-semibold text-ink shadow-2xs hover:border-slate-300 focus:outline-hidden max-w-[240px] truncate"
            >
              <option value="all">All Categories ({tasks.length})</option>
              {categories.map((cat) => {
                const count = tasks.filter((t) => t.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
            {categoryFilter !== "all" && (
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className="text-[11.5px] font-semibold text-muted hover:text-ink underline ml-1"
                title="Reset category filter"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW MODE 1: TABULAR VIEW */}
      {viewMode === "table" ? (
        <TaskTableView
          filteredTasks={filteredTasks}
          columns={columns}
          openIssueModal={openIssueModal}
          updateTask={updateTask}
          deleteTask={deleteTask}
          currentUser={currentUser}
          targetProjectId={targetProjectId}
        />
      ) : (
        /* VIEW MODE 2: KANBAN BOARD COLUMNS */
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
                      onClick={() => openIssueModal(null, targetProjectId, null, null, column.id)}
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
                    <IssueCard key={task.id} task={task} targetProjectId={targetProjectId} />
                  ))}
                  {!items.length && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line/80 py-8 text-center text-muted">
                      <p className="text-[12px]">No tasks</p>
                      <button
                        onClick={() => openIssueModal(null, targetProjectId, null, null, column.id)}
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
      )}
    </section>
  );
}
