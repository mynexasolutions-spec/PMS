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
    p.client_name AS clientName,
    p.repo_url AS repoUrl,
    p.staging_url AS stagingUrl,
    p.live_url AS liveUrl,
    p.hosting,
    p.tech_stack AS techStack,
    p.notes,
    p.assignee_id AS assigneeId,
    u.name AS assigneeName,
    p.created_by AS createdBy,
    cb.name AS createdByName,
    p.is_blacklisted AS isBlacklisted,
    p.is_vault_only AS isVaultOnly,
    p.created_at AS createdAt
  FROM projects p
  LEFT JOIN users u ON u.id = p.assignee_id
  LEFT JOIN users cb ON cb.id = p.created_by
`;

export function getProjectMembers(projectId) {
  return db()
    .prepare(`
      SELECT pm.id, pm.project_id AS projectId, pm.user_id AS userId, pm.role, COALESCE(pm.status, 'accepted') AS status, pm.created_at AS createdAt,
             u.name, u.email, u.active, u.last_login_at AS lastLoginAt
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?
      ORDER BY (CASE WHEN pm.status = 'pending' THEN 2 ELSE 1 END), pm.role ASC, u.name COLLATE NOCASE ASC
    `)
    .all(projectId);
}

export function getProjectMemberRole(projectId, userId) {
  if (!projectId || !userId) return null;
  const row = db().prepare("SELECT role, status FROM project_members WHERE project_id = ? AND user_id = ?").get(projectId, userId);
  if (row?.status === "pending") return null;
  return row?.role ?? null;
}

export function isProjectAdmin(projectId, userId) {
  if (!projectId || !userId) return false;
  const role = getProjectMemberRole(projectId, userId);
  if (role === "admin") return true;
  const proj = db().prepare("SELECT created_by FROM projects WHERE id = ?").get(projectId);
  return proj?.created_by === userId;
}

export function isProjectMember(projectId, userId) {
  if (!projectId || !userId) return false;
  const role = getProjectMemberRole(projectId, userId);
  if (role) return true;
  const proj = db().prepare("SELECT created_by FROM projects WHERE id = ?").get(projectId);
  return proj?.created_by === userId;
}

export function addProjectMember(projectId, userId, role = "member", status = "accepted") {
  db().prepare("INSERT OR REPLACE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, ?)").run(projectId, userId, role, status);
  return getProjectMembers(projectId);
}

export function inviteProjectMember(projectId, userId, role = "member") {
  db().prepare("INSERT OR REPLACE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, 'pending')").run(projectId, userId, role);
  return getProjectMembers(projectId);
}

export function acceptProjectInvite(projectId, userId) {
  db().prepare("UPDATE project_members SET status = 'accepted' WHERE project_id = ? AND user_id = ?").run(projectId, userId);
  return getProjectMembers(projectId);
}

export function declineProjectInvite(projectId, userId) {
  db().prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ? AND status = 'pending'").run(projectId, userId);
  return getProjectMembers(projectId);
}

export function updateProjectMemberRole(projectId, userId, role) {
  db().prepare("UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?").run(role, projectId, userId);
  return getProjectMembers(projectId);
}

export function removeProjectMember(projectId, userId) {
  db().prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?").run(projectId, userId);
  return getProjectMembers(projectId);
}

const toProject = (row) => {
  if (!row) return undefined;
  const project = {
    ...row,
    isBlacklisted: row.isBlacklisted === 1,
    isVaultOnly: row.isVaultOnly === 1,
  };
  try {
    project.members = getProjectMembers(row.id);
  } catch {
    project.members = [];
  }
  return project;
};

export function getProjects() {
  return db().prepare(`${projectSelect} ORDER BY p.id`).all().map(toProject);
}

export function getProject(id) {
  return toProject(db().prepare(`${projectSelect} WHERE p.id = ?`).get(id));
}

export function createProject(name, color, description = null, stage = "account_setup", assigneeId = null, createdBy = null, isVaultOnly = 0) {
  const result = db()
    .prepare("INSERT INTO projects (name, color, description, stage, assignee_id, created_by, is_vault_only) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(name, color, description, stage, assigneeId, createdBy, isVaultOnly ? 1 : 0);
  const projectId = Number(result.lastInsertRowid);
  if (createdBy) {
    db().prepare("INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, 'admin')").run(projectId, createdBy);
  }
  if (assigneeId && assigneeId !== createdBy) {
    db().prepare("INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, 'member')").run(projectId, assigneeId);
  }
  return getProject(projectId);
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
    t.estimate_hours AS estimateHours,
    t.logged_hours AS loggedHours,
    t.blocker_reason AS blockerReason,
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
      INSERT INTO tasks (issue_key, title, type, status, priority, project_id, parent_id, assignee_id, created_by, due_at, position, estimate_hours, logged_hours, blocker_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Number(input.estimateHours) || 0,
      Number(input.loggedHours) || 0,
      input.blockerReason ?? null,
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
  estimateHours: "estimate_hours",
  loggedHours: "logged_hours",
  blockerReason: "blocker_reason",
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

const stickySelect = `
  SELECT s.id, s.content, s.color, s.category, s.pinned,
         s.project_id AS projectId, s.user_id AS userId, s.created_at AS createdAt,
         u.name AS authorName, u.email AS authorEmail
  FROM sticky_notes s
  LEFT JOIN users u ON u.id = s.user_id
`;
const toSticky = (row) => (row ? { ...row, pinned: row.pinned === 1 } : undefined);

export function getStickyNotes(projectId = null) {
  if (projectId != null) {
    return db().prepare(`${stickySelect} WHERE s.project_id = ? ORDER BY s.pinned DESC, s.id DESC`).all(projectId).map(toSticky);
  }
  return db().prepare(`${stickySelect} WHERE s.project_id IS NULL ORDER BY s.pinned DESC, s.id DESC`).all().map(toSticky);
}

export function getStickyNote(id) {
  return toSticky(db().prepare(`${stickySelect} WHERE s.id = ?`).get(id));
}

export function createStickyNote(content, color, category = null, userId = null, projectId = null) {
  const result = db()
    .prepare("INSERT INTO sticky_notes (content, color, category, user_id, project_id) VALUES (?, ?, ?, ?, ?)")
    .run(content, color, category, userId, projectId);
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

export function getAllVaultSecrets(userId) {
  if (!userId) {
    return db()
      .prepare(
        `SELECT
           s.id, s.project_id AS projectId, p.name AS projectName, p.color AS projectColor, p.is_vault_only AS isVaultOnly,
           s.kind, s.label,
           s.created_at AS createdAt,
           s.updated_at AS updatedAt,
           cu.name AS createdByName,
           uu.name AS updatedByName,
           (SELECT a.created_at FROM secret_access a WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedAt,
           (SELECT vu.name FROM secret_access a JOIN users vu ON vu.id = a.user_id WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedBy
         FROM project_secrets s
         JOIN projects p ON p.id = s.project_id
         LEFT JOIN users cu ON cu.id = s.created_by
         LEFT JOIN users uu ON uu.id = s.updated_by
         ORDER BY s.updated_at DESC, s.id DESC`,
      )
      .all()
      .map((row) => ({ ...row, isVaultOnly: row.isVaultOnly === 1 }));
  }

  return db()
    .prepare(
      `SELECT
         s.id, s.project_id AS projectId, p.name AS projectName, p.color AS projectColor, p.is_vault_only AS isVaultOnly,
         s.kind, s.label,
         s.created_at AS createdAt,
         s.updated_at AS updatedAt,
         cu.name AS createdByName,
         uu.name AS updatedByName,
         (SELECT a.created_at FROM secret_access a WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedAt,
         (SELECT vu.name FROM secret_access a JOIN users vu ON vu.id = a.user_id WHERE a.secret_id = s.id AND a.action = 'view' ORDER BY a.id DESC LIMIT 1) AS lastViewedBy
       FROM project_secrets s
       JOIN projects p ON p.id = s.project_id
       LEFT JOIN users cu ON cu.id = s.created_by
       LEFT JOIN users uu ON uu.id = s.updated_by
       WHERE p.id IN (
         SELECT project_id FROM project_members WHERE user_id = ?
         UNION
         SELECT id FROM projects WHERE created_by = ?
       )
       ORDER BY s.updated_at DESC, s.id DESC`,
    )
    .all(userId, userId)
    .map((row) => ({ ...row, isVaultOnly: row.isVaultOnly === 1 }));
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
    .prepare("SELECT id, user_id AS userId, title, message, link, type, metadata, read, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 25")
    .all(userId)
    .map((n) => ({
      ...n,
      read: n.read === 1,
      metadata: n.metadata ? (() => { try { return JSON.parse(n.metadata); } catch { return null; } })() : null,
    }));
}

export function createNotification({ userId, title, message, link = null, type = "general", metadata = null }) {
  const result = db()
    .prepare("INSERT INTO notifications (user_id, title, message, link, type, metadata) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, title, message, link, type, metadata ? JSON.stringify(metadata) : null);
  const row = db()
    .prepare("SELECT id, user_id AS userId, title, message, link, type, metadata, read, created_at AS createdAt FROM notifications WHERE id = ?")
    .get(Number(result.lastInsertRowid));
  return row ? { ...row, read: row.read === 1, metadata } : null;
}

export function markNotificationRead(id, userId) {
  return db().prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function markAllNotificationsRead(userId) {
  return db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId).changes > 0;
}

// ---------- project action plans & monthly targets ----------

const planSelect = `
  SELECT
    id,
    project_id AS projectId,
    month_year AS monthYear,
    title,
    prep_deadline AS prepDeadline,
    exec_start AS execStart,
    kpis,
    sections,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM project_action_plans
`;

function toActionPlan(row) {
  if (!row) return null;
  let kpis = [];
  let sections = [];
  try {
    kpis = typeof row.kpis === "string" ? JSON.parse(row.kpis || "[]") : (row.kpis || []);
  } catch {}
  try {
    sections = typeof row.sections === "string" ? JSON.parse(row.sections || "[]") : (row.sections || []);
  } catch {}
  return {
    ...row,
    kpis,
    sections,
  };
}

export function getProjectActionPlans(projectId) {
  return db()
    .prepare(`${planSelect} WHERE project_id = ? ORDER BY month_year DESC, id DESC`)
    .all(projectId)
    .map(toActionPlan);
}

export function getProjectActionPlan(id) {
  return toActionPlan(db().prepare(`${planSelect} WHERE id = ?`).get(id));
}

export function getProjectActionPlanByMonth(projectId, monthYear) {
  return toActionPlan(db().prepare(`${planSelect} WHERE project_id = ? AND month_year = ?`).get(projectId, monthYear));
}

export function createProjectActionPlan({
  projectId,
  monthYear,
  title,
  prepDeadline = null,
  execStart = null,
  kpis = [],
  sections = [],
}) {
  const result = db()
    .prepare(`
      INSERT INTO project_action_plans (project_id, month_year, title, prep_deadline, exec_start, kpis, sections)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      projectId,
      monthYear,
      title,
      prepDeadline,
      execStart,
      JSON.stringify(kpis),
      JSON.stringify(sections)
    );
  return getProjectActionPlan(Number(result.lastInsertRowid));
}

export function updateProjectActionPlan(id, patch) {
  const fields = [];
  const values = [];

  if (patch.title !== undefined) {
    fields.push("title = ?");
    values.push(patch.title);
  }
  if (patch.prepDeadline !== undefined) {
    fields.push("prep_deadline = ?");
    values.push(patch.prepDeadline);
  }
  if (patch.execStart !== undefined) {
    fields.push("exec_start = ?");
    values.push(patch.execStart);
  }
  if (patch.kpis !== undefined) {
    fields.push("kpis = ?");
    values.push(typeof patch.kpis === "string" ? patch.kpis : JSON.stringify(patch.kpis));
  }
  if (patch.sections !== undefined) {
    fields.push("sections = ?");
    values.push(typeof patch.sections === "string" ? patch.sections : JSON.stringify(patch.sections));
  }

  if (!fields.length) return getProjectActionPlan(id);

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  db()
    .prepare(`UPDATE project_action_plans SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  return getProjectActionPlan(id);
}

export function deleteProjectActionPlan(id) {
  return db().prepare("DELETE FROM project_action_plans WHERE id = ?").run(id).changes > 0;
}

export function getSnapshot(user) {
  const allProjects = getProjects();
  const allNotes = getNotes();
  const allSticky = getStickyNotes();
  const allTodos = getTodos();
  const allTasks = getTasks();

  const userId = user?.id;

  // Projects user is part of (as accepted admin or member) or created
  const projects = allProjects
    .filter((p) => {
      if (!userId) return false;
      const myMember = (p.members || []).find((m) => m.userId === userId);
      const isAcceptedMember = myMember && myMember.status !== "pending";
      const isCreator = p.createdBy === userId;
      return isAcceptedMember || isCreator;
    })
    .map((p) => {
      const myMember = (p.members || []).find((m) => m.userId === userId);
      const role = myMember?.role || (p.createdBy === userId ? "admin" : "member");
      return {
        ...p,
        currentUserRole: role,
        isProjectAdmin: role === "admin",
      };
    });

  const myProjectIds = new Set(projects.map((p) => p.id));

  // Sidebar Notes and Sticky Notes are strictly personal
  const notes = allNotes.filter((n) => n.userId === userId);
  const sticky = allSticky.filter((s) => s.userId === userId);

  // Todos: strictly personal daily to-dos for the logged-in user
  const todos = allTodos.filter((t) => {
    return t.assigneeId === userId || (!t.assigneeId && t.createdBy === userId);
  });

  // Tasks belonging to user's projects
  const tasks = allTasks.filter((t) => myProjectIds.has(t.projectId));

  return {
    today: today(),
    user,
    users: listUsers(),
    projects,
    tasks,
    notes,
    todos,
    sticky,
    focus: getFocusItems(),
    commentCounts: getCommentCounts(),
    notifications: userId ? getNotifications(userId) : [],
    vaultSecrets: userId ? getAllVaultSecrets(userId) : [],
    actionRequests: userId ? getActionRequests(userId) : [],
  };
}

// ---------- project team chat messages ----------

export function getProjectMessages(projectId, forUserId = null, limit = 100) {
  const rows = db()
    .prepare(`
      SELECT m.id, m.project_id AS projectId, m.user_id AS userId, m.message, m.deleted_for AS deletedFor, m.created_at AS createdAt,
             u.name AS userName, u.email AS userEmail,
             COALESCE(pm.role, (CASE WHEN p.created_by = m.user_id THEN 'admin' ELSE 'member' END)) AS userRole
      FROM project_messages m
      JOIN users u ON u.id = m.user_id
      JOIN projects p ON p.id = m.project_id
      LEFT JOIN project_members pm ON pm.project_id = m.project_id AND pm.user_id = m.user_id
      WHERE m.project_id = ?
      ORDER BY m.id ASC
      LIMIT ?
    `)
    .all(projectId, limit);

  if (!forUserId) return rows;
  return rows.filter((row) => {
    try {
      const list = JSON.parse(row.deletedFor || "[]");
      return !list.includes(forUserId);
    } catch {
      return true;
    }
  });
}

export function createProjectMessage(projectId, userId, message) {
  const result = db()
    .prepare("INSERT INTO project_messages (project_id, user_id, message, deleted_for) VALUES (?, ?, ?, '[]')")
    .run(projectId, userId, message);
  const id = Number(result.lastInsertRowid);
  const messages = getProjectMessages(projectId, null, 100);
  return messages.find((m) => m.id === id) || null;
}

export function hideProjectMessageForUser(id, userId) {
  const row = db().prepare("SELECT deleted_for FROM project_messages WHERE id = ?").get(id);
  if (!row) return false;
  let list = [];
  try {
    list = JSON.parse(row.deleted_for || "[]");
  } catch {}
  if (!list.includes(userId)) {
    list.push(userId);
    return db().prepare("UPDATE project_messages SET deleted_for = ? WHERE id = ?").run(JSON.stringify(list), id).changes > 0;
  }
  return true;
}

export function deleteProjectMessage(id, projectId) {
  if (projectId !== undefined && projectId !== null) {
    return db().prepare("DELETE FROM project_messages WHERE id = ? AND project_id = ?").run(id, projectId).changes > 0;
  }
  return db().prepare("DELETE FROM project_messages WHERE id = ?").run(id).changes > 0;
}

// ---------- workspace action requests (Idea 2) ----------

export function getActionRequests(userId = null) {
  let query = `
    SELECT a.id, a.title, a.description, a.category, a.project_id AS projectId,
           a.assignee_id AS assigneeId, a.created_by AS createdBy,
           a.status, a.due_date AS dueDate, a.completed_at AS completedAt, a.created_at AS createdAt,
           u1.name AS assigneeName, u1.email AS assigneeEmail,
           u2.name AS creatorName, u2.email AS creatorEmail,
           p.name AS projectName, p.color AS projectColor
    FROM action_requests a
    JOIN users u1 ON u1.id = a.assignee_id
    JOIN users u2 ON u2.id = a.created_by
    LEFT JOIN projects p ON p.id = a.project_id
  `;

  if (userId) {
    query += ` WHERE a.assignee_id = ? OR a.created_by = ?`;
    query += ` ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END, a.id DESC`;
    return db().prepare(query).all(userId, userId);
  }

  query += ` ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END, a.id DESC`;
  return db().prepare(query).all();
}

export function getActionRequest(id) {
  return db()
    .prepare(`
      SELECT a.id, a.title, a.description, a.category, a.project_id AS projectId,
             a.assignee_id AS assigneeId, a.created_by AS createdBy,
             a.status, a.due_date AS dueDate, a.completed_at AS completedAt, a.created_at AS createdAt,
             u1.name AS assigneeName, u1.email AS assigneeEmail,
             u2.name AS creatorName, u2.email AS creatorEmail,
             p.name AS projectName, p.color AS projectColor
      FROM action_requests a
      JOIN users u1 ON u1.id = a.assignee_id
      JOIN users u2 ON u2.id = a.created_by
      LEFT JOIN projects p ON p.id = a.project_id
      WHERE a.id = ?
    `)
    .get(id);
}

export function createActionRequest({ title, description = "", category = "general", projectId = null, assigneeId, createdBy, dueDate = null }) {
  const result = db()
    .prepare(`
      INSERT INTO action_requests (title, description, category, project_id, assignee_id, created_by, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `)
    .run(title, description, category, projectId, assigneeId, createdBy, dueDate);

  const id = Number(result.lastInsertRowid);

  // Notify assignee
  try {
    const creator = db().prepare("SELECT name FROM users WHERE id = ?").get(createdBy);
    createNotification({
      userId: assigneeId,
      title: "New Action Request",
      message: `${creator?.name || "A teammate"} assigned you: "${title}"`,
      link: "/tasks",
      type: "action_request",
      metadata: { actionId: id, category },
    });
  } catch {}

  return getActionRequest(id);
}

export function updateActionRequest(id, patch, userId) {
  const current = getActionRequest(id);
  if (!current) return null;

  const fields = [];
  const values = [];

  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);

    if (patch.status === "completed") {
      fields.push("completed_at = CURRENT_TIMESTAMP");
      // Notify creator that action was completed
      if (current.createdBy !== userId) {
        try {
          const completer = db().prepare("SELECT name FROM users WHERE id = ?").get(userId);
          createNotification({
            userId: current.createdBy,
            title: "Action Request Completed",
            message: `${completer?.name || "Assignee"} completed: "${current.title}"`,
            link: "/tasks",
            type: "action_completed",
            metadata: { actionId: id },
          });
        } catch {}
      }
    } else {
      fields.push("completed_at = NULL");
    }
  }

  if (patch.title !== undefined) {
    fields.push("title = ?");
    values.push(patch.title);
  }
  if (patch.description !== undefined) {
    fields.push("description = ?");
    values.push(patch.description);
  }
  if (patch.category !== undefined) {
    fields.push("category = ?");
    values.push(patch.category);
  }
  if (patch.projectId !== undefined) {
    fields.push("project_id = ?");
    values.push(patch.projectId);
  }
  if (patch.assigneeId !== undefined) {
    fields.push("assignee_id = ?");
    values.push(patch.assigneeId);
  }
  if (patch.dueDate !== undefined) {
    fields.push("due_date = ?");
    values.push(patch.dueDate);
  }

  if (fields.length) {
    values.push(id);
    db().prepare(`UPDATE action_requests SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getActionRequest(id);
}

export function deleteActionRequest(id) {
  return db().prepare("DELETE FROM action_requests WHERE id = ?").run(id).changes > 0;
}

// ---------- project calendar events ----------

export function getProjectEvents(projectId) {
  return db()
    .prepare(`
      SELECT e.id, e.project_id AS projectId, e.title, e.type,
             e.event_date AS eventDate, e.event_time AS eventTime,
             e.created_by AS createdBy, e.created_at AS createdAt,
             u.name AS creatorName
      FROM project_events e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.project_id = ?
      ORDER BY e.event_date ASC, e.event_time ASC, e.id ASC
    `)
    .all(projectId);
}

export function createProjectEvent({ projectId, title, type = "meeting", eventDate, eventTime = null, createdBy = null }) {
  const result = db()
    .prepare("INSERT INTO project_events (project_id, title, type, event_date, event_time, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(projectId, title, type, eventDate, eventTime, createdBy);
  const id = Number(result.lastInsertRowid);
  const list = getProjectEvents(projectId);
  return list.find((e) => e.id === id) || null;
}

export function deleteProjectEvent(id, projectId) {
  if (projectId != null) {
    return db().prepare("DELETE FROM project_events WHERE id = ? AND project_id = ?").run(id, projectId).changes > 0;
  }
  return db().prepare("DELETE FROM project_events WHERE id = ?").run(id).changes > 0;
}
