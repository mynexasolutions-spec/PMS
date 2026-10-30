// Every query the app runs lives here. Swap this file (and ./index.js) to move to another database;
// the API routes and pages only ever call these functions.
import { istDate } from "../dates.js";
import { getDb } from "./index.js";
import { listUsers } from "./users.js";

const db = () => getDb();

export const today = () => istDate();

// ---------- projects ----------

const projectSelect = `
  SELECT
    p.id, p.name, p.color, p.description, p.stage,
    client_name AS clientName,
    repo_url AS repoUrl,
    staging_url AS stagingUrl,
    live_url AS liveUrl,
    hosting,
    tech_stack AS techStack,
    notes,
    p.assignee_id AS assigneeId,
    u.name AS assigneeName,
    p.is_blacklisted AS isBlacklisted,
    p.created_at AS createdAt
  FROM projects p
  LEFT JOIN users u ON u.id = p.assignee_id
`;

const toProject = (row) => (row ? { ...row, isBlacklisted: row.isBlacklisted === 1 } : undefined);

export function getProjects() {
  return db().prepare(`${projectSelect} ORDER BY p.id`).all().map(toProject);
}

export function getProject(id) {
  return toProject(db().prepare(`${projectSelect} WHERE p.id = ?`).get(id));
}

export function createProject(name, color, description = null, stage = "account_setup", assigneeId = null) {
  const result = db()
    .prepare("INSERT INTO projects (name, color, description, stage, assignee_id) VALUES (?, ?, ?, ?, ?)")
    .run(name, color, description, stage, assigneeId);
  return getProject(Number(result.lastInsertRowid));
}

const projectColumns = {
  name: "name",
  color: "color",
  description: "description",
  stage: "stage",
  clientName: "client_name",
  repoUrl: "repo_url",
  stagingUrl: "staging_url",
  liveUrl: "live_url",
  hosting: "hosting",
  techStack: "tech_stack",
  notes: "notes",
  assigneeId: "assignee_id",
  isBlacklisted: "is_blacklisted",
};

export function deleteProject(id) {
  return db().prepare("DELETE FROM projects WHERE id = ?").run(id).changes > 0;
}

/** Applies the supplied fields (name, colour, stage and the project details) and returns the project, or null if none were recognised. */
export function updateProject(id, patch) {
  const keys = Object.keys(patch).filter((key) => key in projectColumns && patch[key] !== undefined);
  if (!keys.length) return null;
  db()
    .prepare(`UPDATE projects SET ${keys.map((key) => `${projectColumns[key]} = ?`).join(", ")} WHERE id = ?`)
    .run(...keys.map((key) => patch[key]), id);
  return getProject(id);
}

// ---------- issues (tasks) ----------

const taskSelect = `
  SELECT
    t.id,
    t.issue_key AS issueKey,
    t.title,
    t.description,
    t.type,
    t.status,
    t.priority,
    t.project_id AS projectId,
    p.name AS projectName,
    p.color AS projectColor,
    t.parent_id AS parentId,
    parent.issue_key AS parentKey,
    parent.title AS parentTitle,
    t.assignee_id AS assigneeId,
    t.created_by AS createdBy,
    t.due_at AS dueAt,
    t.position,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  LEFT JOIN tasks parent ON parent.id = t.parent_id
`;

export function getTasks() {
  return db().prepare(`${taskSelect} ORDER BY t.position, t.id`).all();
}

export function getTask(id) {
  return db().prepare(`${taskSelect} WHERE t.id = ?`).get(id);
}

export function createTask(input) {
  const nextNumber = db()
    .prepare("SELECT COALESCE(MAX(CAST(SUBSTR(issue_key, 4) AS INTEGER)), 100) + 1 AS value FROM tasks")
    .get().value;
  const position = db().prepare("SELECT COALESCE(MAX(position), 0) + 1 AS value FROM tasks").get().value;

  const result = db()
    .prepare(`
      INSERT INTO tasks (issue_key, title, type, status, priority, project_id, parent_id, assignee_id, created_by, due_at, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      `NX-${nextNumber}`,
      input.title,
      input.type,
      input.status,
      input.priority,
      input.projectId,
      input.parentId ?? null,
      input.assigneeId ?? null,
      input.createdBy ?? null,
      input.dueAt || null,
      position,
    );
  return getTask(Number(result.lastInsertRowid));
}

const taskColumns = {
  title: "title",
  type: "type",
  status: "status",
  priority: "priority",
  projectId: "project_id",
  parentId: "parent_id",
  assigneeId: "assignee_id",
  dueAt: "due_at",
  position: "position",
};

/** Applies the supplied fields; returns the updated issue, or null if no field was recognised. */
export function updateTask(id, patch) {
  const keys = Object.keys(patch).filter((key) => key in taskColumns);
  if (!keys.length) return null;
  const assignments = [...keys.map((key) => `${taskColumns[key]} = ?`), "updated_at = CURRENT_TIMESTAMP"];
  db()
    .prepare(`UPDATE tasks SET ${assignments.join(", ")} WHERE id = ?`)
    .run(...keys.map((key) => patch[key] ?? null), id);
  return getTask(id);
}

export function deleteTask(id) {
  const removed = db().prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
  if (removed) db().prepare("DELETE FROM comments WHERE scope = 'task' AND ref = ?").run(String(id));
  return removed;
}

// ---------- notes ----------

const noteSelect = `
  SELECT
    n.id,
    n.title,
    n.content,
    n.tag,
    n.project_id AS projectId,
    n.user_id AS userId,
    p.name AS projectName,
    p.color AS projectColor,
    n.created_at AS createdAt,
    n.updated_at AS updatedAt
  FROM notes n
  LEFT JOIN projects p ON p.id = n.project_id
`;

const attachmentSelect = "SELECT id, note_id AS noteId, filename, mime, size FROM note_attachments";

export function getNotes() {
  const rows = db().prepare(`${noteSelect} ORDER BY n.updated_at DESC, n.id DESC`).all();
  const byNote = new Map();
  for (const attachment of db().prepare(`${attachmentSelect} ORDER BY id`).all()) {
    byNote.set(attachment.noteId, [...(byNote.get(attachment.noteId) ?? []), attachment]);
  }
  return rows.map((note) => ({ ...note, attachments: byNote.get(note.id) ?? [] }));
}

export function getNote(id) {
  const note = db().prepare(`${noteSelect} WHERE n.id = ?`).get(id);
  return note && { ...note, attachments: db().prepare(`${attachmentSelect} WHERE note_id = ? ORDER BY id`).all(id) };
}

export function createNote({ title, content, tag = null, projectId = null, userId = null }) {
  const result = db()
    .prepare("INSERT INTO notes (title, content, tag, project_id, user_id) VALUES (?, ?, ?, ?, ?)")
    .run(title, content, tag, projectId, userId);
  return getNote(Number(result.lastInsertRowid));
}

export function updateNote(id, patch) {
  db()
    .prepare("UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(patch.title ?? null, patch.content ?? null, id);
  // The tag and project may legitimately be cleared back to null, so they can't go through COALESCE.
  if (patch.tag !== undefined) db().prepare("UPDATE notes SET tag = ? WHERE id = ?").run(patch.tag, id);
  if (patch.projectId !== undefined) db().prepare("UPDATE notes SET project_id = ? WHERE id = ?").run(patch.projectId, id);
  return getNote(id);
}

/** Stored file names of a note's attachments, so the caller can delete the files along with the note. */
export function getNoteFiles(id) {
  return db().prepare("SELECT stored_name AS storedName FROM note_attachments WHERE note_id = ?").all(id).map((row) => row.storedName);
}

export function deleteNote(id) {
  return db().prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}

export function addAttachment({ noteId, filename, storedName, mime, size }) {
  db()
    .prepare("INSERT INTO note_attachments (note_id, filename, stored_name, mime, size) VALUES (?, ?, ?, ?, ?)")
    .run(noteId, filename, storedName, mime, size);
  db().prepare("UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(noteId);
}

export function getAttachment(id) {
  return db()
    .prepare("SELECT id, note_id AS noteId, filename, stored_name AS storedName, mime, size FROM note_attachments WHERE id = ?")
    .get(id);
}

/** Removes the row and returns it (so the caller can delete the file), or undefined if it didn't exist. */
export function deleteAttachment(id) {
  const attachment = getAttachment(id);
  if (attachment) db().prepare("DELETE FROM note_attachments WHERE id = ?").run(id);
  return attachment;
}

// ---------- daily to-dos ----------

const todoSelect = `
  SELECT
    t.id,
    t.title,
    t.priority,
    t.start_time AS startTime,
    t.end_time AS endTime,
    t.todo_date AS todoDate,
    t.status,
    t.project_id AS projectId,
    p.name AS projectName,
    p.color AS projectColor,
    t.assignee_id AS assigneeId,
    t.created_by AS createdBy
  FROM todos t
  LEFT JOIN projects p ON p.id = t.project_id
`;

const toTodo = (row) => (row ? { ...row, done: row.status === "done" } : undefined);

export function getTodos() {
  return db()
    .prepare(`${todoSelect} ORDER BY t.todo_date, COALESCE(t.start_time, '99:99'), t.id`)
    .all()
    .map(toTodo);
}

export function getTodo(id) {
  return toTodo(db().prepare(`${todoSelect} WHERE t.id = ?`).get(id));
}

export function createTodo(input) {
  const result = db()
    .prepare(
      "INSERT INTO todos (title, priority, start_time, end_time, todo_date, status, project_id, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      input.title,
      input.priority,
      input.startTime,
      input.endTime,
      input.todoDate,
      input.status,
      input.projectId,
      input.assigneeId ?? null,
      input.createdBy ?? null,
    );
  return getTodo(Number(result.lastInsertRowid));
}

export function updateTodo(id, patch) {
  db()
    .prepare(`
      UPDATE todos
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          priority = COALESCE(?, priority),
          todo_date = COALESCE(?, todo_date)
      WHERE id = ?
    `)
    .run(patch.status ?? null, patch.title ?? null, patch.priority ?? null, patch.todoDate ?? null, id);
  // projectId may legitimately be set back to null, so it can't go through COALESCE.
  if (patch.projectId !== undefined) {
    db().prepare("UPDATE todos SET project_id = ? WHERE id = ?").run(patch.projectId, id);
  }
  // Likewise a to-do can be left unassigned.
  if (patch.assigneeId !== undefined) {
    db().prepare("UPDATE todos SET assignee_id = ? WHERE id = ?").run(patch.assigneeId, id);
  }
  return getTodo(id);
}

export function deleteTodo(id) {
  const removed = db().prepare("DELETE FROM todos WHERE id = ?").run(id).changes > 0;
  if (removed) db().prepare("DELETE FROM comments WHERE scope = 'todo' AND ref = ?").run(String(id));
  return removed;
}

/** Moves every unfinished to-do from one day to another (the end-of-day carry-over). */
export function carryOverTodos(from, to, userId = null) {
  if (userId != null) {
    return db().prepare("UPDATE todos SET todo_date = ? WHERE todo_date = ? AND status != 'done' AND assignee_id = ?").run(to, from, userId).changes;
  }
  return db().prepare("UPDATE todos SET todo_date = ? WHERE todo_date = ? AND status != 'done'").run(to, from).changes;
}

// ---------- sticky notes ----------

const stickySelect = "SELECT id, content, color, category, pinned, user_id AS userId, created_at AS createdAt FROM sticky_notes";
const toSticky = (row) => (row ? { ...row, pinned: row.pinned === 1 } : undefined);

export function getStickyNotes() {
  return db().prepare(`${stickySelect} ORDER BY pinned DESC, id DESC`).all().map(toSticky);
}

export function getStickyNote(id) {
  return toSticky(db().prepare(`${stickySelect} WHERE id = ?`).get(id));
}

export function createStickyNote(content, color, category = null, userId = null) {
  const result = db()
    .prepare("INSERT INTO sticky_notes (content, color, category, user_id) VALUES (?, ?, ?, ?)")
    .run(content, color, category, userId);
  return getStickyNote(Number(result.lastInsertRowid));
}

export function updateStickyNote(id, patch) {
  db()
    .prepare(
      "UPDATE sticky_notes SET content = COALESCE(?, content), color = COALESCE(?, color), pinned = COALESCE(?, pinned) WHERE id = ?",
    )
    .run(patch.content ?? null, patch.color ?? null, patch.pinned === undefined ? null : patch.pinned ? 1 : 0, id);
  // The category may legitimately be cleared back to null, so it can't go through COALESCE.
  if (patch.category !== undefined) {
    db().prepare("UPDATE sticky_notes SET category = ? WHERE id = ?").run(patch.category, id);
  }
  return getStickyNote(id);
}

export function deleteStickyNote(id) {
  return db().prepare("DELETE FROM sticky_notes WHERE id = ?").run(id).changes > 0;
}

// ---------- today's focus ----------

const focusSelect = "SELECT id, title, done, focus_date AS focusDate FROM focus_items";
const toFocus = (row) => (row ? { ...row, done: row.done === 1 } : undefined);

export function getFocusItems() {
  return db().prepare(`${focusSelect} ORDER BY focus_date, id`).all().map(toFocus);
}

export function getFocusItem(id) {
  return toFocus(db().prepare(`${focusSelect} WHERE id = ?`).get(id));
}

export function createFocusItem(title, focusDate) {
  const result = db().prepare("INSERT INTO focus_items (title, focus_date) VALUES (?, ?)").run(title, focusDate);
  return getFocusItem(Number(result.lastInsertRowid));
}

export function updateFocusItem(id, patch) {
  db()
    .prepare("UPDATE focus_items SET done = COALESCE(?, done), title = COALESCE(?, title) WHERE id = ?")
    .run(patch.done === undefined ? null : patch.done ? 1 : 0, patch.title ?? null, id);
  return getFocusItem(id);
}

export function deleteFocusItem(id) {
  return db().prepare("DELETE FROM focus_items WHERE id = ?").run(id).changes > 0;
}

// ---------- comments (timestamped, on a task, a to-do, or a whole day) ----------

const commentSelect = `
  SELECT
    c.id, c.scope, c.ref,
    c.author_id AS authorId,
    u.name AS authorName,
    u.role AS authorRole,
    c.body,
    c.created_at AS createdAt
  FROM comments c
  LEFT JOIN users u ON u.id = c.author_id
`;

export function getComments(scope, ref) {
  return db().prepare(`${commentSelect} WHERE c.scope = ? AND c.ref = ? ORDER BY c.created_at, c.id`).all(scope, String(ref));
}

export function getComment(id) {
  return db().prepare(`${commentSelect} WHERE c.id = ?`).get(id);
}

export function createComment({ scope, ref, authorId, body }) {
  const result = db().prepare("INSERT INTO comments (scope, ref, author_id, body) VALUES (?, ?, ?, ?)").run(scope, String(ref), authorId, body);
  return getComment(Number(result.lastInsertRowid));
}

export function deleteComment(id) {
  return db().prepare("DELETE FROM comments WHERE id = ?").run(id).changes > 0;
}

/** { "todo:12": 3, "day:2026-10-29": 5, ... } so the UI can show comment counts without loading every thread. */
export function getCommentCounts() {
  const counts = {};
  for (const row of db().prepare("SELECT scope, ref, COUNT(*) AS n FROM comments GROUP BY scope, ref").all()) counts[`${row.scope}:${row.ref}`] = row.n;
  return counts;
}

// ---------- project secrets (the payload is already encrypted by the caller) ----------

/** Metadata only (never the payload), plus who last opened each secret. */
export function listSecrets(projectId) {
  return db()
    .prepare(
      `SELECT
         s.id, s.kind, s.label,
         s.created_at AS createdAt,
         s.updated_at AS updatedAt,
         cu.name AS createdByName,
         uu.name AS updatedByName,
         (SELECT a.created_at FROM secret_access a WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedAt,
         (SELECT vu.name FROM secret_access a JOIN users vu ON vu.id = a.user_id WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedBy
       FROM project_secrets s
       LEFT JOIN users cu ON cu.id = s.created_by
       LEFT JOIN users uu ON uu.id = s.updated_by
       WHERE s.project_id = ?
       ORDER BY s.kind, s.label COLLATE NOCASE`,
    )
    .all(projectId);
}

export function getSecretRow(id) {
  return db().prepare("SELECT id, project_id AS projectId, kind, label, payload FROM project_secrets WHERE id = ?").get(id);
}

export function createSecret({ projectId, kind, label, payload, userId }) {
  const result = db()
    .prepare("INSERT INTO project_secrets (project_id, kind, label, payload, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(projectId, kind, label, payload, userId, userId);
  const id = Number(result.lastInsertRowid);
  logSecretAccess(id, userId, "create");
  return id;
}

export function updateSecret(id, { label, payload, userId }) {
  db()
    .prepare(
      "UPDATE project_secrets SET label = COALESCE(?, label), payload = COALESCE(?, payload), updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .run(label ?? null, payload ?? null, userId, id);
  logSecretAccess(id, userId, "update");
}

export const deleteSecret = (id) => db().prepare("DELETE FROM project_secrets WHERE id = ?").run(id).changes > 0;

export const logSecretAccess = (secretId, userId, action) =>
  db().prepare("INSERT INTO secret_access (secret_id, user_id, action) VALUES (?, ?, ?)").run(secretId, userId, action);

// ---------- everything the app shell needs on first load ----------


// ---------- notifications ----------

export function purgeOldNotifications() {
  // Auto-clean read notifications older than 7 days (unread notifications are kept until seen)
  try {
    db().prepare("DELETE FROM notifications WHERE read = 1 AND created_at < datetime('now', '-7 days')").run();
  } catch {}
}

export function getNotifications(userId) {
  purgeOldNotifications();
  return db()
    .prepare("SELECT id, user_id AS userId, title, message, link, read, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20")
    .all(userId)
    .map((n) => ({ ...n, read: n.read === 1 }));
}

export function createNotification({ userId, title, message, link = null }) {
  const result = db()
    .prepare("INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)")
    .run(userId, title, message, link);
  const row = db()
    .prepare("SELECT id, user_id AS userId, title, message, link, read, created_at AS createdAt FROM notifications WHERE id = ?")
    .get(Number(result.lastInsertRowid));
  return row ? { ...row, read: row.read === 1 } : null;
}

export function markNotificationRead(id, userId) {
  return db().prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function markAllNotificationsRead(userId) {
  return db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId).changes > 0;
}

export function getSnapshot(user) {
  const allProjects = getProjects();
  const allNotes = getNotes();
  const allSticky = getStickyNotes();

  let projects = allProjects;
  let notes = allNotes;
  let sticky = allSticky;

  if (user?.role === "member") {
    projects = allProjects.filter((p) => p.assigneeId === user.id);
    const myProjectIds = new Set(projects.map((p) => p.id));
    notes = allNotes.filter(
      (n) => n.userId === user.id || (n.projectId && myProjectIds.has(n.projectId)) || (n.userId == null && n.projectId == null),
    );
    sticky = allSticky.filter((n) => n.userId === user.id || n.userId == null);
  }

  return {
    today: today(),
    user,
    users: listUsers(),
    projects,
    tasks: getTasks(),
    notes,
    todos: getTodos(),
    sticky,
    focus: getFocusItems(),
    commentCounts: getCommentCounts(),
    notifications: user?.id ? getNotifications(user.id) : [],
  };
}
