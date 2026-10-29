import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
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
  for (const column of ["client_name", "repo_url", "staging_url", "live_url", "hosting", "tech_stack", "notes"]) {
    if (!projectColumns.includes(column)) db.exec(`ALTER TABLE projects ADD COLUMN ${column} TEXT`);
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

  const noteColumns = db.prepare("PRAGMA table_info(notes)").all().map((column) => column.name);
  if (!noteColumns.includes("tag")) db.exec("ALTER TABLE notes ADD COLUMN tag TEXT");
  if (!noteColumns.includes("project_id")) db.exec("ALTER TABLE notes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL");
}

// Opened lazily (not at import) so `next build` never touches the database file.
export function getDb() {
  const store = globalThis;
  if (store.__nexaDb) return store.__nexaDb;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 10000");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  if (process.env.NEXA_SEED_DEMO !== "false") seedDatabase(db);

  store.__nexaDb = db;
  return db;
}
