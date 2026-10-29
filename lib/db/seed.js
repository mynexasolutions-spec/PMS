import { addDays, istDate } from "../dates.js";
import { hashPasswordSync } from "../password.js";

const pad = (value) => String(value).padStart(2, "0");
const localDate = (days = 0) => addDays(istDate(), days);

function seedDailyPlan(db) {
  const projectId = (name) => db.prepare("SELECT id FROM projects WHERE name = ?").get(name)?.id ?? null;
  const greenleaf = projectId("Greenleaf Online Store");
  const urbanFit = projectId("Urban Fit Website");
  const inventory = projectId("Inventory Mobile App");
  const internal = projectId("Nexa Internal");

  const insertTodo = db.prepare(`
    INSERT INTO todos (title, priority, start_time, end_time, todo_date, status, project_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const today = localDate();
  insertTodo.run("Integrate Razorpay payment gateway", "high", "13:00", "15:00", today, "todo", greenleaf);
  insertTodo.run("Send the staging build to QA", "medium", "15:30", "16:00", today, "todo", greenleaf);
  insertTodo.run("Write unit tests for the stock API", "low", "17:00", "18:00", today, "todo", inventory);
  insertTodo.run("Plan tasks for tomorrow", "low", "18:00", "18:30", today, "todo", internal);
  insertTodo.run("Build stock-level API endpoints", "medium", "14:00", "16:00", today, "progress", inventory);
  insertTodo.run("Update portfolio case studies", "medium", "19:00", "20:00", today, "progress", internal);
  insertTodo.run("Check homepage designs in Figma", "medium", "11:00", "12:00", today, "review", urbanFit);
  insertTodo.run("Review pull requests for Greenleaf", "high", "09:00", "10:00", today, "done", greenleaf);
  insertTodo.run("Daily standup and task sync", "medium", "10:30", "11:00", today, "done", internal);
  insertTodo.run("Team discussion: review today's work", "low", "21:00", "21:30", today, "todo", internal);

  const insertFocus = db.prepare("INSERT INTO focus_items (title, done, focus_date) VALUES (?, 0, ?)");
  insertFocus.run("Finish the Razorpay checkout flow", today);
  insertFocus.run("Review Figma designs with the team", today);
  insertFocus.run("Prepare tomorrow's task assignments", today);
}

/** Fills an empty database with sample agency data. Does nothing if projects already exist. */
export function seedDatabase(db) {
  const run = db.transaction(() => {
    if (db.prepare("SELECT COUNT(*) AS count FROM projects").get().count > 0) return;

    const insertProject = db.prepare("INSERT INTO projects (name, color, description, stage) VALUES (?, ?, ?, ?)");
    const greenleaf = Number(insertProject.run("Greenleaf Online Store", "#4e8447", "E-commerce website with modern UI", "in_progress").lastInsertRowid);
    const urbanFit = Number(insertProject.run("Urban Fit Website", "#267a87", "Gym & fitness brand website", "account_setup").lastInsertRowid);
    const inventory = Number(insertProject.run("Inventory Mobile App", "#7c62a0", "React Native inventory management", "working").lastInsertRowid);
    const internal = Number(insertProject.run("Nexa Internal", "#c77b2d", "Internal tools & productivity", "working").lastInsertRowid);

    const insertTask = db.prepare(`
      INSERT INTO tasks (issue_key, title, type, status, priority, project_id, parent_id, due_at, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let position = 0;
    const add = (key, title, type, status, priority, projectId, parentId, dueInDays, hour = 18) => {
      position += 1;
      return Number(
        insertTask.run(`NX-${key}`, title, type, status, priority, projectId, parentId, `${localDate(dueInDays)}T${pad(hour)}:00`, position)
          .lastInsertRowid,
      );
    };

    const store = add(101, "Greenleaf store: build and launch", "Feature", "progress", "high", greenleaf, null, 9);
    const checkout = add(102, "Checkout and payments", "Feature", "progress", "high", greenleaf, store, 4);
    const payment = add(103, "Integrate Razorpay payment gateway", "Task", "todo", "high", greenleaf, checkout, 3, 17);
    add(104, "Handle failed payment webhook", "Subtask", "todo", "medium", greenleaf, payment, 3, 19);
    const catalogue = add(105, "Product catalogue pages", "Feature", "done", "medium", greenleaf, store, -2);
    const listing = add(106, "Build product listing with filters", "Task", "done", "medium", greenleaf, catalogue, -3, 16);
    add(107, "Fix cart total when a coupon is applied", "Bug", "progress", "high", greenleaf, listing, 1, 14);

    const redesign = add(108, "Urban Fit: website redesign", "Feature", "progress", "medium", urbanFit, null, 14);
    const design = add(109, "Design system and homepage", "Feature", "progress", "high", urbanFit, redesign, 2);
    add(110, "Finalise homepage designs in Figma", "Task", "todo", "high", urbanFit, design, 1, 17);
    add(111, "Convert homepage design to Next.js", "Task", "todo", "medium", urbanFit, design, 5);
    const seo = add(112, "Content and SEO", "Feature", "todo", "medium", urbanFit, redesign, 10);
    add(113, "Write service page copy", "Task", "todo", "low", urbanFit, seo, 8);

    const app = add(114, "Inventory app: version 1 release", "Feature", "progress", "high", inventory, null, 20);
    const auth = add(115, "User authentication", "Feature", "done", "medium", inventory, app, -5);
    add(116, "Set up login with JWT", "Task", "done", "medium", inventory, auth, -6, 15);
    const stock = add(117, "Stock dashboard", "Feature", "progress", "high", inventory, app, 6);
    add(118, "Build stock-level API endpoints", "Task", "progress", "high", inventory, stock, 4);
    add(119, "Write unit tests for the stock API", "Task", "todo", "medium", inventory, stock, 5);

    add(120, "Update the Nexa portfolio website", "Task", "todo", "low", internal, null, 12);
    add(121, "Write case study: Greenleaf launch", "Task", "done", "low", internal, null, -4, 11);

    seedDailyPlan(db);

    const insertSticky = db.prepare("INSERT INTO sticky_notes (content, color, category, pinned) VALUES (?, ?, ?, 1)");
    insertSticky.run("Focus on the payment gateway today. Keep it simple and well tested.", "yellow", "personal");
    insertSticky.run("Check the design review comments in Figma before standup.", "green", "work");
    insertSticky.run("Back up the staging database before deploying the API!", "pink", "important");
    insertSticky.run("Night discussion: list today's blockers and tomorrow's plan.", "blue", "work");
  });
  run.immediate();
  seedUsers(db);
}

export const DEMO_USERS = [
  ["Nexa Admin", "admin@nexa.local", "admin"],
  ["Project Manager", "manager@nexa.local", "manager"],
  ["Aarav Mehta", "aarav@nexa.local", "member"],
  ["Priya Nair", "priya@nexa.local", "member"],
];

/**
 * Demo accounts (one per role) so the app can be opened on a fresh database, plus the demo work handed out
 * to them and a little sample discussion. Does nothing once any account exists.
 */
export function seedUsers(db) {
  if (db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0) return;

  // Never create accounts with a well-known password on a production server.
  const password = process.env.NEXA_DEMO_PASSWORD || (process.env.NODE_ENV === "production" ? null : "nexa-demo-1234");
  if (!password) {
    console.warn("[nexa] No accounts yet. Create the first admin with: npm run create-admin -- <email> <name> <password>");
    return;
  }

  const insert = db.prepare("INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)");
  const ids = {};
  for (const [name, email, role] of DEMO_USERS) ids[email] = Number(insert.run(name, email, role, hashPasswordSync(password)).lastInsertRowid);
  const admin = ids["admin@nexa.local"];
  const team = [ids["manager@nexa.local"], ids["aarav@nexa.local"], ids["priya@nexa.local"]];

  db.transaction(() => {
    // Hand the demo work to the team round-robin.
    for (const table of ["tasks", "todos"]) {
      const set = db.prepare(`UPDATE ${table} SET assignee_id = ?, created_by = ? WHERE id = ?`);
      db.prepare(`SELECT id FROM ${table} WHERE assignee_id IS NULL ORDER BY id`)
        .all()
        .forEach((row, i) => set.run(team[i % team.length], admin, row.id));
    }

    // Sample evening discussion for today (stored in UTC; these are ~8-9 PM IST).
    const today = localDate();
    const comment = db.prepare("INSERT INTO comments (scope, ref, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)");
    comment.run("day", today, ids["priya@nexa.local"], "Razorpay sandbox keys mil gaye. Checkout flow kal tak ready ho jayega.", `${today} 14:35:00`);
    comment.run("day", today, ids["aarav@nexa.local"], "Staging build QA ko bhej diya. 2 bugs mile hain (coupon aur cart total).", `${today} 14:52:00`);
    comment.run("day", today, ids["manager@nexa.local"], "Theek hai. Kal subah standup me priorities final karte hain.", `${today} 15:20:00`);
    const firstTodo = db.prepare("SELECT id FROM todos ORDER BY id LIMIT 1").get();
    if (firstTodo) comment.run("todo", String(firstTodo.id), ids["aarav@nexa.local"], "Webhook ka retry logic bhi add karna hai is task me.", `${today} 04:40:00`);
  })();

  console.log(`[nexa] Demo accounts created: ${DEMO_USERS.map(([, email]) => email).join(", ")} (password: ${password})`);
}
