"use client";

import { useState } from "react";
import { CalendarCheck, CalendarClock, Plus, Check, EllipsisVertical, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CommentButton from "@/components/comments/CommentButton";
import AssigneePicker from "@/components/ui/AssigneePicker";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { can } from "@/lib/permissions";
import { priorityLabel } from "@/lib/constants";
import { formatTimeRange, longDate } from "@/lib/datetime";

export const priorityPill = {
  high: "bg-[#fcdcdc] text-[#d63a3a]",
  medium: "bg-[#fdf0c4] text-[#8a6508]",
  low: "bg-[#d9f3df] text-[#2d7a45]",
};

const blankForm = { title: "", priority: "medium", startTime: "", endTime: "" };

/** A day's to-dos as a checklist (Overview "Today's To-Do Board" and the Daily To-Do "List" view). */
export default function TodoBoard({ title, date, todos, bare = false }) {
  const { patchTodo, deleteTodo, postponeTodo, addTodo, currentUser, users } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...blankForm, assigneeId: currentUser.id });
  const [menuId, setMenuId] = useState(null);
  useCloseOnOutsideClick(menuId !== null, () => setMenuId(null));

  const done = todos.filter((todo) => todo.done).length;
  const percent = todos.length ? Math.round((done / todos.length) * 100) : 0;

  async function submit(event) {
    event.preventDefault();
    if (await addTodo(form, date)) {
      setForm({ ...blankForm, assigneeId: currentUser.id });
      setAdding(false);
    }
  }

  return (
    <section className={`flex flex-col ${bare ? "p-2" : "panel p-5"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <CalendarCheck className="text-brand-700" size={32} strokeWidth={1.7} />
        <div className="leading-tight">
          <h2 className="text-[21px] font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[15px] text-muted">{longDate(date)}</p>
        </div>
        <div className="ml-auto w-[190px]">
          <p className="text-[12.5px] text-ink/80">
            <b>{done} / {todos.length}</b> completed
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-[7px] flex-1 rounded-full bg-[#dcefe1]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#3cb865] to-[#1f8a4c] transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[12.5px] text-ink/80">{percent}%</span>
          </div>
        </div>
      </div>

      <div className="mt-[18px] flex flex-1 flex-col overflow-hidden rounded-xl border border-line">
        <div className="hidden grid-cols-[1fr_112px_132px_56px] rounded-t-xl bg-[#f6f9f7] px-4 py-[11px] text-[12px] font-medium uppercase tracking-wider text-ink/65 sm:grid">
          <span>Task</span>
          <span>Priority</span>
          <span>Time</span>
          <span className="text-center">Actions</span>
        </div>
        <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex min-h-[44px] items-center gap-3 border-t border-line px-4 py-1.5 first:border-t-0 sm:grid sm:grid-cols-[1fr_112px_132px_56px]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <button
                  className="check-box"
                  aria-pressed={todo.done}
                  aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                  onClick={() => patchTodo(todo, { status: todo.done ? "todo" : "done" })}
                >
                  {todo.done && <Check size={15} strokeWidth={3.2} />}
                </button>
                <span className={`min-w-0 text-[15px] ${todo.done ? "text-ink/45 line-through" : ""}`}>{todo.title}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <CommentButton scope="todo" refId={todo.id} title={todo.title} />
                  <AssigneePicker size={24} value={todo.assigneeId} onChange={(assigneeId) => patchTodo(todo, { assigneeId })} />
                </span>
              </div>
              <span className={`w-fit min-w-[66px] rounded-full px-3 py-[3px] text-center text-[13px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${priorityPill[todo.priority]}`}>
                {priorityLabel[todo.priority]}
              </span>
              <time className="hidden whitespace-nowrap text-[15px] text-ink/75 sm:block">{formatTimeRange(todo.startTime, todo.endTime)}</time>
              <div className="relative text-center">
                <button
                  className="dots-btn mx-auto"
                  aria-label="More actions"
                  aria-expanded={menuId === todo.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuId(menuId === todo.id ? null : todo.id);
                  }}
                >
                  <EllipsisVertical size={18} />
                </button>
                {menuId === todo.id && (
                  <div className="menu-popover text-left">
                    <button onClick={() => postponeTodo(todo)}>
                      <CalendarClock size={16} /> Move to tomorrow
                    </button>
                    {can.deleteTodo(currentUser, todo) && (
                      <>
                        <hr />
                        <button className="danger" onClick={() => deleteTodo(todo)}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
          {!todos.length && <li className="px-4 py-6 text-center text-[14px] text-muted">Nothing planned for this day yet.</li>}
        </ul>
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-[#f6faf7] p-3">
          <input
            required
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to get done?"
            className="h-10 min-w-[200px] flex-1 rounded-lg border border-line bg-white px-3 text-[14.5px] outline-none focus:border-brand-500"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            aria-label="Priority"
            className="h-10 rounded-lg border border-line bg-white px-2 text-[14px]"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={form.assigneeId ?? ""}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value ? Number(e.target.value) : null })}
            aria-label="Assign to"
            className="h-10 rounded-lg border border-line bg-white px-2 text-[14px]"
          >
            {users
              .filter((user) => user.active)
              .map((user) => (
                <option key={user.id} value={user.id}>{user.id === currentUser.id ? `${user.name} (me)` : user.name}</option>
              ))}
            <option value="">Unassigned</option>
          </select>
          <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} aria-label="Start time" className="h-10 rounded-lg border border-line bg-white px-2 text-[14px]" />
          <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} aria-label="End time" className="h-10 rounded-lg border border-line bg-white px-2 text-[14px]" />
          <button className="btn-primary btn-compact">Add</button>
          <button type="button" className="btn-secondary btn-compact" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#b7dcc2] bg-[#e8f6ec] text-[14.5px] font-semibold text-brand-800 hover:bg-[#dcf0e2]"
        >
          <Plus size={17} /> Add task
        </button>
      )}
    </section>
  );
}
