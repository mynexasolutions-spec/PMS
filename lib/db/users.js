// SQL for accounts and sessions. (Everything else lives in repo.js; both are the only files that touch the database.)
import { getDb } from "./index.js";

const db = () => getDb();

const toUser = (row) => (row ? { ...row, active: row.active === 1 } : undefined);
const publicSelect = "SELECT id, name, email, role, active, last_login_at AS lastLoginAt, created_at AS createdAt FROM users";

export const countUsers = () => db().prepare("SELECT COUNT(*) AS n FROM users").get().n;

export const listUsers = () => db().prepare(`${publicSelect} ORDER BY active DESC, name COLLATE NOCASE`).all().map(toUser);

export const getUser = (id) => toUser(db().prepare(`${publicSelect} WHERE id = ?`).get(id));

/** Includes the password hash: only for signing in. */
export const getUserForLogin = (email) =>
  db().prepare("SELECT id, name, email, role, active, password_hash AS passwordHash FROM users WHERE email = ?").get(email);

export function createUser({ name, email, role, passwordHash }) {
  const result = db().prepare("INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)").run(name, email, role, passwordHash);
  return getUser(Number(result.lastInsertRowid));
}

export function updateUser(id, patch) {
  const columns = { name: "name", role: "role", passwordHash: "password_hash" };
  const keys = Object.keys(patch).filter((key) => key in columns && patch[key] !== undefined);
  if (keys.length) {
    db()
      .prepare(`UPDATE users SET ${keys.map((key) => `${columns[key]} = ?`).join(", ")} WHERE id = ?`)
      .run(...keys.map((key) => patch[key]), id);
  }
  if (patch.active !== undefined) db().prepare("UPDATE users SET active = ? WHERE id = ?").run(patch.active ? 1 : 0, id);
  return getUser(id);
}

export const countActiveAdmins = () => db().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1").get().n;

export const touchLogin = (id) => db().prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

// ---------- sessions (only a SHA-256 of the cookie token is stored) ----------

export function createSession(userId, tokenHash, expiresAt) {
  db().prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(userId, tokenHash, expiresAt);
}

export function findSession(tokenHash) {
  const row = db()
    .prepare(
      `SELECT s.expires_at AS expiresAt, u.id, u.name, u.email, u.role, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash);
  return row && { expiresAt: row.expiresAt, user: toUser({ id: row.id, name: row.name, email: row.email, role: row.role, active: row.active }) };
}

export const deleteSession = (tokenHash) => db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);

/** Signs a user out everywhere (after a password reset or when they are disabled), optionally keeping one session. */
export function deleteUserSessions(userId, exceptTokenHash = null) {
  db().prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT ?").run(userId, exceptTokenHash);
}

export const purgeExpiredSessions = () => db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
