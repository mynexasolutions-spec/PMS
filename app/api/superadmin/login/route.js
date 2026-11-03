import { fail, readJson } from "@/lib/http";
import { clearFailures, lockedFor, recordFailure } from "@/lib/rateLimit";
import { startSuperadminSession, verifySuperadminCredentials } from "@/lib/superadmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return fail("Enter superadmin username and password.");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = `superadmin|${ip}|${email}`;
  const wait = lockedFor(key);
  if (wait) {
    return fail(`Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, 429);
  }

  const valid = verifySuperadminCredentials(email, password);
  if (!valid) {
    recordFailure(key);
    return fail("Invalid superadmin username or password.", 401);
  }

  clearFailures(key);
  await startSuperadminSession(email);
  return Response.json({ ok: true, email });
}
