"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/components/AppProvider";
import { PRIORITIES, TASK_STATUSES, priorityLabel } from "@/lib/constants";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  CornerDownRight,
  ListTodo,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";

const STATUS_CONFIG = {
  todo: { label: "To do", dot: "bg-slate-400" },
  progress: { label: "In progress", dot: "bg-blue-500" },
  review: { label: "In review", dot: "bg-purple-500" },
  blocked: { label: "Blocked", dot: "bg-rose-500" },
  done: { label: "Done", dot: "bg-emerald-500" },
};

const PRIORITY_CONFIG = {
  high: { label: "High", dot: "bg-rose-500" },
  medium: { label: "Medium", dot: "bg-amber-500" },
  low: { label: "Low", dot: "bg-emerald-500" },
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
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

// ---------------- 1. STATUS SELECTOR ----------------
function StatusSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.todo;

  useEffect(() => {
    if (!open) return;
    const clickOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700">Status</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-semibold text-slate-800 hover:border-slate-300 transition shadow-2xs focus:border-brand-500 focus:outline-hidden"
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} shrink-0`} />
          <span className="truncate">{cfg.label}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[150px] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {TASK_STATUSES.map((st) => {
            const sc = STATUS_CONFIG[st] || STATUS_CONFIG.todo;
            const isSelected = value === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  onChange(st);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition ${
                  isSelected ? "bg-[#e8f6ec] font-bold text-brand-900" : "font-medium text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                  <span>{sc.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-brand-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- 2. PRIORITY SELECTOR ----------------
function PrioritySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const cfg = PRIORITY_CONFIG[value] || PRIORITY_CONFIG.medium;

  useEffect(() => {
    if (!open) return;
    const clickOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700">Priority</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-semibold text-slate-800 hover:border-slate-300 transition shadow-2xs focus:border-brand-500 focus:outline-hidden"
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} shrink-0`} />
          <span className="truncate">{cfg.label}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[140px] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {PRIORITIES.map((pr) => {
            const pc = PRIORITY_CONFIG[pr] || PRIORITY_CONFIG.medium;
            const isSelected = value === pr;
            return (
              <button
                key={pr}
                type="button"
                onClick={() => {
                  onChange(pr);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition ${
                  isSelected ? "bg-[#e8f6ec] font-bold text-brand-900" : "font-medium text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${pc.dot}`} />
                  <span>{pc.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-brand-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- 3. ASSIGNEE SELECTOR ----------------
function AssigneeSelector({ value, onChange, users, currentUserId }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedUser = users.find((u) => u.id === Number(value)) || null;

  useEffect(() => {
    if (!open) return;
    const clickOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700">Assign to</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-semibold text-slate-800 hover:border-slate-300 transition shadow-2xs focus:border-brand-500 focus:outline-hidden"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedUser ? (
            <>
              <Avatar name={selectedUser.name} id={selectedUser.id} size={18} />
              <span className="truncate">{selectedUser.name}</span>
            </>
          ) : (
            <>
              <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-slate-100 text-slate-400 shrink-0">
                <User size={11} />
              </span>
              <span className="text-slate-500 font-normal">Unassigned</span>
            </>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[190px] max-h-[220px] overflow-y-auto custom-scrollbar rounded-xl border border-line bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition ${
              !selectedUser ? "bg-[#e8f6ec] font-bold text-brand-900" : "font-medium text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-100 text-slate-400">
                <User size={10} />
              </span>
              <span>Unassigned</span>
            </div>
            {!selectedUser && <Check size={13} className="text-brand-700" />}
          </button>

          {users
            .filter((u) => u.active)
            .map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition ${
                    isSelected ? "bg-[#e8f6ec] font-bold text-brand-900" : "font-medium text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Avatar name={u.name} id={u.id} size={16} />
                    <span className="truncate">
                      {u.name} {u.id === currentUserId ? "(me)" : ""}
                    </span>
                  </div>
                  {isSelected && <Check size={13} className="text-brand-700 shrink-0" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ---------------- 4. CATEGORY SELECTOR ----------------
function CategorySelector({ value, onChange, availableCategories, isCustom, setIsCustom }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Tag size={13} className="text-slate-400" />
          Category
        </span>
        {isCustom && (
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange("");
            }}
            className="text-[11px] font-medium text-brand-700 hover:underline"
          >
            Choose existing
          </button>
        )}
      </div>

      {!isCustom ? (
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setIsCustom(true);
                onChange("");
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-2xs cursor-pointer appearance-none pr-8"
          >
            <option value="">No category</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">+ Custom category...</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            autoFocus
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type custom category name..."
            className="flex-1 rounded-xl border border-brand-500 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 outline-none ring-2 ring-brand-500/15"
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange("");
            }}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- 5. PARENT TASK COMBOBOX ----------------
function ParentTaskCombobox({ value, onChange, tasks }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === Number(value)) || null,
    [tasks, value],
  );

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        (t.issueKey || "").toLowerCase().includes(q) ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q),
    );
  }, [tasks, query]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-slate-700">Parent task</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-medium text-slate-800 transition hover:border-slate-300 focus:border-brand-500 focus:outline-hidden shadow-2xs"
      >
        <span className="truncate">
          {selectedTask ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-[11px] font-bold text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 shrink-0">
                {selectedTask.issueKey}
              </span>
              <span className="truncate font-semibold text-slate-900">{selectedTask.title}</span>
            </span>
          ) : (
            <span className="text-slate-400">No parent — top level task</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-line bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="relative flex items-center border-b border-line/70 bg-[#f8faf9] px-2.5 py-2">
            <Search size={14} className="pointer-events-none text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              placeholder="Search parent task by title or NX key..."
              className="w-full bg-transparent pl-2 pr-6 text-[12.5px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 grid h-5 w-5 place-items-center rounded-md text-slate-400 hover:bg-black/5 hover:text-slate-800"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar divide-y divide-line/40 p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition ${
                !selectedTask
                  ? "bg-[#e8f6ec] font-bold text-brand-900"
                  : "font-medium text-slate-700 hover:bg-[#f5f8f6]"
              }`}
            >
              <span>No parent — top level task</span>
              {!selectedTask && <Check size={13} className="shrink-0 text-brand-700" />}
            </button>

            {filteredTasks.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    onChange(task.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    isSelected ? "bg-[#e8f6ec] text-brand-900" : "hover:bg-[#f5f8f6] text-slate-800"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[12.5px] leading-snug">
                      <span className="font-mono text-[11px] font-bold text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 shrink-0">
                        {task.issueKey}
                      </span>
                      <span className={`truncate ${isSelected ? "font-bold" : "font-semibold text-slate-900"}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.category && (
                      <p className="mt-0.5 truncate text-[11px] font-normal text-slate-400 pl-0.5">
                        {task.category}
                      </p>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="mt-0.5 shrink-0 text-brand-700" />}
                </button>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="px-3 py-3 text-center text-[12px] font-normal text-slate-400">
                No matching parent tasks found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- 6. MODERN DATE PICKER FIELD ----------------
function DatePickerField({ label, value, onChange, min, optional = true }) {
  const inputRef = useRef(null);

  const setPreset = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className={value ? "text-brand-700" : "text-slate-400"} />
          {label}
        </span>
        {optional && <span className="text-[11px] font-normal text-slate-400">Optional</span>}
      </div>

      <div
        onClick={() => {
          try {
            inputRef.current?.showPicker();
          } catch {
            inputRef.current?.focus();
          }
        }}
        className={`relative flex items-center justify-between rounded-xl border px-3 py-2 text-[13px] font-medium transition cursor-pointer select-none shadow-2xs ${
          value
            ? "bg-brand-50/60 border-brand-500/60 text-slate-900 ring-1 ring-brand-500/20"
            : "bg-white border-line text-slate-400 hover:bg-slate-50/80 hover:border-slate-300"
        }`}
      >
        <span className={value ? "text-slate-900 font-semibold" : "text-slate-400"}>
          {value ? formatDisplayDate(value) : `Pick ${label.toLowerCase()}`}
        </span>

        <input
          ref={inputRef}
          type="date"
          min={min}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          tabIndex={-1}
        />

        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-md p-0.5 text-slate-400 hover:text-slate-700 hover:bg-black/5 transition"
            title="Clear date"
          >
            <X size={13} />
          </button>
        ) : (
          <Calendar size={14} className="text-slate-400" />
        )}
      </div>

      {/* Quick shortcuts */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => setPreset(0)}
          className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500 bg-slate-100 hover:bg-brand-50 hover:text-brand-800 transition"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setPreset(1)}
          className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500 bg-slate-100 hover:bg-brand-50 hover:text-brand-800 transition"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => setPreset(7)}
          className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500 bg-slate-100 hover:bg-brand-50 hover:text-brand-800 transition"
        >
          +1 Week
        </button>
      </div>
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------
export default function IssueModal() {
  const {
    issueModal,
    closeIssueModal,
    createIssue,
    updateTask,
    deleteTask,
    tasks,
    projects,
    users,
    currentUser,
    isMember,
    myProjects,
  } = useApp();

  const parent = issueModal.parent;
  const editingTask = issueModal.task;
  const [saving, setSaving] = useState(false);

  // Resolved projectId
  const resolvedProjectId =
    editingTask?.projectId ??
    parent?.projectId ??
    issueModal.projectId ??
    (isMember ? myProjects[0]?.id : projects[0]?.id) ??
    projects[0]?.id ??
    null;

  const currentProject = projects.find((p) => p.id === resolvedProjectId) || null;

  const [form, setForm] = useState({
    title: editingTask?.title ?? "",
    category: editingTask?.category ?? "",
    type: editingTask?.type ?? "Task",
    status: editingTask?.status ?? issueModal?.initialStatus ?? "todo",
    priority: editingTask?.priority ?? "medium",
    projectId: resolvedProjectId,
    parentId: editingTask?.parentId ?? parent?.id ?? null,
    assigneeId: editingTask?.assigneeId ?? null,
    blockerReason: editingTask?.blockerReason ?? "",
    startDate: editingTask?.startDate ? editingTask.startDate.slice(0, 10) : issueModal.startDate ? issueModal.startDate.slice(0, 10) : "",
    dueAt: editingTask?.dueAt ? editingTask.dueAt.slice(0, 10) : issueModal.dueAt ? issueModal.dueAt.slice(0, 10) : "",
  });

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  // Get all unique categories across tasks
  const availableCategories = useMemo(() => {
    const setCat = new Set();
    tasks.forEach((t) => {
      if (t.category && typeof t.category === "string" && t.category.trim()) {
        setCat.add(t.category.trim());
      }
    });
    if (editingTask?.category && typeof editingTask.category === "string" && editingTask.category.trim()) {
      setCat.add(editingTask.category.trim());
    }
    return Array.from(setCat).sort();
  }, [tasks, editingTask]);

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Filter available parent tasks to top-level tasks in the same project
  const projectTasks = tasks.filter(
    (t) => t.projectId === form.projectId && !t.parentId && (!editingTask || t.id !== editingTask.id),
  );

  const isSubtask = Boolean(editingTask?.parentId || parent?.id || form.parentId);
  const parentTaskObj = tasks.find((t) => t.id === Number(form.parentId || editingTask?.parentId || parent?.id));

  async function submit(event) {
    if (event) event.preventDefault();
    if (!form.title.trim() || saving) return;

    setSaving(true);
    const payload = {
      ...form,
      category: form.category?.trim() || null,
      projectId: Number(form.projectId),
      type: form.type || "Task",
      estimateHours: 0,
      loggedHours: 0,
      startDate: form.startDate ? form.startDate : null,
      dueAt: form.dueAt ? form.dueAt : null,
      blockerReason:
        form.status === "blocked"
          ? form.blockerReason?.trim() || "Blocked by external dependency"
          : null,
    };

    if (editingTask) {
      await updateTask(editingTask.id, payload);
      setSaving(false);
      closeIssueModal();
    } else {
      const created = await createIssue(payload);
      setSaving(false);
      if (created) closeIssueModal();
    }
  }

  // Keyboard shortcut Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, saving]);

  async function handleDelete() {
    if (!editingTask) return;
    if (!confirm(`Are you sure you want to delete "${editingTask.title}"?`)) return;
    await deleteTask(editingTask.id);
    closeIssueModal();
  }

  return (
    <Modal
      size="wide"
      compact={true}
      eyebrow={
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-800 uppercase tracking-wider border border-brand-200">
            {isSubtask ? <CornerDownRight size={11} /> : <ListTodo size={11} />}
            {isSubtask ? "Subtask" : "Task"}
          </span>
          {editingTask?.issueKey && (
            <span className="font-mono text-[11.5px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
              {editingTask.issueKey}
            </span>
          )}
          {currentProject?.name && (
            <span className="text-[12px] font-medium text-slate-400 truncate max-w-[200px]">
              {currentProject.name}
            </span>
          )}
        </span>
      }
      title={editingTask ? "Edit task details" : "Create new task"}
      subtitle={
        isSubtask && parentTaskObj ? (
          <span className="flex items-center gap-1.5 text-[12.5px] text-slate-500 mt-0.5">
            <span>Subtask of:</span>
            <span className="font-semibold text-brand-800 font-mono bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
              {parentTaskObj.issueKey}
            </span>
            <span className="truncate max-w-sm font-medium text-slate-700">· {parentTaskObj.title}</span>
          </span>
        ) : null
      }
      onClose={closeIssueModal}
    >
      <form onSubmit={submit} className="space-y-4 pt-1">
        {/* 1. Task Title / Summary (Hero input) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-slate-700">
            Task summary <span className="text-rose-500">*</span>
          </label>
          <input
            required
            autoFocus
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. 1.1 Create Google Ads campaign"
            className="w-full rounded-xl border border-line bg-[#f9fbf9] px-3.5 py-2.5 text-[15px] font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* 2. Metadata Strip: Status, Priority, Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatusSelector value={form.status} onChange={(status) => set({ status })} />
          <PrioritySelector value={form.priority} onChange={(priority) => set({ priority })} />
          <AssigneeSelector
            value={form.assigneeId}
            onChange={(assigneeId) => set({ assigneeId })}
            users={users}
            currentUserId={currentUser?.id}
          />
        </div>

        {/* Blocker Alert (Only when status is 'blocked') */}
        {form.status === "blocked" && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50/90 p-3 animate-in fade-in duration-150">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="block text-[12px] font-bold text-rose-800 mb-1">Blocker Reason:</span>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder:text-rose-300"
                placeholder="What is blocking this task? (e.g. Waiting for client API credentials)"
                value={form.blockerReason}
                onChange={(e) => set({ blockerReason: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* 3. Category & Parent Task */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CategorySelector
            value={form.category}
            onChange={(category) => set({ category })}
            availableCategories={availableCategories}
            isCustom={isCustomCategory}
            setIsCustom={setIsCustomCategory}
          />
          <ParentTaskCombobox
            value={form.parentId}
            onChange={(parentId) => set({ parentId })}
            tasks={projectTasks}
          />
        </div>

        {/* 4. Modern Date Picker Fields (Start Date & End Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <DatePickerField
            label="Start date"
            value={form.startDate}
            onChange={(startDate) => set({ startDate })}
          />
          <DatePickerField
            label="End date (Due date)"
            value={form.dueAt}
            min={form.startDate || undefined}
            onChange={(dueAt) => set({ dueAt })}
          />
        </div>

        {/* 5. Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-line mt-2">
          <div>
            {editingTask ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
              >
                <Trash2 size={13} /> Delete task
              </button>
            ) : (
              <span className="text-[11.5px] text-slate-400 font-medium hidden sm:inline select-none">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-mono font-semibold text-slate-600">Ctrl</kbd> + <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-mono font-semibold text-slate-600">Enter</kbd> to save
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-line bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              onClick={closeIssueModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-40 transition cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {editingTask ? "Saving..." : "Creating..."}
                </>
              ) : (
                editingTask ? "Save changes" : "Create task"
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
