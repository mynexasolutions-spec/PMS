// Sessions and request authorisation (server only).
// A random token goes into an HttpOnly cookie; the database stores only its SHA-256, so a leaked database
// can't be replayed as a session.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { fail } from "./http";
import * as users from "./db/users.js";
import { MANAGER_ROLES } from "./permissions";

export const SESSION_COOKIE = "nexa_session";
const SESSION_DAYS = 14;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Browsers only accept `Secure` cookies over HTTPS. Set COOKIE_SECURE=false if you serve plain HTTP.
const secureCookie = () => (process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production");

export async function startSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  users.purgeExpiredSessions();
  users.createSession(userId, sha256(token), expires.toISOString());
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", expires });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) users.deleteSession(sha256(token));
  store.delete(SESSION_COOKIE);
}

/** Hash of the current session cookie (to keep this session when other ones are revoked). */
export async function currentTokenHash() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : null;
}

/** The signed-in user ({ id, name, email, role }) or null. Safe to call from pages, layouts and route handlers. */
export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = users.findSession(sha256(token));
  if (!session || !session.user.active || new Date(session.expiresAt).getTime() < Date.now()) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role };
}

/**
 * Guard for API routes: `const auth = await authorize(request, ["admin"]); if (auth.error) return auth.error;`
 * Checks the session, the role (when given) and, for anything that changes data, that the request came from this site.
 */
export async function authorize(request, roles) {
  const user = await getSessionUser();
  if (!user) return { error: fail("Please sign in.", 401) };

  if (request && !SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      let sameSite = false;
      try {
        sameSite = new URL(origin).host === request.headers.get("host");
      } catch {
        // malformed Origin header: treated as cross-site
      }
      if (!sameSite) return { error: fail("Cross-site request blocked.", 403) };
    }
  }

  if (roles && !roles.includes(user.role)) return { error: fail("You don't have permission to do that.", 403) };
  return { user };
}

export const MANAGERS = MANAGER_ROLES;
export const ADMINS = ["admin"];
