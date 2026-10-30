"use client";

import { useState } from "react";
import { Plus, Clock, CalendarClock, Check, Play, RefreshCw, EllipsisVertical, ListChecks, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CommentButton from "@/components/comments/CommentButton";
import AssigneePicker from "@/components/ui/AssigneePicker";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { can } from "@/lib/permissions";
import { priorityLabel } from "@/lib/constants";
import { formatTimeRange } from "@/lib/datetime";
import { priorityPill } from "@/components/overview/TodoBoard";
import { todoColumns } from "./columns";

const priorityBorder = { high: "#e5484d", medium: "#f0a020", low: "#2e9e4f" };

function ColumnIcon({ id }) {
  if (id === "todo") return <span className="h-5 w-5 rounded-full border-[3.5px] border-[#e5484d]" />;
  if (id === "progress") return <Play size={17} fill="#2b6fd6" color="#2b6fd6" />;
  if (id === "review") return <RefreshCw size={18} strokeWidth={2.6} color="#f59e0b" />;
  return (
    <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-brand-600 text-white">
      <Check size={14} strokeWidth={3.4} />
    </span>
  );
}

function KanbanCard({ todo }) {
  const { postponeTodo, deleteTodo, patchTodo, currentUser } = useApp();
  const [menu, setMenu] = useState(false);
  useCloseOnOutsideClick(menu, () => setMenu(false));

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("todoId", String(todo.id))}
      className="cursor-grab rounded-xl border-l-4 bg-white p-3.5 shadow-xs transition hover:shadow-md active:cursor-grabbing border border-line/60"
      style={{ borderLeftColor: todo.done ? "#2e9e4f" : priorityBorder[todo.priority] }}
    >
      <div className="flex items-start gap-2">
        {todo.done && (
          <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Check size={12} strokeWidth={3.4} />
          </span>
        )}
        <h4 className={`min-w-0 flex-1 text-[14px] font-medium leading-[1.35] ${todo.done ? "text-ink/50 line-through" : "text-ink"}`}>{todo.title}</h4>
        <div className="relative">
          <button
            className="dots-btn -mr-1"
            aria-label="More actions"
            aria-expanded={menu}
            onClick={(event) => {
              event.stopPropagation();
              setMenu((open) => !open);
            }}
          >
            <EllipsisVertical size={15} />
          </button>
          {menu && (
            <div className="menu-popover right-0 left-auto">
              <button onClick={() => postponeTodo(todo)}>
                <CalendarClock size={15} /> Move to tomorrow
              </button>
              {can.deleteTodo(currentUser, todo) && (
                <>
                  <hr />
                  <button className="danger" onClick={() => deleteTodo(todo)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${priorityPill[todo.priority]}`}>{priorityLabel[todo.priority]}</span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink/65">
          <Clock size={13} /> {formatTimeRange(todo.startTime, todo.endTime)}
        </span>
      </div>
      {todo.projectName && (
        <div className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-ink/60">
          <ListChecks size={14} className="mt-0.5 shrink-0" style={{ color: todo.projectColor ?? undefined }} />
          <span className="min-w-0 truncate">{todo.projectName}</span>
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2">
        <AssigneePicker size={22} value={todo.assigneeId} onChange={(assigneeId) => patchTodo(todo, { assigneeId })} />
        <CommentButton scope="todo" refId={todo.id} title={todo.title} />
      </div>
    </article>
  );
}

/**
 * Status columns; dropping a card on a column changes its status. Four across when wide enough.
 */
export default function KanbanBoard({ todos, onAdd }) {
  const { patchTodo, todos: allTodos } = useApp();
  const [over, setOver] = useState(null);

  function drop(event, status) {
    event.preventDefault();
    setOver(null);
    const todo = allTodos.find((item) => item.id === Number(event.dataTransfer.getData("todoId")));
    if (todo && todo.status !== status) void patchTodo(todo, { status });
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3.5 @min-[480px]:grid-cols-2 @min-[720px]:grid-cols-4">
        {todoColumns.map((column) => {
          const items = todos.filter((todo) => todo.status === column.id);
          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(column.id);
              }}
              onDragLeave={() => setOver((current) => (current === column.id ? null : current))}
              onDrop={(event) => drop(event, column.id)}
              className={`flex min-h-[380px] min-w-0 flex-col rounded-xl border p-2.5 transition ${
                over === column.id ? "border-brand-400 bg-[#e8f6ec]" : "border-line/70 bg-[#f8faf9]"
              }`}
            >
              <div className={`flex min-h-[46px] items-center gap-2 rounded-lg px-2.5 py-1.5 ${column.tint}`}>
                <span className="grid w-5 shrink-0 place-items-center">
                  <ColumnIcon id={column.id} />
                </span>
                <h3 className="min-w-0 text-[14px] font-bold leading-tight tracking-tight text-ink">{column.label}</h3>
                <b className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-white/90 px-1 text-[11.5px] font-semibold text-ink/75">
                  {items.length}
                </b>
                <button
                  className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-md hover:bg-white/60 text-ink/75 transition"
                  onClick={() => onAdd(column.id)}
                  aria-label={`Add task to ${column.label}`}
                >
                  <Plus size={15} />
                </button>
              </div>

              <div className="mt-2.5 flex-1 space-y-2.5 max-h-[580px] overflow-y-auto custom-scrollbar px-0.5 py-0.5">
                {items.map((todo) => (
                  <KanbanCard key={todo.id} todo={todo} />
                ))}
                {items.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-line/70 text-[12.5px] text-muted">
                    No tasks yet
                  </div>
                )}
              </div>

              <button
                onClick={() => onAdd(column.id)}
                className="mt-3 flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#b7dcc2] bg-[#edf7f0] text-[13px] font-semibold text-brand-800 hover:bg-[#dcf0e2] transition"
              >
                <Plus size={15} /> Add task
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
