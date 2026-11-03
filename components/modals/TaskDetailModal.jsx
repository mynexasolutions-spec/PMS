"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS, priorityLabel } from "@/lib/constants";
import { can } from "@/lib/permissions";
import AssigneePicker from "@/components/ui/AssigneePicker";
import CommentThread from "@/components/comments/CommentThread";

const statusBadges = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  progress: "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  done: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const statusDots = {
  todo: "bg-slate-400",
  progress: "bg-blue-500",
  review: "bg-purple-500",
  blocked: "bg-rose-500",
  done: "bg-emerald-500",
};

const priorityDots = {
  high: "#e5484d",
  medium: "#f0a020",
  low: "#2e9e4f",
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return null;
  try {
    const raw = dateStr.slice(0, 10);
    const [y, m, d] = raw.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function TaskDetailModal() {
  const {
    taskDetailModal: task,
    closeTaskDetail,
    openTaskDetail,
    openIssueModal,
    updateTask,
    deleteTask,
    tasks,
    currentUser,
    projects,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("subtasks"); // 'subtasks' | 'comments'

  useEffect(() => {
    setMounted(true);
    const handleKey = (e) => {
      if (e.key === "Escape") closeTaskDetail();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeTaskDetail]);

  // Find subtasks belonging to this task
  const subtasks = useMemo(() => {
    if (!task) return [];
    return tasks.filter((t) => t.parentId === task.id);
  }, [tasks, task]);

  // Find parent task if this task is a subtask
  const parentTask = useMemo(() => {
    if (!task?.parentId) return null;
    return tasks.find((t) => t.id === task.parentId) || null;
  }, [tasks, task]);

  // Find project
  const project = useMemo(() => {
    if (!task?.projectId) return null;
    return projects.find((p) => p.id === task.projectId) || null;
  }, [projects, task]);

  if (!mounted || !task) return null;

  const completedSubtasks = subtasks.filter((s) => s.status === "done").length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const isBlocked = task.status === "blocked" || Boolean(task.blockerReason);
  const canDelete = can.deleteTask(currentUser, task);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/50 p-3 sm:p-5 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeTaskDetail();
      }}
    >
      <div className="my-auto flex flex-col w-full max-w-[880px] max-h-[92vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-line animate-in zoom-in-95 duration-150">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-3 border-b border-line/75 px-5 py-3.5 bg-[#fcfdfd]">
          {/* Left: Key, Type, Parent Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {parentTask ? (
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted truncate">
                <button
                  type="button"
                  onClick={() => openTaskDetail(parentTask)}
                  className="font-mono font-semibold text-brand-800 hover:underline transition"
                >
                  {parentTask.issueKey}
                </button>
                <ChevronRight size={13} className="text-muted/60" />
                <span className="text-ink/80 truncate max-w-[180px]">{parentTask.title}</span>
                <ChevronRight size={13} className="text-muted/60" />
                <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-800 border border-brand-200">
                  Subtask
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2.5 py-0.5 font-mono text-[12px] font-bold text-brand-800 border border-brand-200">
                  {task.issueKey}
                </span>
                <span className="text-[12px] font-semibold text-ink/65">
                  {task.type || "Task"}
                </span>
              </div>
            )}

            {task.category && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                {task.category}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                closeTaskDetail();
                openIssueModal(null, task.projectId, null, task);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink/80 shadow-2xs hover:border-brand-300 hover:bg-[#f3f9f5] hover:text-brand-800 transition"
              title="Edit full task form"
            >
              <Edit3 size={13} className="text-brand-700" />
              <span>Edit</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${task.issueKey}?`)) {
                    deleteTask(task);
                    closeTaskDetail();
                  }
                }}
                className="grid h-8 w-8 place-items-center rounded-xl text-ink/40 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={closeTaskDetail}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink/50 hover:bg-black/5 hover:text-ink transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================= BODY (Scrollable 2-Column Layout) ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ---------------- LEFT: PRIMARY CONTENT (8 cols) ---------------- */}
            <div className="lg:col-span-8 space-y-5">
              {/* Task Title */}
              <div>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-ink leading-snug tracking-tight">
                  {task.title}
                </h2>
              </div>

              {/* Blocker Alert if active */}
              {isBlocked && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-rose-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-rose-700">
                      Task is Blocked
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-rose-900">
                      {task.blockerReason || "Blocked by external dependency"}
                    </p>
                  </div>
                </div>
              )}

              {/* Description / Expected Output Box */}
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-muted mb-2">
                  <FileText size={13} className="text-brand-700" />
                  <span>Expected Output / Details</span>
                </div>
                <div className="rounded-xl border border-line/80 bg-[#f9fcfa] p-4 text-[13.5px] text-ink/85 leading-relaxed whitespace-pre-wrap select-text">
                  {task.description ? (
                    task.description
                  ) : (
                    <span className="italic text-muted">
                      No specific description provided. Click &quot;Edit&quot; above to add expected outputs or scope notes.
                    </span>
                  )}
                </div>
              </div>

              {/* Subtasks Section (if main task or if subtasks exist) */}
              {subtasks.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-4">
                  {/* Subtask Header & Progress */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className="text-brand-700" />
                      <h4 className="text-[14px] font-bold text-ink">Subtasks</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[11px] font-bold text-slate-700">
                        {completedSubtasks}/{subtasks.length}
                      </span>
                    </div>

                    <span className="text-[12px] font-semibold text-muted">
                      {subtaskProgress}% done
                    </span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-3.5">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>

                  {/* Subtask List */}
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {subtasks.map((sub) => {
                      const isSubDone = sub.status === "done";
                      return (
                        <div
                          key={sub.id}
                          className={`group flex items-start gap-2.5 rounded-xl border p-2.5 transition ${
                            isSubDone
                              ? "border-emerald-200/70 bg-emerald-50/30"
                              : "border-line/70 bg-white hover:border-brand-200 hover:bg-[#fafdfb]"
                          }`}
                        >
                          {/* Quick Toggle Checkbox */}
                          <button
                            type="button"
                            onClick={() =>
                              updateTask(sub.id, {
                                status: isSubDone ? "todo" : "done",
                              })
                            }
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                              isSubDone
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white text-transparent hover:border-brand-500"
                            }`}
                            title={isSubDone ? "Mark incomplete" : "Mark completed"}
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>

                          {/* Subtask Title & Expected Output */}
                          <div
                            onClick={() => openTaskDetail(sub)}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[13px] font-semibold leading-snug ${isSubDone ? "line-through text-muted" : "text-ink group-hover:text-brand-800"}`}>
                                {sub.title}
                              </span>
                            </div>
                            {sub.description && (
                              <p className="mt-0.5 text-[11.5px] text-muted line-clamp-1">
                                {sub.description}
                              </p>
                            )}
                          </div>

                          {/* Subtask Meta Pill */}
                          <div className="flex items-center gap-2 shrink-0">
                            {sub.dueAt && (
                              <span className="text-[10.5px] font-medium text-muted flex items-center gap-1">
                                <Clock size={11} /> {formatDisplayDate(sub.dueAt)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openTaskDetail(sub)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-ink/40 hover:text-brand-700 transition"
                              title="View details"
                            >
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Subtask Button */}
                  <button
                    type="button"
                    onClick={() => {
                      closeTaskDetail();
                      openIssueModal(task, task.projectId);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-brand-700 hover:text-brand-900 transition"
                  >
                    <Plus size={14} /> Add another subtask
                  </button>
                </div>
              )}

              {/* Activity & Discussion Thread */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center gap-2 text-[13px] font-bold text-ink mb-3">
                  <MessageSquare size={15} className="text-brand-700" />
                  <span>Discussion & Updates</span>
                </div>
                <CommentThread scope="task" refId={task.id} placeholder="Add a comment or progress update..." />
              </div>
            </div>

            {/* ---------------- RIGHT: METADATA SIDEBAR (4 cols) ---------------- */}
            <div className="lg:col-span-4 rounded-2xl border border-line bg-[#f8faf9] p-4 space-y-4">
              <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-muted">
                Task Attributes
              </h4>

              {/* Status Selector */}
              <div>
                <label className="block text-[11.5px] font-semibold text-ink/70 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-1.5 text-[13px] font-bold outline-none cursor-pointer transition ${
                      statusBadges[task.status] || "bg-white text-ink border-line"
                    }`}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {TASK_STATUS_LABELS[status] ?? status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[11.5px] font-semibold text-ink/70 mb-1">
                  Priority
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5">
                  <i
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: priorityDots[task.priority] || "#f0a020" }}
                  />
                  <select
                    value={task.priority}
                    onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                    className="w-full text-[13px] font-semibold capitalize text-ink bg-transparent outline-none cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabel[p] ?? p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[11.5px] font-semibold text-ink/70 mb-1">
                  Assignee
                </label>
                <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-1.5">
                  <span className="text-[13px] font-medium text-ink truncate">
                    {task.assigneeId
                      ? task.assigneeName || "Assigned"
                      : "Unassigned"}
                  </span>
                  <AssigneePicker
                    size={24}
                    value={task.assigneeId}
                    onChange={(assigneeId) => updateTask(task.id, { assigneeId })}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 border-t border-line/75 pt-3">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5 font-medium text-muted">
                    <Calendar size={13} className="text-ink/50" /> Start Date
                  </span>
                  <span className="font-semibold text-ink">
                    {formatDisplayDate(task.startDate) || (
                      <span className="text-muted/70 font-normal">Not set</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5 font-medium text-muted">
                    <Clock size={13} className="text-ink/50" /> End Date
                  </span>
                  <span className="font-semibold text-ink">
                    {formatDisplayDate(task.dueAt) || (
                      <span className="text-muted/70 font-normal">Not set</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Project Info */}
              {project && (
                <div className="border-t border-line/75 pt-3">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className="flex items-center gap-1.5 font-medium text-muted">
                      <FolderKanban size={13} className="text-ink/50" /> Project
                    </span>
                    <span className="ml-auto font-semibold text-ink truncate max-w-[140px]">
                      {project.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-line/75 pt-3 text-[11px] text-muted space-y-1">
                {task.createdAt && <div>Created: {task.createdAt.slice(0, 10)}</div>}
                {task.updatedAt && <div>Last updated: {task.updatedAt.slice(0, 10)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
