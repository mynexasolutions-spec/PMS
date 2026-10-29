import { getUserForLogin, touchLogin } from "@/lib/db/users";
import { startSession } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { verifyDecoy, verifyPassword } from "@/lib/password";
import { clearFailures, lockedFor, recordFailure } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return fail("Enter your e-mail and password.");

  // Throttle repeated guesses per (IP, e-mail). Behind Nginx the client address arrives in x-forwarded-for.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = `${ip}|${email}`;
  const wait = lockedFor(key);
  if (wait) return fail(`Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, 429);

  const user = getUserForLogin(email);
  const valid = user ? await verifyPassword(password, user.passwordHash) : (await verifyDecoy(password), false);
  // One message for "no such account", "wrong password" and "disabled", so it can't be used to probe for accounts.
  if (!valid || user.active !== 1) {
    recordFailure(key);
    return fail("Wrong e-mail or password.", 401);
  }

  clearFailures(key);
  touchLogin(user.id);
  await startSession(user.id);
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
