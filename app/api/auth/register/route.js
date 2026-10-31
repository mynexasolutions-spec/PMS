import { startSession } from "@/lib/auth";
import { createUser, getUserForLogin } from "@/lib/db/users";
import { fail, readJson } from "@/lib/http";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return fail("Please enter your name.", 400);
  if (name.length > 60) return fail("Name cannot exceed 60 characters.", 400);

  if (!email || !email.includes("@")) return fail("Please enter a valid work e-mail.", 400);
  if (email.length > 120) return fail("E-mail cannot exceed 120 characters.", 400);

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
  }

  const existing = getUserForLogin(email);
  if (existing) {
    return fail("An account with that e-mail already exists. Please sign in.", 409);
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = createUser({ name, email, role: "member", passwordHash });
    await startSession(user.id);
    return Response.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Sign up error:", error);
    return fail("Could not create account. Please try again.", 500);
  }
}
