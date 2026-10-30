"use client";

import { useState } from "react";
import { Plus, ArrowLeft, ArrowRight, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CommentButton from "@/components/comments/CommentButton";
import AssigneePicker from "@/components/ui/AssigneePicker";
import { parseLocalDate } from "@/lib/datetime";
import { can } from "@/lib/permissions";

const columns = [
  { id: "todo", label: "To do", hint: "Ready to start" },
  { id: "progress", label: "In progress", hint: "Active work" },
  { id: "done", label: "Done", hint: "Completed" },
];

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
  const style = typeStyle[task.type];

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("taskId", String(task.id))}
      className="cursor-grab overflow-hidden rounded-lg border-l-[4px] bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(16,60,35,0.1)] transition hover:shadow-md active:cursor-grabbing"
      style={{ borderLeftColor: style.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${style.badge}`}>{task.type}</span>
        <b className="text-[12.5px] font-semibold text-ink/60">{task.issueKey}</b>
      </div>
      <h4 className="mt-2 line-clamp-2 text-[14.5px] font-medium leading-[1.35]">{task.title}</h4>
      {task.parentKey && (
        <p className="mt-1 truncate text-[12px] text-muted">↳ {task.parentKey} · {task.parentTitle}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px] text-ink/65">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: priorityDot[task.priority] }} title={`${task.priority} priority`} />
          <span className="truncate">{task.projectName}</span>
        </span>
        <time className="shrink-0 whitespace-nowrap">{formatDue(task.dueAt)}</time>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-line pt-2">
        <div className="flex items-center gap-1">
          {task.status !== "todo" && (
            <button className="dots-btn" aria-label="Move left" onClick={() => updateTask(task.id, { status: task.status === "done" ? "progress" : "todo" })}>
              <ArrowLeft size={15} />
            </button>
          )}
          {task.status !== "done" && (
            <button className="dots-btn" aria-label="Move right" onClick={() => updateTask(task.id, { status: task.status === "todo" ? "progress" : "done" })}>
              <ArrowRight size={15} />
            </button>
          )}
          <button className="h-7 rounded-md px-1.5 text-[12px] font-medium text-brand-700 hover:bg-[#e8f6ec]" onClick={() => openIssueModal(task)}>
            + child
          </button>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <CommentButton scope="task" refId={task.id} title={`${task.issueKey} · ${task.title}`} />
          <AssigneePicker align="right" size={24} value={task.assigneeId} onChange={(assigneeId) => updateTask(task.id, { assigneeId })} />
          {can.deleteTask(currentUser, task) && (
            <button className="dots-btn text-red-500 hover:!bg-red-50" aria-label="Delete task" onClick={() => deleteTask(task)}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Three-column drag-and-drop task board. Dropping a card on a column updates its status. */
export default function IssueBoard({ tasks, eyebrow, title, subtitle }) {
  const { updateTask, openIssueModal } = useApp();
  const [over, setOver] = useState(null);
  const [mobileTab, setMobileTab] = useState("todo");

  function drop(event, status) {
    event.preventDefault();
    setOver(null);
    const id = Number(event.dataTransfer.getData("taskId"));
    const task = tasks.find((item) => item.id === id);
    if (task && task.status !== status) void updateTask(id, { status });
  }

  return (
    <section className="panel p-4 sm:p-5">
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

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] sm:text-[12.5px] font-semibold">
        {Object.entries(typeStyle).map(([type, style]) => (
          <span key={type} className={`rounded-md px-2 py-0.5 ${style.badge}`}>{type}</span>
        ))}
        <p className="hidden sm:block ml-1 font-normal text-muted">Drag tasks between columns to update their status.</p>
      </div>

      {/* Mobile Column Tabs (Only shown on mobile < md) */}
      <div className="mt-4 flex gap-1.5 rounded-xl border border-line bg-[#f0f5f1] p-1.5 md:hidden">
        {columns.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          const active = mobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={`flex flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-2 px-1 text-[12px] sm:text-[13px] font-semibold transition ${
                active
                  ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                  : "text-ink/65 hover:text-ink hover:bg-black/[0.02]"
              }`}
            >
              <span className="truncate">{col.label}</span>
              <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-bold ${active ? "bg-[#dcefe1] text-brand-800" : "bg-black/5 text-ink/60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Columns: on mobile only active tab's column is displayed; on md+ all 3 columns are shown */}
      <div className="mt-3 md:mt-4 grid gap-3.5 grid-cols-1 md:grid-cols-3">
        {columns.map((column) => {
          const items = tasks.filter((task) => task.status === column.id);
          const isHiddenOnMobile = mobileTab !== column.id;
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
                isHiddenOnMobile ? "hidden md:flex" : "flex"
              } flex-col min-h-[220px] rounded-xl border p-2.5 transition ${over === column.id ? "border-brand-400 bg-[#e8f6ec]" : "border-line bg-[#f6f9f7]"}`}
            >
              <div className="flex items-center justify-between px-2 pb-2.5 pt-1">
                <div>
                  <h3 className="text-[16px] font-bold leading-tight">{column.label}</h3>
                  <span className="text-[12.5px] text-muted">{column.hint}</span>
                </div>
                <b className="grid h-[26px] min-w-[28px] place-items-center rounded-full bg-white px-2 text-[13px] font-medium text-ink/75 shadow-sm">{items.length}</b>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar px-1 py-1 pr-1.5">
                {items.map((task) => (
                  <IssueCard key={task.id} task={task} />
                ))}
                {!items.length && <div className="empty-view">Drop a task here</div>}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
