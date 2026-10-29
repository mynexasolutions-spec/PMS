"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { request, upload } from "@/lib/api";
import { daysBetween, shiftDate, startOfDay, toLocalDate } from "@/lib/datetime";

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

const sortTodos = (list) =>
  [...list].sort(
    (a, b) =>
      a.todoDate.localeCompare(b.todoDate) ||
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") ||
      a.id - b.id,
  );

const sortSticky = (list) => [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id);

/** Holds all workspace data and the actions that change it, shared by every page. */
export function AppProvider({ initial, children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState(initial.tasks);
  const [projects, setProjects] = useState(initial.projects);
  const [notes, setNotes] = useState(initial.notes);
  const [todos, setTodos] = useState(initial.todos);
  const [sticky, setSticky] = useState(initial.sticky);
  const [focusItems, setFocusItems] = useState(initial.focus);
  const [users, setUsers] = useState(initial.users);
  const [commentCounts, setCommentCounts] = useState(initial.commentCounts);
  const currentUser = initial.user;

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(null);
  const [todayDate, setTodayDate] = useState(initial.today);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [issueModal, setIssueModal] = useState(null); // { parent } while open
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [stickyModalOpen, setStickyModalOpen] = useState(false);

  // Browser-local time is only known after mount, so the server and first client render match.
  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);
      setTodayDate(toLocalDate(current));
    };
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setQuery("");
    setSidebarOpen(false);
  }, [pathname]);

  const notify = setToast;

  // ---------- tasks ----------

  async function updateTask(id, update) {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...update } : task)));
    const { ok, data } = await request(`/api/tasks/${id}`, "PATCH", update);
    if (!ok) {
      setTasks(previous);
      notify(data?.error ?? "The task could not be updated.");
      return;
    }
    setTasks((current) => current.map((task) => (task.id === id ? data.task : task)));
  }

  async function createIssue(form) {
    const { ok, data } = await request("/api/tasks", "POST", { ...form, dueAt: form.dueAt || null });
    if (!ok) {
      notify(data?.error ?? "The task could not be created.");
      return false;
    }
    setTasks((current) => [...current, data.task]);
    notify(`${data.task.issueKey} created successfully.`);
    return true;
  }

  async function deleteTask(task) {
    const { ok } = await request(`/api/tasks/${task.id}`, "DELETE");
    if (!ok) return;
    // The database un-links children (parent_id -> NULL); mirror that locally.
    setTasks((current) =>
      current
        .filter((item) => item.id !== task.id)
        .map((item) => (item.parentId === task.id ? { ...item, parentId: null, parentKey: null, parentTitle: null } : item)),
    );
    notify(`${task.issueKey} removed.`);
  }

  // ---------- projects ----------

  async function createProject(name, color, description = "") {
    const { ok, data } = await request("/api/projects", "POST", { name, color, description });
    if (!ok) {
      notify(data?.error ?? "The project could not be created.");
      return null;
    }
    setProjects((current) => [...current, data.project]);
    notify(`${data.project.name} created.`);
    return data.project;
  }

  /** Changes a project's stage (or name, description, colour) with an optimistic update. */
  async function updateProject(id, patch) {
    const previous = projects;
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, ...patch } : project)));
    const { ok, data } = await request(`/api/projects/${id}`, "PATCH", patch);
    if (!ok) {
      setProjects(previous);
      notify(data?.error ?? "The project could not be updated.");
      return false;
    }
    setProjects((current) => current.map((project) => (project.id === id ? data.project : project)));
    return true;
  }

  // ---------- team (accounts) ----------

  async function signOut() {
    await request("/api/auth/logout", "POST");
    window.location.assign("/login");
  }

  async function addUser(input) {
    const { ok, data } = await request("/api/users", "POST", input);
    if (!ok) {
      notify(data?.error ?? "The person could not be added.");
      return false;
    }
    setUsers((current) => [...current, data.user]);
    notify(`${data.user.name} added to the team.`);
    return true;
  }

  async function editUser(id, patch) {
    const { ok, data } = await request(`/api/users/${id}`, "PATCH", patch);
    if (!ok) {
      notify(data?.error ?? "The account could not be updated.");
      return false;
    }
    setUsers((current) => current.map((user) => (user.id === id ? data.user : user)));
    return true;
  }

  /** Keeps the comment badges in step after a comment is added or removed. */
  function setCommentCount(scope, ref, count) {
    setCommentCounts((current) => ({ ...current, [`${scope}:${ref}`]: count }));
  }

  // ---------- team notes ----------

  // Attachments are uploaded after the note exists (they need its id). A failed upload keeps the note.
  async function attachFiles(note, files) {
    if (!files.length) return note;
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const { ok, data } = await upload(`/api/notes/${note.id}/attachments`, form);
    if (!ok) {
      notify(data?.error ?? "The note was saved, but its attachments could not be uploaded.");
      return note;
    }
    return { ...note, attachments: data.attachments };
  }

  async function createNote(input, files = []) {
    const { ok, data } = await request("/api/notes", "POST", input);
    if (!ok) {
      notify(data?.error ?? "The note could not be saved.");
      return false;
    }
    const note = await attachFiles(data.note, files);
    setNotes((current) => [note, ...current]);
    notify("Note saved.");
    return true;
  }

  async function updateNote(id, patch, files = []) {
    const { ok, data } = await request(`/api/notes/${id}`, "PATCH", patch);
    if (!ok) {
      notify(data?.error ?? "The note could not be updated.");
      return false;
    }
    const note = await attachFiles(data.note, files);
    setNotes((current) => [note, ...current.filter((item) => item.id !== id)]);
    notify("Note updated.");
    return true;
  }

  async function removeAttachment(noteId, attachmentId) {
    const { ok } = await request(`/api/attachments/${attachmentId}`, "DELETE");
    if (!ok) {
      notify("The attachment could not be removed.");
      return;
    }
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, attachments: note.attachments.filter((item) => item.id !== attachmentId) } : note)),
    );
  }

  async function deleteNote(id) {
    const { ok } = await request(`/api/notes/${id}`, "DELETE");
    if (!ok) return;
    setNotes((current) => current.filter((note) => note.id !== id));
    notify("Note removed.");
  }

  // ---------- daily to-dos ----------

  async function patchTodo(todo, update) {
    const previous = todos;
    setTodos((current) =>
      sortTodos(
        current.map((item) =>
          item.id === todo.id ? { ...item, ...update, done: (update.status ?? item.status) === "done" } : item,
        ),
      ),
    );
    const { ok } = await request(`/api/todos/${todo.id}`, "PATCH", update);
    if (!ok) {
      setTodos(previous);
      notify("The to-do could not be updated.");
    }
  }

  async function addTodo(input, date) {
    const { ok, data } = await request("/api/todos", "POST", { ...input, todoDate: date });
    if (!ok) {
      notify(data?.error ?? "The to-do could not be added.");
      return false;
    }
    setTodos((current) => sortTodos([...current, data.todo]));
    return true;
  }

  async function deleteTodo(todo) {
    const { ok } = await request(`/api/todos/${todo.id}`, "DELETE");
    if (!ok) return;
    setTodos((current) => current.filter((item) => item.id !== todo.id));
    notify("To-do removed.");
  }

  function postponeTodo(todo) {
    void patchTodo(todo, { todoDate: shiftDate(todo.todoDate, 1) });
    notify("Moved to tomorrow.");
  }

  async function carryOverTodos(from) {
    const { ok, data } = await request("/api/todos/carry-over", "POST", { from, to: shiftDate(from, 1) });
    if (!ok || !data?.todos) {
      notify(data?.error ?? "The tasks could not be moved.");
      return;
    }
    setTodos(data.todos);
    notify(data.moved ? `${data.moved} unfinished task${data.moved === 1 ? "" : "s"} moved to tomorrow.` : "Nothing left to move.");
  }

  // ---------- today's focus ----------

  async function addFocus(title, date) {
    const { ok, data } = await request("/api/focus", "POST", { title, focusDate: date });
    if (!ok) {
      notify(data?.error ?? "The focus item could not be added.");
      return false;
    }
    setFocusItems((current) => [...current, data.item]);
    return true;
  }

  async function toggleFocus(item) {
    const previous = focusItems;
    setFocusItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, done: !entry.done } : entry)));
    const { ok } = await request(`/api/focus/${item.id}`, "PATCH", { done: !item.done });
    if (!ok) {
      setFocusItems(previous);
      notify("The focus item could not be updated.");
    }
  }

  async function deleteFocus(item) {
    const { ok } = await request(`/api/focus/${item.id}`, "DELETE");
    if (ok) setFocusItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  // ---------- sticky notes ----------

  async function createSticky(content, color, category = null) {
    const { ok, data } = await request("/api/sticky", "POST", { content, color, category });
    if (!ok) {
      notify(data?.error ?? "The sticky note could not be saved.");
      return false;
    }
    setSticky((current) => sortSticky([...current, data.note]));
    notify("Sticky note added.");
    return true;
  }

  async function toggleSticky(note) {
    const previous = sticky;
    setSticky((current) => sortSticky(current.map((item) => (item.id === note.id ? { ...item, pinned: !item.pinned } : item))));
    const { ok } = await request(`/api/sticky/${note.id}`, "PATCH", { pinned: !note.pinned });
    if (!ok) {
      setSticky(previous);
      notify("The sticky note could not be updated.");
    }
  }

  async function deleteSticky(note) {
    const { ok } = await request(`/api/sticky/${note.id}`, "DELETE");
    if (!ok) return;
    setSticky((current) => current.filter((item) => item.id !== note.id));
    notify("Sticky note removed.");
  }

  // ---------- derived numbers ----------

  const completed = tasks.filter((task) => task.status === "done").length;
  const active = tasks.filter((task) => task.status === "progress").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const projectProgress = useMemo(
    () =>
      projects.map((project) => {
        const own = tasks.filter((task) => task.projectId === project.id);
        const done = own.filter((task) => task.status === "done").length;
        return { project, total: own.length, done, percent: own.length ? Math.round((done / own.length) * 100) : 0 };
      }),
    [projects, tasks],
  );

  const nextDeadline = useMemo(() => {
    const floor = now ? startOfDay(now).getTime() : 0;
    return tasks
      .filter((task) => task.status !== "done" && task.dueAt && new Date(task.dueAt).getTime() >= floor)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];
  }, [now, tasks]);

  const deadlineDays = nextDeadline && now ? daysBetween(now, new Date(nextDeadline.dueAt)) : null;
  const deadlineLabel =
    deadlineDays === null ? "" : deadlineDays === 0 ? "Today" : deadlineDays === 1 ? "Tomorrow" : `${deadlineDays} days left`;
  const deadlineProgress = nextDeadline ? (projectProgress.find((entry) => entry.project.id === nextDeadline.projectId)?.percent ?? 0) : 0;

  const weekLoad = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    let todayIndex = -1;
    if (now) {
      const monday = startOfDay(now);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      todayIndex = daysBetween(monday, now);
      for (const task of tasks) {
        if (task.status === "done" || !task.dueAt) continue;
        const offset = daysBetween(monday, new Date(task.dueAt));
        if (offset >= 0 && offset < 7) counts[offset] += 1;
      }
    }
    const max = Math.max(...counts, 1);
    return {
      todayIndex,
      total: counts.reduce((sum, value) => sum + value, 0),
      heights: counts.map((count) => Math.max(8, Math.round((count / max) * 100))),
    };
  }, [now, tasks]);

  const todayTodos = todos.filter((todo) => todo.todoDate === todayDate);
  // The badge counts what is on *my* plate today.
  const openTodosToday = todayTodos.filter((todo) => !todo.done && todo.assigneeId === currentUser.id).length;

  /** Applies the top-bar search box to a task list. */
  function filterTasks(list) {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((task) => [task.issueKey, task.title, task.projectName, task.type].join(" ").toLowerCase().includes(needle));
  }

  const value = {
    // data
    tasks, projects, notes, todos, sticky, focusItems, users, commentCounts, currentUser,
    signOut, addUser, editUser, setCommentCount,
    // ui state
    query, setQuery, toast, notify, now, todayDate, sidebarOpen, setSidebarOpen,
    issueModal, openIssueModal: (parent = null, projectId = null, dueAt = null) => setIssueModal({ parent, projectId, dueAt }), closeIssueModal: () => setIssueModal(null),
    projectModalOpen, setProjectModalOpen, stickyModalOpen, setStickyModalOpen,
    // actions
    updateTask, createIssue, deleteTask, createProject, updateProject, createNote, updateNote, deleteNote, removeAttachment,
    patchTodo, addTodo, deleteTodo, postponeTodo, carryOverTodos,
    addFocus, toggleFocus, deleteFocus, createSticky, toggleSticky, deleteSticky,
    goToProject: (project) => router.push(`/projects/${project.id}`),
    // derived
    completed, active, progress, projectProgress, nextDeadline, deadlineDays, deadlineLabel, deadlineProgress,
    weekLoad, todayTodos, openTodosToday, filterTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
