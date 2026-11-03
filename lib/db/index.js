import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "./schema.js";
import { seedDatabase } from "./seed.js";

// On the VPS set DATABASE_PATH to a folder outside the project (e.g. /var/data/nexa/pms.db)
// so a deploy never overwrites it. Set NEXA_SEED_DEMO=false to skip the demo data.
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "nexa.db");

// Brings databases created by earlier versions up to the current schema.
function migrate(db) {
  // Early versions limited sticky_notes.color to four names via a CHECK; custom colours need it gone,
  // and SQLite can only drop a CHECK by rebuilding the table.
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'sticky_notes'").get()?.sql ?? "";
  if (sql.includes("CHECK(color IN")) {
    db.transaction(() => {
      db.exec("ALTER TABLE sticky_notes RENAME TO sticky_notes_old");
      db.exec(SCHEMA); // recreates sticky_notes without the CHECK (other tables already exist)
      db.exec("INSERT INTO sticky_notes (id, content, color, pinned, created_at) SELECT id, content, color, pinned, created_at FROM sticky_notes_old");
      db.exec("DROP TABLE sticky_notes_old");
    })();
  }

  if (!db.prepare("PRAGMA table_info(sticky_notes)").all().some((column) => column.name === "category")) {
    db.exec("ALTER TABLE sticky_notes ADD COLUMN category TEXT");
  }
  if (!db.prepare("PRAGMA table_info(sticky_notes)").all().some((column) => column.name === "project_id")) {
    db.exec("ALTER TABLE sticky_notes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE");
  }

  const projectColumns = db.prepare("PRAGMA table_info(projects)").all().map((column) => column.name);
  if (!projectColumns.includes("description")) db.exec("ALTER TABLE projects ADD COLUMN description TEXT");
  if (!projectColumns.includes("stage")) db.exec("ALTER TABLE projects ADD COLUMN stage TEXT NOT NULL DEFAULT 'account_setup'");
  if (!projectColumns.includes("assignee_id")) db.exec("ALTER TABLE projects ADD COLUMN assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
  if (!projectColumns.includes("created_by")) db.exec("ALTER TABLE projects ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL");
  if (!projectColumns.includes("is_blacklisted")) db.exec("ALTER TABLE projects ADD COLUMN is_blacklisted INTEGER NOT NULL DEFAULT 0");
  if (!projectColumns.includes("is_vault_only")) db.exec("ALTER TABLE projects ADD COLUMN is_vault_only INTEGER NOT NULL DEFAULT 0");
  for (const column of ["client_name", "repo_url", "staging_url", "live_url", "hosting", "tech_stack", "notes"]) {
    if (!projectColumns.includes(column)) db.exec(`ALTER TABLE projects ADD COLUMN ${column} TEXT`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
  `);

  // Ensure status column exists in project_members
  const pmCols = db.prepare("PRAGMA table_info(project_members)").all().map((c) => c.name);
  if (!pmCols.includes("status")) {
    db.exec("ALTER TABLE project_members ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'");
  }

  try {
    const existingProjects = db.prepare("SELECT id, assignee_id, created_by, is_vault_only FROM projects").all();
    for (const p of existingProjects) {
      if (p.is_vault_only === 1) {
        if (!p.created_by) {
          const firstUser = db.prepare("SELECT id FROM users ORDER BY id ASC LIMIT 1").get();
          if (firstUser) {
            db.prepare("UPDATE projects SET created_by = ? WHERE id = ?").run(firstUser.id, p.id);
          }
        }
        continue;
      }
      const memberCount = db.prepare("SELECT COUNT(*) AS c FROM project_members WHERE project_id = ?").get(p.id)?.c ?? 0;
      if (memberCount === 0) {
        const allUsers = db.prepare("SELECT id FROM users WHERE active = 1").all();
        for (const u of allUsers) {
          db.prepare("INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, 'admin')").run(p.id, u.id);
        }
      }
    }
  } catch (err) {
    console.error("Migration project_members seed error:", err);
  }

  // Notes and sticky notes user ownership
  for (const table of ["notes", "sticky_notes"]) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);
    if (!columns.includes("user_id")) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    }
  }

  // Who a task / to-do is assigned to and who created it.
  for (const table of ["tasks", "todos"]) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);
    for (const column of ["assignee_id", "created_by"]) {
      if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    }
  }

  // Ensure email_verified and vault_pin exist on users
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userColumns.includes("email_verified")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
  }
  if (!userColumns.includes("vault_pin")) {
    db.exec("ALTER TABLE users ADD COLUMN vault_pin TEXT DEFAULT NULL");
  }

  // Ensure email_verifications table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token_hash);
    CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
  `);

  // Issue types became Feature / Task / Bug / Subtask (Epic and Story both become Feature). Changing the CHECK
  // on `type` needs a table rebuild, done with foreign keys off so the parent links survive the copy.
  const tasksSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'tasks'").get()?.sql ?? "";
  if (tasksSql.includes("'Epic'")) {
    db.pragma("foreign_keys = OFF");
    try {
      db.transaction(() => {
        db.exec("DROP INDEX IF EXISTS idx_tasks_status; DROP INDEX IF EXISTS idx_tasks_parent; DROP INDEX IF EXISTS idx_tasks_project;");
        db.exec("ALTER TABLE tasks RENAME TO tasks_old");
        db.exec(SCHEMA); // recreates tasks (and its indexes) with the new CHECK
        db.exec(`
          INSERT INTO tasks (id, issue_key, title, description, type, status, priority, project_id, parent_id, due_at, position, created_at, updated_at)
          SELECT id, issue_key, title, description,
                 CASE type WHEN 'Epic' THEN 'Feature' WHEN 'Story' THEN 'Feature' ELSE type END,
                 status, priority, project_id, parent_id, due_at, position, created_at, updated_at
          FROM tasks_old
        `);
        db.exec("DROP TABLE tasks_old");
      })();
    } finally {
      db.pragma("foreign_keys = ON");
    }
  }

  // Ensure estimate_hours, logged_hours, blocker_reason, category, start_date columns exist on tasks
  const existingTaskCols = db.prepare("PRAGMA table_info(tasks)").all().map((column) => column.name);
  if (!existingTaskCols.includes("estimate_hours")) db.exec("ALTER TABLE tasks ADD COLUMN estimate_hours REAL NOT NULL DEFAULT 0");
  if (!existingTaskCols.includes("logged_hours")) db.exec("ALTER TABLE tasks ADD COLUMN logged_hours REAL NOT NULL DEFAULT 0");
  if (!existingTaskCols.includes("blocker_reason")) db.exec("ALTER TABLE tasks ADD COLUMN blocker_reason TEXT");
  if (!existingTaskCols.includes("category")) db.exec("ALTER TABLE tasks ADD COLUMN category TEXT");
  if (!existingTaskCols.includes("start_date")) db.exec("ALTER TABLE tasks ADD COLUMN start_date TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)");

  // If status CHECK constraint does not allow 'review' and 'blocked', rebuild tasks table
  const currentTasksSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'tasks'").get()?.sql ?? "";
  if (!currentTasksSql.includes("'review'")) {
    db.pragma("foreign_keys = OFF");
    try {
      db.transaction(() => {
        db.exec("DROP INDEX IF EXISTS idx_tasks_status; DROP INDEX IF EXISTS idx_tasks_parent; DROP INDEX IF EXISTS idx_tasks_project;");
        db.exec("ALTER TABLE tasks RENAME TO tasks_old");
        db.exec(SCHEMA); // recreates tasks (and its indexes) with the new CHECK
        db.exec(`
          INSERT INTO tasks (id, issue_key, title, description, type, status, priority, project_id, parent_id, assignee_id, created_by, due_at, position, estimate_hours, logged_hours, blocker_reason, created_at, updated_at)
          SELECT id, issue_key, title, description,
                 CASE type WHEN 'Epic' THEN 'Feature' WHEN 'Story' THEN 'Feature' ELSE type END,
                 status, priority, project_id, parent_id, assignee_id, created_by, due_at, position,
                 estimate_hours, logged_hours, blocker_reason,
                 created_at, updated_at
          FROM tasks_old
        `);
        db.exec("DROP TABLE tasks_old");
      })();
    } finally {
      db.pragma("foreign_keys = ON");
    }
  }

  const noteColumns = db.prepare("PRAGMA table_info(notes)").all().map((column) => column.name);
  if (!noteColumns.includes("tag")) db.exec("ALTER TABLE notes ADD COLUMN tag TEXT");
  if (!noteColumns.includes("project_id")) db.exec("ALTER TABLE notes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_action_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      month_year TEXT NOT NULL,
      title TEXT NOT NULL,
      prep_deadline TEXT,
      exec_start TEXT,
      kpis TEXT NOT NULL DEFAULT '[]',
      sections TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, month_year)
    );
    CREATE INDEX IF NOT EXISTS idx_plans_project ON project_action_plans(project_id);

    CREATE TABLE IF NOT EXISTS collaborator_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collaborator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, collaborator_id)
    );
    CREATE INDEX IF NOT EXISTS idx_collab_user ON collaborator_connections(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_collab_partner ON collaborator_connections(collaborator_id, status);
  `);
}

// Node's built-in SQLite (node:sqlite, Node 22.13+) needs no native compile step. This wrapper keeps the
// small better-sqlite3 style API the rest of the app uses: pragma(), transaction() and plain-object rows
// (node:sqlite returns null-prototype rows, which Next cannot pass to client components).
function plain(row) {
  return row === undefined || row === null ? row : { ...row };
}

class Db {
  constructor(file) {
    this.raw = new DatabaseSync(file);
    this.depth = 0;
  }

  close() {
    try {
      this.raw.close();
    } catch {}
  }

  exec(sql) {
    this.raw.exec(sql);
  }

  prepare(sql) {
    const stmt = this.raw.prepare(sql);
    return {
      get: (...args) => plain(stmt.get(...args)),
      all: (...args) => stmt.all(...args).map(plain),
      run: (...args) => stmt.run(...args),
    };
  }

  pragma(text) {
    return this.raw.prepare(`PRAGMA ${text}`).all().map(plain);
  }

  transaction(fn) {
    const run = this.#tx(fn, "BEGIN");
    run.deferred = run;
    run.immediate = this.#tx(fn, "BEGIN IMMEDIATE");
    run.exclusive = this.#tx(fn, "BEGIN EXCLUSIVE");
    return run;
  }

  #tx(fn, begin) {
    return (...args) => {
      const name = `sp_${this.depth}`;
      this.raw.exec(this.depth === 0 ? begin : `SAVEPOINT ${name}`);
      this.depth++;
      try {
        const result = fn(...args);
        this.depth--;
        this.raw.exec(this.depth === 0 ? "COMMIT" : `RELEASE ${name}`);
        return result;
      } catch (error) {
        this.depth--;
        this.raw.exec(this.depth === 0 ? "ROLLBACK" : `ROLLBACK TO ${name}; RELEASE ${name}`);
        throw error;
      }
    };
  }
}

// Opened lazily (not at import) so `next build` never touches the database file.
const DB_VERSION = 16;

export function getDb() {
  const store = globalThis;
  if (store.__nexaDb && store.__nexaDbVersion === DB_VERSION) return store.__nexaDb;

  if (store.__nexaDb) {
    try {
      store.__nexaDb.close();
    } catch {}
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Db(DB_PATH);
  db.pragma("busy_timeout = 10000");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  try {
    const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
    if (userCols.length > 0 && !userCols.includes("email_verified")) {
      db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
    }
    if (userCols.length > 0 && !userCols.includes("vault_pin")) {
      db.exec("ALTER TABLE users ADD COLUMN vault_pin TEXT DEFAULT NULL");
    }
  } catch {}
  try {
    const stickyCols = db.prepare("PRAGMA table_info(sticky_notes)").all().map((c) => c.name);
    if (stickyCols.length > 0 && !stickyCols.includes("project_id")) {
      db.exec("ALTER TABLE sticky_notes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE");
    }
  } catch {}
  db.exec(SCHEMA);
  migrate(db);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      type TEXT DEFAULT 'general',
      metadata TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

    CREATE TABLE IF NOT EXISTS project_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_project_messages_proj ON project_messages(project_id, id);

    CREATE TABLE IF NOT EXISTS project_chat_reads (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      last_read_message_id INTEGER NOT NULL DEFAULT 0,
      last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, project_id)
    );
    CREATE INDEX IF NOT EXISTS idx_chat_reads_user ON project_chat_reads(user_id, project_id);

    CREATE TABLE IF NOT EXISTS action_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('credentials', 'env', 'project_setup', 'general')),
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      assignee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_action_assignee ON action_requests(assignee_id, status);
    CREATE INDEX IF NOT EXISTS idx_action_creator ON action_requests(created_by, status);

    CREATE TABLE IF NOT EXISTS project_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'meeting' CHECK(type IN ('meeting', 'milestone', 'release', 'deadline')),
      event_date TEXT NOT NULL,
      event_time TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_project_events_date ON project_events(project_id, event_date);

    CREATE TABLE IF NOT EXISTS collaborator_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collaborator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, collaborator_id)
    );
    CREATE INDEX IF NOT EXISTS idx_collab_user ON collaborator_connections(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_collab_partner ON collaborator_connections(collaborator_id, status);
  `);

  const notifCols = db.prepare("PRAGMA table_info(notifications)").all().map((c) => c.name);
  if (!notifCols.includes("type")) {
    db.exec("ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'general'");
  }
  if (!notifCols.includes("metadata")) {
    db.exec("ALTER TABLE notifications ADD COLUMN metadata TEXT");
  }

  const msgCols = db.prepare("PRAGMA table_info(project_messages)").all().map((c) => c.name);
  if (!msgCols.includes("deleted_for")) {
    db.exec("ALTER TABLE project_messages ADD COLUMN deleted_for TEXT NOT NULL DEFAULT '[]'");
  }

  if (process.env.NEXA_SEED_DEMO !== "false") seedDatabase(db);

  store.__nexaDb = db;
  store.__nexaDbVersion = DB_VERSION;
  return db;
}
