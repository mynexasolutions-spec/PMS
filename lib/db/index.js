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

  const projectColumns = db.prepare("PRAGMA table_info(projects)").all().map((column) => column.name);
  if (!projectColumns.includes("description")) db.exec("ALTER TABLE projects ADD COLUMN description TEXT");
  if (!projectColumns.includes("stage")) db.exec("ALTER TABLE projects ADD COLUMN stage TEXT NOT NULL DEFAULT 'account_setup'");
  if (!projectColumns.includes("assignee_id")) db.exec("ALTER TABLE projects ADD COLUMN assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
  if (!projectColumns.includes("is_blacklisted")) db.exec("ALTER TABLE projects ADD COLUMN is_blacklisted INTEGER NOT NULL DEFAULT 0");
  for (const column of ["client_name", "repo_url", "staging_url", "live_url", "hosting", "tech_stack", "notes"]) {
    if (!projectColumns.includes(column)) db.exec(`ALTER TABLE projects ADD COLUMN ${column} TEXT`);
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

  // Ensure estimate_hours, logged_hours, blocker_reason columns exist on tasks
  const existingTaskCols = db.prepare("PRAGMA table_info(tasks)").all().map((column) => column.name);
  if (!existingTaskCols.includes("estimate_hours")) db.exec("ALTER TABLE tasks ADD COLUMN estimate_hours REAL NOT NULL DEFAULT 0");
  if (!existingTaskCols.includes("logged_hours")) db.exec("ALTER TABLE tasks ADD COLUMN logged_hours REAL NOT NULL DEFAULT 0");
  if (!existingTaskCols.includes("blocker_reason")) db.exec("ALTER TABLE tasks ADD COLUMN blocker_reason TEXT");

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
const DB_VERSION = 4;

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
  db.exec(SCHEMA);
  migrate(db);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
  `);

  if (process.env.NEXA_SEED_DEMO !== "false") seedDatabase(db);

  store.__nexaDb = db;
  store.__nexaDbVersion = DB_VERSION;
  return db;
}
