"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Circle, Clock, Filter, Plus, Trash2, User } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";

const priorityConfig = {
  high: { label: "High", bg: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Medium", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Low", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function ProjectTodoTab({ project }) {
  const { todos, addTodo, patchTodo, deleteTodo, todayDate, users, currentUser } = useApp();
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "done"
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState(currentUser?.id || "");
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  // Filter todos belonging to this project
  const projectTodos = useMemo(() => {
    return todos.filter((t) => t.projectId === project.id);
  }, [todos, project.id]);

  const visibleTodos = useMemo(() => {
    if (filter === "pending") return projectTodos.filter((t) => !t.done && t.status !== "done");
    if (filter === "done") return projectTodos.filter((t) => t.done || t.status === "done");
    return projectTodos;
  }, [projectTodos, filter]);

  const completedCount = projectTodos.filter((t) => t.done || t.status === "done").length;
  const pendingCount = projectTodos.length - completedCount;

  // Project members for assignee dropdown
  const projectMemberUserIds = new Set((project.members || []).map((m) => m.userId));
  const candidateUsers = users.filter((u) => u.active && (projectMemberUserIds.size === 0 || projectMemberUserIds.has(u.id)));

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);

    const ok = await addTodo(
      {
        title: title.trim(),
        priority,
        projectId: project.id,
        assigneeId: assigneeId ? Number(assigneeId) : currentUser?.id,
        status: "todo",
      },
      todayDate,
    );

    setBusy(false);
    if (ok) {
      setTitle("");
      setIsAdding(false);
    }
  }

  function toggleDone(todo) {
    const isDone = todo.done || todo.status === "done";
    void patchTodo(todo, {
      status: isDone ? "todo" : "done",
      done: !isDone,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-bold tracking-tight">Project To-Dos</h3>
          <p className="text-[13.5px] text-muted">
            Track and manage fast deliverables and action items for this project (Jira style).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-white p-0.5 text-[13px] font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1 transition ${filter === "all" ? "bg-slate-100 font-bold text-ink" : "text-muted hover:text-ink"}`}
            >
              All ({projectTodos.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-md px-3 py-1 transition ${filter === "pending" ? "bg-slate-100 font-bold text-ink" : "text-muted hover:text-ink"}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`rounded-md px-3 py-1 transition ${filter === "done" ? "bg-slate-100 font-bold text-ink" : "text-muted hover:text-ink"}`}
            >
              Completed ({completedCount})
            </button>
          </div>
          <button className="btn-primary" onClick={() => setIsAdding((v) => !v)}>
            <Plus size={16} /> New To-Do
          </button>
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="panel p-4 border-brand-300 bg-[#f7faf8] transition-all">
          <h4 className="font-bold text-[14.5px] text-ink mb-3">Add to-do item</h4>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_180px_auto]">
            <input
              type="text"
              required
              autoFocus
              placeholder="What needs to be done in this project?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-brand-500"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-[42px] rounded-lg border border-line bg-white px-3 text-[13.5px] outline-none"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="h-[42px] rounded-lg border border-line bg-white px-3 text-[13.5px] outline-none"
            >
              {candidateUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.id === currentUser?.id ? "(me)" : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button className="btn-primary h-[42px] px-4" disabled={busy || !title.trim()}>
                {busy ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                className="btn-secondary h-[42px] px-3"
                onClick={() => {
                  setIsAdding(false);
                  setTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      <div className="panel divide-y divide-line overflow-visible">
        {visibleTodos.map((todo) => {
          const isDone = todo.done || todo.status === "done";
          const pConf = priorityConfig[todo.priority] || priorityConfig.medium;
          const assignee = users.find((u) => u.id === todo.assigneeId);

          return (
            <div
              key={todo.id}
              className={`flex flex-wrap items-center gap-3.5 px-4 py-3 transition hover:bg-[#fafcfb] ${
                isDone ? "bg-[#fafcfb]/70 opacity-75" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => toggleDone(todo)}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition ${
                  isDone
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-white text-transparent hover:border-brand-400"
                }`}
                aria-label={isDone ? "Mark incomplete" : "Mark complete"}
              >
                <Check size={14} strokeWidth={3} />
              </button>

              <div className="min-w-0 flex-1">
                <p className={`text-[14.5px] font-medium leading-snug ${isDone ? "line-through text-muted" : "text-ink"}`}>
                  {todo.title}
                </p>
                {todo.todoDate && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-muted mt-0.5">
                    <Clock size={12} /> {todo.todoDate}
                    {todo.startTime ? ` · ${todo.startTime}` : ""}
                  </span>
                )}
              </div>

              {/* Priority badge */}
              <span className={`rounded-md border px-2 py-0.5 text-[11.5px] font-semibold ${pConf.bg}`}>
                {pConf.label}
              </span>

              {/* Assignee */}
              {assignee && (
                <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink/75" title={`Assigned to ${assignee.name}`}>
                  <Avatar name={assignee.name} id={assignee.id} size={22} />
                  <span className="hidden sm:inline">{assignee.name}</span>
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => deleteTodo(todo)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                title="Delete to-do"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}

        {visibleTodos.length === 0 && (
          <div className="p-8 text-center text-muted">
            {filter === "all"
              ? "No to-dos created for this project yet. Click 'New To-Do' to get started."
              : `No ${filter} to-dos found.`}
          </div>
        )}
      </div>
    </div>
  );
}
