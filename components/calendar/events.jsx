import Link from "next/link";

// A calendar "event" is either a task with a due date or a Daily To-Do. Both are normalised to one shape.
export const KINDS = {
  task: { label: "Task", tone: "green" },
  todo: { label: "To-do", tone: "blue" },
  milestone: { label: "Milestone", tone: "purple" },
};

export const TONES = {
  green: { bg: "bg-[#dcf3e1]", text: "text-[#1f6b3a]", dot: "#1f9d55" },
  blue: { bg: "bg-[#dfeafd]", text: "text-[#1d4fb8]", dot: "#2b6fd6" },
  purple: { bg: "bg-[#eadffc]", text: "text-[#5b2bb0]", dot: "#7c3aed" },
  red: { bg: "bg-[#fde1e1]", text: "text-[#b42323]", dot: "#e5484d" },
};

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** "15:00" -> "3:00 PM" */
export function formatClock(time) {
  if (!time) return "All day";
  const [hours, minutes] = time.split(":").map(Number);
  return timeFormat.format(new Date(2000, 0, 1, hours, minutes));
}

export function buildEvents({ tasks, todos }) {
  const events = [];
  for (const task of tasks) {
    if (!task.dueAt) continue;
    events.push({
      id: `issue-${task.id}`,
      source: "issue",
      kind: task.type === "Feature" ? "milestone" : "task",
      title: task.title,
      key: task.issueKey,
      date: task.dueAt.slice(0, 10),
      time: task.dueAt.slice(11, 16) || null,
      projectId: task.projectId,
      projectName: task.projectName,
      priority: task.priority,
      done: task.status === "done",
      href: `/projects/${task.projectId}`,
    });
  }
  for (const todo of todos) {
    events.push({
      id: `todo-${todo.id}`,
      source: "todo",
      kind: "todo",
      title: todo.title,
      key: null,
      date: todo.todoDate,
      time: todo.startTime,
      projectId: todo.projectId,
      projectName: todo.projectName,
      priority: todo.priority,
      done: todo.done,
      href: "/daily-todo",
    });
  }
  return events;
}

/** Open high-priority work is red whatever it is; everything else takes its kind's colour. */
export const toneOf = (event) => TONES[event.priority === "high" && !event.done ? "red" : KINDS[event.kind].tone];

export const byTime = (a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.title.localeCompare(b.title);

/** Compact coloured pill used inside month cells. Long titles wrap instead of being cut off. */
export function EventPill({ event }) {
  const tone = toneOf(event);
  return (
    <Link
      href={event.href}
      title={`${formatClock(event.time)} · ${event.title}`}
      className={`flex items-start gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium leading-tight transition hover:brightness-95 ${tone.bg} ${tone.text} ${event.done ? "line-through opacity-60" : ""}`}
    >
      <i className="mt-[3px] h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: tone.dot }} />
      <span className="min-w-0">{event.title}</span>
    </Link>
  );
}

/** Larger card for the week, day and agenda views. */
export function EventCard({ event, showDate = false }) {
  const tone = toneOf(event);
  return (
    <Link
      href={event.href}
      className="block rounded-lg border-l-4 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(16,60,35,0.1)] transition hover:bg-[#f9fcfa]"
      style={{ borderLeftColor: tone.dot }}
    >
      <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
        <span className="font-medium text-ink/70">{formatClock(event.time)}</span>
        <span className={`rounded px-1.5 py-px font-semibold ${tone.bg} ${tone.text}`}>{KINDS[event.kind].label}</span>
        {showDate && <span>{event.date}</span>}
      </div>
      <p className={`mt-1 text-[14.5px] font-medium leading-snug ${event.done ? "text-ink/50 line-through" : ""}`}>{event.title}</p>
      {(event.projectName || event.key) && (
        <p className="mt-0.5 text-[12.5px] text-muted">
          {event.key ? `${event.key} · ` : ""}
          {event.projectName}
        </p>
      )}
    </Link>
  );
}
