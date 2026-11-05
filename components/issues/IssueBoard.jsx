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
  BarChart2,
  CircleDot,
  CheckCircle2,
  ShieldAlert,
  Eye,
  Search,
  Calendar,
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

function getEffectiveColumnId(status) {
  return status === "blocked" ? "progress" : status;
}

function IssueCard({
  task,
  targetProjectId,
  columnId,
  hasSubtasks = false,
  stageSubtaskCount = 0,
  totalSubtaskCount = 0,
  isExpanded = false,
  onToggleExpand,
  isSubtask = false,
  subtaskNumber = null,
}) {
  const { updateTask, deleteTask, openIssueModal, openTaskDetail, currentUser } = useApp();

  const isBlocked = task.status === "blocked" || Boolean(task.blockerReason && task.status !== "done");
  const effectiveStatus = getEffectiveColumnId(task.status);
  const statusIndex = STATUS_ORDER.indexOf(effectiveStatus);
  const canMoveLeft = !hasSubtasks && statusIndex > 0;
  const canMoveRight = !hasSubtasks && statusIndex < STATUS_ORDER.length - 1;

  const moveLeft = (e) => {
    e.stopPropagation();
    if (canMoveLeft) updateTask(task.id, { status: STATUS_ORDER[statusIndex - 1] });
  };
  const moveRight = (e) => {
    e.stopPropagation();
    if (canMoveRight) updateTask(task.id, { status: STATUS_ORDER[statusIndex + 1] });
  };

  const isDraggable = !hasSubtasks;

  return (
    <article
      draggable={isDraggable}
      onDragStart={(event) => {
        if (!isDraggable) {
          event.preventDefault();
          return;
        }
        event.stopPropagation();
        event.dataTransfer.setData("taskId", String(task.id));
      }}
      onClick={() => {
        openTaskDetail(task);
      }}
      className={`group relative overflow-hidden rounded-xl border bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md hover:border-slate-300 ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer select-none"
      } ${
        isSubtask ? "border-slate-200/85 bg-[#fcfdfd]" : "border-slate-200/90"
      } ${
        isBlocked ? "ring-2 ring-rose-400/80 border-rose-300" : ""
      }`}
      style={{ borderLeftWidth: "4px", borderLeftColor: isBlocked ? "#e11d48" : priorityDot[task.priority] || "#3b82f6" }}
    >
      {/* Floating Action Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 rounded-lg border border-line/80 bg-white/95 px-1 py-0.5 shadow-md backdrop-blur-xs z-10"
      >
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
        {!isSubtask && (
          <button
            className="grid h-5 w-5 place-items-center rounded-md text-ink/65 hover:text-brand-700 hover:bg-[#e8f6ec]"
            title="Create subtask"
            onClick={() => openIssueModal(task, targetProjectId || task.projectId, null, null, columnId || task.status)}
          >
            <Plus size={12} />
          </button>
        )}
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

      {/* Top Header: Dropdown Toggle + Subtask Stage Count (for main tasks with subtasks) + Issue Key */}
      <div className="flex items-center justify-between gap-2 pr-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {hasSubtasks && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold transition ${
                isExpanded
                  ? "border-brand-300 bg-[#e8f6ec] text-brand-900"
                  : "border-slate-200 bg-slate-100/90 text-slate-700 hover:bg-slate-200/80"
              }`}
              title={isExpanded ? "Hide subtasks in this stage" : "Show subtasks in this stage"}
            >
              {isExpanded ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />}
              <span>
                {stageSubtaskCount}/{totalSubtaskCount}
              </span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openTaskDetail(task);
            }}
            className="text-[12px] font-mono font-semibold text-brand-800 hover:text-brand-900 hover:underline transition whitespace-nowrap"
            title="Click to view task details"
          >
            {isSubtask ? subtaskNumber : task.issueKey}
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h4
        onClick={(e) => {
          e.stopPropagation();
          openTaskDetail(task);
        }}
        className="mt-1.5 text-[13.5px] font-semibold text-ink/90 leading-[1.35] line-clamp-2 hover:text-brand-700 transition cursor-pointer"
        title="Click to view task details"
      >
        {task.title}
      </h4>

      {/* Blocker Alert Banner on Card */}
      {isBlocked && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50/95 p-2 text-[11px] text-rose-800"
        >
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-line/60 pt-2 text-[11px] text-ink/65"
      >
        <div className="flex min-w-0 items-center gap-1.5 truncate">
          <i
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: priorityDot[task.priority] }}
            title={`${task.priority} priority`}
          />
          <span className="capitalize font-semibold text-ink/80 text-[11.5px]">{task.priority}</span>
          {(task.startDate || task.dueAt) && (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink/55 truncate border-l border-line/70 pl-1.5"
              title={`Start: ${task.startDate ? task.startDate.slice(0, 10) : 'None'} | Due: ${task.dueAt ? task.dueAt.slice(0, 10) : 'None'}`}
            >
              <Calendar size={11} className="shrink-0 text-brand-700" />
              <span className="truncate">
                {task.startDate && task.dueAt
                  ? `${task.startDate.slice(5, 10)} → ${task.dueAt.slice(5, 10)}`
                  : (task.dueAt ? task.dueAt.slice(5, 10) : task.startDate.slice(5, 10))}
              </span>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <CommentButton
            scope="task"
            refId={task.id}
            title={isSubtask ? `${subtaskNumber} · ${task.title}` : `${task.issueKey} · ${task.title}`}
          />
          {task.projectId != null && (
            <AssigneePicker
              align="right"
              size={20}
              value={task.assigneeId}
              onChange={(assigneeId) => updateTask(task.id, { assigneeId })}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/** Rich Tabular View grouped by stage with collapsible Main Task -> Subtask dropdown rows */
function TaskTableView({
  getColumnEntries,
  expandedGroups,
  toggleGroup,
  columns,
  openIssueModal,
  updateTask,
  deleteTask,
  currentUser,
  targetProjectId,
}) {
  const [collapsedStages, setCollapsedStages] = useState({});

  const toggleStage = (stageId) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  return (
    <div className="mt-3.5 space-y-3.5">
      {columns.map((column) => {
        const isCollapsed = Boolean(collapsedStages[column.id]);
        const entries = getColumnEntries(column.id);

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
                  {entries.length}
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
              entries.length === 0 ? (
                <div className="p-6 text-center text-muted text-[13px]">
                  No tasks in {column.label}. Click &quot;+ Add task&quot; to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-line bg-black/[0.015] text-[11.5px] uppercase font-bold tracking-wider text-muted">
                        <th className="py-2.5 px-4 w-[150px]">Key</th>
                        <th className="py-2.5 px-4 min-w-[280px]">Task Title</th>
                        <th className="py-2.5 px-3 w-[130px]">Priority</th>
                        <th className="py-2.5 px-3 w-[160px]">Stage / Status</th>
                        <th className="py-2.5 px-3 w-[150px]">Assignee</th>
                        <th className="py-2.5 px-4 text-right w-[130px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {entries.flatMap((entry) => {
                        if (entry.type === "parent") {
                          const parentTask = entry.task;
                          const groupKey = `${parentTask.id}:${column.id}`;
                          const isExpanded =
                            expandedGroups[groupKey] !== undefined
                              ? Boolean(expandedGroups[groupKey])
                              : Boolean(entry.autoExpand);
                          const isParentBlocked =
                            parentTask.status === "blocked" ||
                            Boolean(parentTask.blockerReason && parentTask.status !== "done");

                          const rows = [
                            <tr
                              key={`parent-${groupKey}`}
                              onClick={() => toggleGroup(parentTask.id, column.id)}
                              className="bg-white hover:bg-[#f6faf7] transition cursor-pointer select-none"
                            >
                              {/* Key + Dropdown Toggle */}
                              <td className="py-2.5 px-4 font-mono font-semibold text-[12.5px] text-brand-800 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(parentTask.id, column.id);
                                    }}
                                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-sans font-bold transition ${
                                      isExpanded
                                        ? "border-brand-300 bg-[#e8f6ec] text-brand-900"
                                        : "border-slate-200 bg-slate-100/90 text-slate-700 hover:bg-slate-200/80"
                                    }`}
                                    title={isExpanded ? "Hide subtasks" : "Show subtasks"}
                                  >
                                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    <span>
                                      {entry.stageSubtasks.length}/{entry.totalSubtaskCount}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTaskDetail(parentTask);
                                    }}
                                    className="hover:underline transition"
                                  >
                                    {parentTask.issueKey}
                                  </button>
                                </div>
                              </td>

                              {/* Title */}
                              <td className="py-2.5 px-4">
                                <div className="min-w-0">
                                  <span
                                    onClick={() => openTaskDetail(parentTask)}
                                    className="font-semibold text-ink hover:text-brand-700 cursor-pointer transition line-clamp-1"
                                    title={parentTask.title}
                                  >
                                    {parentTask.title}
                                  </span>
                                  {isParentBlocked && (
                                    <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10.5px] font-bold text-rose-700">
                                      <AlertCircle size={11} className="shrink-0" /> {parentTask.blockerReason || "Blocked"}
                                    </span>
                                  )}
                                  {(parentTask.startDate || parentTask.dueAt) && (
                                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                                      <Calendar size={11} className="shrink-0 text-brand-700" />
                                      <span>
                                        {parentTask.startDate && parentTask.dueAt
                                          ? `${parentTask.startDate.slice(5, 10)} → ${parentTask.dueAt.slice(5, 10)}`
                                          : (parentTask.dueAt ? `Due ${parentTask.dueAt.slice(5, 10)}` : `Starts ${parentTask.startDate.slice(5, 10)}`)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Priority */}
                              <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                <span className="inline-flex items-center gap-1.5 font-medium capitalize text-[13px]">
                                  <i className="h-2 w-2 rounded-full shrink-0" style={{ background: priorityDot[parentTask.priority] }} />
                                  {parentTask.priority}
                                </span>
                              </td>

                              {/* Stage badge for Main Task with subtasks */}
                              <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ${column.badge}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                                  {column.label} ({entry.stageSubtasks.length}/{entry.totalSubtaskCount})
                                </span>
                              </td>

                              {/* Assignee */}
                              <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                <AssigneePicker
                                  size={22}
                                  value={parentTask.assigneeId}
                                  onChange={(assigneeId) => updateTask(parentTask.id, { assigneeId })}
                                />
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openIssueModal(parentTask, targetProjectId || parentTask.projectId, null, null, column.id)}
                                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-[#e8f6ec] hover:text-brand-700 transition"
                                    title="Create subtask"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <CommentButton scope="task" refId={parentTask.id} title={`${parentTask.issueKey} · ${parentTask.title}`} />
                                  <button
                                    type="button"
                                    onClick={() => openIssueModal(null, targetProjectId || parentTask.projectId, null, parentTask)}
                                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
                                    title="Edit task"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  {can.deleteTask(currentUser, parentTask) && (
                                    <button
                                      type="button"
                                      onClick={() => deleteTask(parentTask)}
                                      className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition"
                                      title="Delete task"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>,
                          ];

                          if (isExpanded) {
                            entry.stageSubtasks.forEach((subtask, idx) => {
                              const isSubBlocked =
                                subtask.status === "blocked" ||
                                Boolean(subtask.blockerReason && subtask.status !== "done");
                              rows.push(
                                <tr
                                  key={`sub-${subtask.id}`}
                                  className="bg-[#f9fbfa] hover:bg-[#f2f7f4] transition"
                                >
                                  {/* Subtask Simple Number */}
                                  <td className="py-2 pl-9 pr-4 font-mono font-semibold text-[12px] text-brand-800 whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className="text-ink/35 font-sans">↳</span>
                                      <button
                                        type="button"
                                        onClick={() => openTaskDetail(subtask)}
                                        className="hover:underline transition"
                                      >
                                        {idx + 1}
                                      </button>
                                    </div>
                                  </td>

                                  {/* Subtask Title */}
                                  <td className="py-2 pl-6 pr-4">
                                    <div className="min-w-0 border-l-2 border-brand-300/80 pl-3">
                                      <span
                                        onClick={() => openTaskDetail(subtask)}
                                        className="font-medium text-[13px] text-ink/90 hover:text-brand-700 cursor-pointer transition line-clamp-1"
                                        title={subtask.title}
                                      >
                                        {subtask.title}
                                      </span>
                                      {isSubBlocked && (
                                        <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10.5px] font-bold text-rose-700">
                                          <AlertCircle size={11} className="shrink-0" /> {subtask.blockerReason || "Blocked"}
                                        </span>
                                      )}
                                      {(subtask.startDate || subtask.dueAt) && (
                                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                                          <Calendar size={10.5} className="shrink-0 text-brand-700" />
                                          <span>
                                            {subtask.startDate && subtask.dueAt
                                              ? `${subtask.startDate.slice(5, 10)} → ${subtask.dueAt.slice(5, 10)}`
                                              : (subtask.dueAt ? `Due ${subtask.dueAt.slice(5, 10)}` : `Starts ${subtask.startDate.slice(5, 10)}`)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Subtask Priority */}
                                  <td className="py-2 px-3">
                                    <span className="inline-flex items-center gap-1.5 font-medium capitalize text-[12.5px]">
                                      <i className="h-2 w-2 rounded-full shrink-0" style={{ background: priorityDot[subtask.priority] }} />
                                      {subtask.priority}
                                    </span>
                                  </td>

                                  {/* Subtask Stage / Status Dropdown */}
                                  <td className="py-2 px-3">
                                    <select
                                      value={subtask.status === "blocked" ? "progress" : subtask.status}
                                      onChange={(e) => updateTask(subtask.id, { status: e.target.value })}
                                      className="h-7 text-[12px] font-semibold rounded-lg border border-line bg-white px-2 py-0.5 outline-none cursor-pointer focus:border-brand-500"
                                    >
                                      {columns.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Subtask Assignee */}
                                  <td className="py-2 px-3">
                                    <AssigneePicker
                                      size={22}
                                      value={subtask.assigneeId}
                                      onChange={(assigneeId) => updateTask(subtask.id, { assigneeId })}
                                    />
                                  </td>

                                  {/* Subtask Actions */}
                                  <td className="py-2 px-4 text-right">
                                    <div className="inline-flex items-center justify-end gap-1">
                                      <CommentButton scope="task" refId={subtask.id} title={`${idx + 1} · ${subtask.title}`} />
                                      <button
                                        type="button"
                                        onClick={() => openIssueModal(null, targetProjectId || subtask.projectId, null, subtask)}
                                        className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
                                        title="Edit subtask"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      {can.deleteTask(currentUser, subtask) && (
                                        <button
                                          type="button"
                                          onClick={() => deleteTask(subtask)}
                                          className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition"
                                          title="Delete subtask"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>,
                              );
                            });
                          }

                          return rows;
                        }

                        // Single task without subtasks
                        const task = entry.task;
                        const isBlocked = task.status === "blocked" || Boolean(task.blockerReason && task.status !== "done");

                        return [
                          <tr key={task.id} className="hover:bg-[#fbfdfc] transition">
                            {/* Key */}
                            <td className="py-2.5 px-4 font-mono font-semibold text-[12.5px] text-brand-800 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openTaskDetail(task)}
                                className="hover:underline transition"
                              >
                                {task.issueKey}
                              </button>
                            </td>

                            {/* Title & Blocker */}
                            <td className="py-2.5 px-4">
                              <div className="min-w-0">
                                <span
                                  onClick={() => openTaskDetail(task)}
                                  className="font-semibold text-ink hover:text-brand-700 cursor-pointer transition line-clamp-1"
                                  title={task.title}
                                >
                                  {task.title}
                                </span>
                                {isBlocked && (
                                  <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10.5px] font-bold text-rose-700">
                                    <AlertCircle size={11} className="shrink-0" /> {task.blockerReason || "Blocked"}
                                  </span>
                                )}
                                {(task.startDate || task.dueAt) && (
                                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                                    <Calendar size={11} className="shrink-0 text-brand-700" />
                                    <span>
                                      {task.startDate && task.dueAt
                                        ? `${task.startDate.slice(5, 10)} → ${task.dueAt.slice(5, 10)}`
                                        : (task.dueAt ? `Due ${task.dueAt.slice(5, 10)}` : `Starts ${task.startDate.slice(5, 10)}`)}
                                    </span>
                                  </div>
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
                                <button
                                  type="button"
                                  onClick={() => openIssueModal(task, targetProjectId || task.projectId, null, null, column.id)}
                                  className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-[#e8f6ec] hover:text-brand-700 transition"
                                  title="Create subtask"
                                >
                                  <Plus size={14} />
                                </button>
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
                          </tr>,
                        ];
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

/** Visual Stage Analytics & Pipeline View (Option C: Full-Width Executive Pipeline & Stage Cards) */
function TaskGraphView({ tasks, columns }) {
  const [hoveredStage, setHoveredStage] = useState(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const stageCounts = {
      todo: tasks.filter((t) => getEffectiveColumnId(t.status) === "todo").length,
      progress: tasks.filter((t) => getEffectiveColumnId(t.status) === "progress").length,
      review: tasks.filter((t) => getEffectiveColumnId(t.status) === "review").length,
      done: tasks.filter((t) => getEffectiveColumnId(t.status) === "done").length,
    };

    const stageConfig = {
      todo: {
        hex: "#94a3b8",
        bg: "bg-slate-500",
        barBg: "bg-slate-400",
        lightBg: "bg-[#f8fafc]",
        border: "border-slate-200/80",
        ringHover: "hover:ring-slate-400/30 hover:border-slate-300",
        badge: "bg-slate-100 text-slate-800",
        icon: CircleDot,
      },
      progress: {
        hex: "#3b82f6",
        bg: "bg-blue-500",
        barBg: "bg-blue-500",
        lightBg: "bg-[#f5f8ff]",
        border: "border-blue-200/80",
        ringHover: "hover:ring-blue-400/30 hover:border-blue-300",
        badge: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      review: {
        hex: "#a855f7",
        bg: "bg-purple-500",
        barBg: "bg-purple-500",
        lightBg: "bg-[#faf7ff]",
        border: "border-purple-200/80",
        ringHover: "hover:ring-purple-400/30 hover:border-purple-300",
        badge: "bg-purple-100 text-purple-800",
        icon: Eye,
      },
      done: {
        hex: "#10b981",
        bg: "bg-emerald-500",
        barBg: "bg-emerald-500",
        lightBg: "bg-[#f4fbf6]",
        border: "border-emerald-200/80",
        ringHover: "hover:ring-emerald-400/30 hover:border-emerald-300",
        badge: "bg-emerald-100 text-emerald-800",
        icon: CheckCircle2,
      },
    };

    const stages = columns.map((col) => {
      const count = stageCounts[col.id] || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const exactPct = total > 0 ? (count / total) * 100 : 0;
      const conf = stageConfig[col.id] || stageConfig.todo;
      const highCount = tasks.filter(
        (t) => getEffectiveColumnId(t.status) === col.id && t.priority === "high"
      ).length;

      return {
        ...col,
        count,
        pct,
        exactPct,
        hex: conf.hex,
        bg: conf.bg,
        barBg: conf.barBg,
        lightBg: conf.lightBg,
        border: conf.border,
        ringHover: conf.ringHover,
        badge: conf.badge,
        Icon: conf.icon,
        highCount,
      };
    });

    const high = tasks.filter((t) => t.priority === "high").length;
    const medium = tasks.filter((t) => t.priority === "medium").length;
    const low = tasks.filter((t) => t.priority === "low").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const completedPct = total > 0 ? Math.round((stageCounts.done / total) * 100) : 0;

    return { total, stages, stageCounts, high, medium, low, blocked, completedPct };
  }, [tasks, columns]);

  return (
    <div className="mt-4 space-y-4">
      {/* Main Executive Analytics & Pipeline Card */}
      <div className="panel p-5 sm:p-6 shadow-xs border border-line bg-white">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-line/70">
          <div>
            <h3 className="text-[17px] font-bold text-ink flex items-center gap-2">
              <BarChart2 size={19} className="text-brand-700" />
              Stage Analytics & Distribution
            </h3>
            <p className="text-[13px] text-muted mt-0.5">
              Live task counts and percentage breakdown across workflow stages
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold">
            {stats.completedPct === 100 ? (
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-700" />
                All Done 🎉
              </span>
            ) : (stats.stageCounts.progress > 0 || stats.stageCounts.review > 0) ? (
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-1 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                In Progress
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 font-bold">
                Not Started
              </span>
            )}
            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 font-bold">
              {stats.completedPct}% Completed
            </span>
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-bold">
              {stats.total} Total Tasks
            </span>
          </div>
        </div>

        {/* Full-Width Visual Pipeline Strip */}
        <div className="pt-5 pb-2">
          <div className="flex items-center justify-between text-[12.5px] font-bold text-muted mb-2">
            <span>Workflow Pipeline Distribution</span>
            <span className="text-ink font-semibold">
              {stats.stageCounts.done} of {stats.total} completed
            </span>
          </div>

          {/* Segmented Pipeline Bar */}
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex p-0.5 gap-0.5 shadow-inner border border-slate-200/60">
            {stats.stages.map((stage) => {
              if (stage.count === 0) return null;
              const isHovered = hoveredStage === stage.id;
              return (
                <div
                  key={stage.id}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  style={{ width: `${stage.exactPct}%` }}
                  className={`h-full rounded-full ${stage.barBg} transition-all duration-300 cursor-pointer ${
                    isHovered ? "ring-2 ring-black/25 brightness-110" : ""
                  }`}
                  title={`${stage.label}: ${stage.count} tasks (${stage.pct}%)`}
                />
              );
            })}
          </div>

          {/* Interactive Pipeline Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[12px]">
            {stats.stages.map((stage) => {
              const isHovered = hoveredStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                  className={`flex items-center gap-1.5 font-medium transition-all rounded px-1.5 py-0.5 ${
                    isHovered ? "bg-black/5 font-bold text-ink" : "text-ink/75 hover:text-ink"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.bg}`} />
                  <span>{stage.label}:</span>
                  <span className="font-bold text-ink">{stage.count}</span>
                  <span className="text-muted">({stage.pct}%)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Stage Breakdown Cards (Full-Width 4-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-line/60">
          {stats.stages.map((stage) => {
            const StageIcon = stage.Icon;
            const isHovered = hoveredStage === stage.id;

            return (
              <div
                key={stage.id}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  stage.lightBg
                } ${stage.border} ${stage.ringHover} ${
                  isHovered ? "ring-2 shadow-sm scale-[1.01] -translate-y-0.5" : "hover:shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-xl bg-white shadow-2xs ${stage.border} border transition-transform ${
                      isHovered ? "scale-110" : ""
                    }`}
                  >
                    <StageIcon size={16} style={{ color: stage.hex }} />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${stage.badge}`}>
                    {stage.pct}%
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-[14px] font-bold text-ink leading-tight">
                    {stage.label}
                  </p>
                  <p className="text-[11.5px] text-muted truncate mt-0.5">{stage.hint}</p>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[26px] font-black text-ink leading-none">
                    {stage.count}
                  </span>
                  <span className="text-[11.5px] text-muted font-medium">
                    tasks
                  </span>
                </div>

                {/* Progress Bar inside Card */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    style={{ width: `${stage.pct}%` }}
                    className={`h-full rounded-full ${stage.barBg} transition-all duration-500`}
                  />
                </div>

                {stage.highCount > 0 && (
                  <div className="mt-2.5 flex items-center gap-1 text-[10.5px] font-bold text-red-700 bg-red-50 border border-red-200/80 rounded px-1.5 py-0.5 w-fit">
                    <Flame size={10} className="text-red-600" /> {stage.highCount} high priority
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority & Workload Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-4 flex flex-col justify-between border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">High Priority</span>
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[22px] font-black text-[#d63a3a] leading-none">{stats.high}</span>
            <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[11px] font-bold">
              {stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="panel p-4 flex flex-col justify-between border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Medium Priority</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[22px] font-black text-[#8a6508] leading-none">{stats.medium}</span>
            <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
              {stats.total > 0 ? Math.round((stats.medium / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="panel p-4 flex flex-col justify-between border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Low Priority</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[22px] font-black text-[#2d7a45] leading-none">{stats.low}</span>
            <span className="rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
              {stats.total > 0 ? Math.round((stats.low / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="panel p-4 flex flex-col justify-between border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Blocked Tasks</span>
            <ShieldAlert size={14} className={stats.blocked > 0 ? "text-rose-600" : "text-muted"} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-[22px] font-black leading-none ${stats.blocked > 0 ? "text-rose-600" : "text-ink"}`}>
              {stats.blocked}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                stats.blocked > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {stats.blocked > 0 ? "Needs action" : "All clear"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 4-Column Zero-Scroll Task Board with View Mode (Kanban Board vs Tabular View) */
export default function IssueBoard({ tasks, eyebrow, title, subtitle, projectId, isPersonal = false }) {
  const { updateTask, deleteTask, openIssueModal, openTaskDetail, currentUser } = useApp();
  const [viewMode, setViewMode] = useState("board"); // "board" | "table" | "chart"
  const [over, setOver] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'mine' | 'blocked' | 'high'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [doneCollapsed, setDoneCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [mobileColumn, setMobileColumn] = useState("todo");

  const targetProjectId = isPersonal || projectId === null ? null : (projectId || tasks[0]?.projectId || null);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesSearch = (t) => {
    if (!normalizedSearch) return true;
    const title = (t.title || "").toLowerCase();
    const key = (t.parentId ? "" : t.issueKey || "").toLowerCase();
    const cat = (t.category || "").toLowerCase();
    const desc = (t.description || "").toLowerCase();
    return (
      title.includes(normalizedSearch) ||
      key.includes(normalizedSearch) ||
      cat.includes(normalizedSearch) ||
      desc.includes(normalizedSearch)
    );
  };

  const toggleGroup = (parentId, columnId) => {
    const key = `${parentId}:${columnId}`;
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Map all tasks by ID and index all subtasks by their parentId across all stages
  const { allTasksById, allSubtasksByParentId } = useMemo(() => {
    const byId = new Map();
    tasks.forEach((t) => byId.set(t.id, t));

    const byParent = new Map();
    tasks.forEach((t) => {
      if (t.parentId && byId.has(t.parentId)) {
        if (!byParent.has(t.parentId)) {
          byParent.set(t.parentId, []);
        }
        byParent.get(t.parentId).push(t);
      }
    });

    return { allTasksById: byId, allSubtasksByParentId: byParent };
  }, [tasks]);

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

  const filteredIds = useMemo(() => new Set(filteredTasks.map((t) => t.id)), [filteredTasks]);

  const blockedCount = tasks.filter((t) => t.status === "blocked" || Boolean(t.blockerReason)).length;
  const myCount = tasks.filter((t) => t.assigneeId === currentUser?.id).length;
  const highCount = tasks.filter((t) => t.priority === "high").length;
  const isPersonalBoard = title?.toLowerCase().includes("personal") || myCount === tasks.length;

  function drop(event, status) {
    event.preventDefault();
    setOver(null);
    const id = Number(event.dataTransfer.getData("taskId"));
    if (!id || allSubtasksByParentId.has(id)) return;
    const task = tasks.find((item) => item.id === id);
    if (task && task.status !== status) void updateTask(id, { status });
  }

  function getColumnEntries(columnId) {
    const entries = [];
    tasks.forEach((task) => {
      // Subtasks are never rendered as standalone top-level items
      if (task.parentId && allTasksById.has(task.parentId)) {
        return;
      }

      // Main task with subtasks: show in this column if it has at least 1 subtask in this stage
      if (allSubtasksByParentId.has(task.id)) {
        const allSubtasks = allSubtasksByParentId.get(task.id);
        const parentMatches = matchesSearch(task);

        const baseStageSubtasks = allSubtasks.filter(
          (sub) =>
            getEffectiveColumnId(sub.status) === columnId &&
            (filteredIds.has(sub.id) || (filteredIds.has(task.id) && filterMode === "all")),
        );

        const matchingSubtasks = baseStageSubtasks.filter((sub) => matchesSearch(sub));
        const stageSubtasks =
          !normalizedSearch || parentMatches ? baseStageSubtasks : matchingSubtasks;

        if (stageSubtasks.length > 0) {
          entries.push({
            type: "parent",
            task,
            stageSubtasks,
            totalSubtaskCount: allSubtasks.length,
            autoExpand: Boolean(normalizedSearch) && matchingSubtasks.length > 0,
          });
        }
        return;
      }

      // Normal single task without subtasks
      if (
        filteredIds.has(task.id) &&
        getEffectiveColumnId(task.status) === columnId &&
        matchesSearch(task)
      ) {
        entries.push({
          type: "single",
          task,
        });
      }
    });
    return entries;
  }

  return (
    <section className="panel min-w-0 p-3.5 sm:p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-1.5 sm:flex-wrap sm:gap-3">
        <div className="min-w-0">
          <p className="eyebrow hidden sm:block">{eyebrow}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-[15px] sm:text-[21px] font-bold tracking-tight whitespace-nowrap">{title}</h2>
            <span className="inline-flex sm:hidden items-center justify-center rounded-full bg-[#e8f6ec] px-1.5 py-0.5 text-[11px] font-bold text-brand-800 shrink-0">
              {tasks.length}
            </span>
          </div>
          <span className="hidden sm:inline text-[12.5px] sm:text-[13.5px] text-muted">{subtitle}</span>
        </div>

        {/* Desktop View Switcher (Board vs Table) + Create Task Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:inline-flex items-center rounded-xl border border-line bg-[#f5f8f6] p-0.5 text-[12.5px] font-semibold">
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
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                viewMode === "chart"
                  ? "bg-white text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink"
              }`}
              title="Bar Graph / Analytics View"
            >
              <BarChart2 size={15} /> Graph
            </button>
          </div>

          <button
            className="btn-primary h-8 px-2.5 text-[12px] sm:h-9 sm:px-3.5 sm:text-[13.5px] shrink-0 whitespace-nowrap"
            onClick={() => openIssueModal(null, targetProjectId, null, null, viewMode === "board" ? mobileColumn : undefined)}
          >
            <Plus size={14} />
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create task</span>
          </button>
        </div>
      </div>

      {/* MOBILE COMPACT 2-ROW CONTROLS (<md) */}
      <div className="mt-2.5 space-y-2 md:hidden">
        {/* Mobile Row 1: Search Input + Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 min-w-0 items-center">
            <Search size={14} className="pointer-events-none absolute left-2.5 text-ink/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-8 w-full rounded-lg border border-line bg-[#f8faf9] pl-8 pr-7 text-[12.5px] font-medium text-ink transition placeholder:text-ink/45 focus:bg-white focus:border-brand-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 grid h-5 w-5 place-items-center rounded-md text-ink/40 hover:text-ink"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            aria-label="Filter tasks"
            className="h-8 shrink-0 rounded-lg border border-line bg-white px-2.5 text-[12px] font-semibold text-ink shadow-2xs focus:border-brand-500 focus:outline-hidden"
          >
            <option value="all">All ({tasks.length})</option>
            {!isPersonalBoard && <option value="mine">My tasks ({myCount})</option>}
            <option value="blocked">Blocked ({blockedCount})</option>
            <option value="high">High priority ({highCount})</option>
          </select>
        </div>

        {/* Mobile Row 2: Stage Dropdown + View Mode Dropdown */}
        <div className="grid grid-cols-2 gap-2">
          {viewMode === "board" ? (
            <div className="relative flex items-center">
              <span
                className={`pointer-events-none absolute left-2.5 h-2 w-2 rounded-full ${
                  columns.find((c) => c.id === mobileColumn)?.dot || "bg-slate-400"
                }`}
              />
              <select
                value={mobileColumn}
                onChange={(e) => setMobileColumn(e.target.value)}
                aria-label="Select Kanban stage"
                className="h-8 w-full rounded-lg border border-line bg-[#f4f8f5] pl-6 pr-2 text-[12.5px] font-bold text-ink shadow-2xs focus:border-brand-500 focus:outline-hidden"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label} ({getColumnEntries(col.id).length})
                  </option>
                ))}
              </select>
            </div>
          ) : categories.length > 0 ? (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="h-8 w-full rounded-lg border border-line bg-[#f4f8f5] px-2.5 text-[12px] font-semibold text-ink shadow-2xs focus:outline-hidden truncate"
            >
              <option value="all">All Categories ({tasks.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({tasks.filter((t) => t.category === cat).length})
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            aria-label="Select view mode"
            className="h-8 w-full rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-ink shadow-2xs focus:border-brand-500 focus:outline-hidden"
          >
            <option value="board">View: Board</option>
            <option value="table">View: Table</option>
            <option value="chart">View: Graph</option>
          </select>
        </div>
      </div>

      {/* DESKTOP FILTER CHIPS & SEARCH (md+) */}
      <div className="mt-3.5 hidden md:flex flex-wrap items-center justify-between gap-2.5 border-b border-line/60 pb-3">
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

        {/* Search Bar + Category Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-0">
          {/* Kanban Search Input */}
          <div className="relative flex items-center">
            <Search size={14} className="pointer-events-none absolute left-2.5 text-ink/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks & subtasks..."
              className="h-[30px] w-[190px] sm:w-[230px] rounded-lg border border-line bg-white pl-8 pr-7 text-[12.5px] font-medium text-ink shadow-2xs transition placeholder:text-ink/40 hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 grid h-5 w-5 place-items-center rounded-md text-ink/40 hover:bg-black/5 hover:text-ink"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-muted">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[30px] rounded-lg border border-line bg-white px-2.5 py-1 text-[12.5px] font-semibold text-ink shadow-2xs hover:border-slate-300 focus:outline-hidden max-w-[220px] truncate"
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
      </div>

      {/* VIEW MODES */}
      {viewMode === "table" ? (
        <TaskTableView
          getColumnEntries={getColumnEntries}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          columns={columns}
          openIssueModal={openIssueModal}
          updateTask={updateTask}
          deleteTask={deleteTask}
          currentUser={currentUser}
          targetProjectId={targetProjectId}
        />
      ) : viewMode === "chart" ? (
        <TaskGraphView tasks={filteredTasks} columns={columns} />
      ) : (
        /* VIEW MODE 2: KANBAN BOARD COLUMNS */
        <>
          <div className="mt-2.5 md:mt-3.5 flex items-start gap-3.5">
            {columns.map((column) => {
              const isDone = column.id === "done";
              const isCollapsed = isDone && doneCollapsed;
              const isMobileHidden = mobileColumn !== column.id;

              const entries = getColumnEntries(column.id);

              // Collapsed Done Column (Slim 44px vertical strip on desktop)
              if (isCollapsed) {
                return (
                  <section
                    key={column.id}
                    onClick={() => setDoneCollapsed(false)}
                    className={`${isMobileHidden ? "hidden md:flex" : "hidden md:flex"} flex-col items-center justify-between w-[44px] shrink-0 min-h-[420px] rounded-2xl border border-emerald-200/80 bg-[#f4fbf6] p-2.5 cursor-pointer hover:bg-[#e8f7ec] transition group shadow-xs`}
                    title="Click to expand Done column"
                  >
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="grid h-[20px] min-w-[20px] place-items-center rounded-full bg-emerald-100 px-1 text-[11px] font-bold text-emerald-800">
                        {entries.length}
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
                  className={`${
                    isMobileHidden ? "hidden md:flex" : "flex"
                  } flex-col flex-1 min-w-0 md:min-h-[420px] rounded-2xl border p-2 sm:p-2.5 transition ${
                    over === column.id
                      ? "border-brand-400 bg-[#e8f6ec] shadow-inner"
                      : `${column.border} ${column.bg}`
                  }`}
                >
                {/* Column Header (Hidden on mobile since stage dropdown already shows it) */}
                <div className="hidden md:flex items-center justify-between pb-2.5 pt-1 px-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${column.dot}`} />
                    <h3 className="text-[14px] font-bold text-ink leading-none truncate">{column.label}</h3>
                    <span
                      className={`grid h-[19px] min-w-[19px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold ${column.badge}`}
                    >
                      {entries.length}
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
                  {entries.map((entry) => {
                    if (entry.type === "parent") {
                      const groupKey = `${entry.task.id}:${column.id}`;
                      const isExpanded =
                        expandedGroups[groupKey] !== undefined
                          ? Boolean(expandedGroups[groupKey])
                          : Boolean(entry.autoExpand);
                      return (
                        <div key={groupKey} className="space-y-1.5">
                          <IssueCard
                            task={entry.task}
                            targetProjectId={targetProjectId}
                            columnId={column.id}
                            hasSubtasks={true}
                            stageSubtaskCount={entry.stageSubtasks.length}
                            totalSubtaskCount={entry.totalSubtaskCount}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleGroup(entry.task.id, column.id)}
                          />
                          {isExpanded && (
                            <div className="ml-3 space-y-2 border-l-2 border-brand-300/80 pl-2.5 pt-0.5">
                              {entry.stageSubtasks.map((subtask, idx) => (
                                <IssueCard
                                  key={subtask.id}
                                  task={subtask}
                                  targetProjectId={targetProjectId}
                                  columnId={column.id}
                                  isSubtask={true}
                                  subtaskNumber={idx + 1}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <IssueCard
                        key={entry.task.id}
                        task={entry.task}
                        targetProjectId={targetProjectId}
                        columnId={column.id}
                      />
                    );
                  })}
                  {!entries.length && (
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
        </>
      )}
    </section>
  );
}
