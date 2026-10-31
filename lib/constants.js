export const TASK_TYPES = ["Feature", "Task", "Bug", "Subtask"];
export const TASK_STATUSES = ["todo", "progress", "review", "blocked", "done"];

export const TASK_STATUS_LABELS = {
  todo: "To do",
  progress: "In progress",
  review: "In Review / QA",
  blocked: "Blocked",
  done: "Done",
};

// A project moves through these stages, in order.
export const PROJECT_STAGES = [
  { id: "account_setup", label: "Account Setup" },
  { id: "working", label: "Working" },
  { id: "in_progress", label: "In Progress" },
  { id: "complete", label: "Complete" },
];
export const DEFAULT_STAGE = PROJECT_STAGES[0].id;
export const isStage = (value) => PROJECT_STAGES.some((stage) => stage.id === value);
export const PRIORITIES = ["high", "medium", "low"];
// Preset sticky-note colours; a note's colour may also be any custom "#rrggbb" value.
export const STICKY_COLORS = ["yellow", "green", "pink", "blue", "orange", "purple", "teal", "red", "lime", "grey"];
export const STICKY_CATEGORIES = ["important", "work", "personal"];
export const NOTE_TAGS = ["meeting", "requirement", "ideas", "links", "important", "personal"];
export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
export const isStickyColor = (value) => STICKY_COLORS.includes(value) || HEX_COLOR_RE.test(value ?? "");
export const TODO_STATUSES = ["todo", "progress", "review", "done"];

export const priorityLabel = { high: "High", medium: "Medium", low: "Low" };

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
