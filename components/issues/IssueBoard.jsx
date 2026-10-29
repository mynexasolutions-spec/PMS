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
      className="cursor-grab rounded-lg border-l-[4px] bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(16,60,35,0.1)] active:cursor-grabbing"
      style={{ borderLeftColor: style.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${style.badge}`}>{task.type}</span>
        <b className="text-[12.5px] font-semibold text-ink/60">{task.issueKey}</b>
      </div>
      <h4 className="mt-2 text-[15px] font-medium leading-[1.3]">{task.title}</h4>
      {task.parentKey && (
        <p className="mt-1 text-[12.5px] text-muted">↳ {task.parentKey} · {task.parentTitle}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[12.5px] text-ink/65">
        <span className="flex min-w-0 items-center gap-1.5">
          <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: priorityDot[task.priority] }} title={`${task.priority} priority`} />
          <span>{task.projectName}</span>
        </span>
        <time className="shrink-0">{formatDue(task.dueAt)}</time>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2">
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
        <button className="h-7 rounded-md px-2 text-[12.5px] font-medium text-brand-700 hover:bg-[#e8f6ec]" onClick={() => openIssueModal(task)}>
          + child
        </button>
        <div className="ml-auto flex items-center gap-1">
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

  function drop(event, status) {
    event.preventDefault();
    setOver(null);
    const id = Number(event.dataTransfer.getData("taskId"));
    const task = tasks.find((item) => item.id === id);
    if (task && task.status !== status) void updateTask(id, { status });
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="text-[21px] font-bold tracking-tight">{title}</h2>
          <span className="text-[13.5px] text-muted">{subtitle}</span>
        </div>
        <button className="btn-primary btn-compact ml-auto" onClick={() => openIssueModal()}>
          <Plus size={16} /> Create task
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold">
        {Object.entries(typeStyle).map(([type, style]) => (
          <span key={type} className={`rounded-md px-2 py-0.5 ${style.badge}`}>{type}</span>
        ))}
        <p className="ml-1 font-normal text-muted">Drag tasks between columns to update their status.</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const items = tasks.filter((task) => task.status === column.id);
          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(column.id);
              }}
              onDragLeave={() => setOver((current) => (current === column.id ? null : current))}
              onDrop={(event) => drop(event, column.id)}
              className={`min-h-[220px] rounded-xl border p-2 transition ${over === column.id ? "border-brand-400 bg-[#e8f6ec]" : "border-line bg-[#f6f9f7]"}`}
            >
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <div>
                  <h3 className="text-[16px] font-bold leading-tight">{column.label}</h3>
                  <span className="text-[12.5px] text-muted">{column.hint}</span>
                </div>
                <b className="grid h-[26px] min-w-[28px] place-items-center rounded-full bg-white px-2 text-[13px] font-medium text-ink/75 shadow-sm">{items.length}</b>
              </div>
              <div className="space-y-2.5">
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
