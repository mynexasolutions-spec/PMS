import { authorize } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/db/users";
import { fail, readJson } from "@/lib/http";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The directory of accounts: any signed-in person can see it. */
export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  return Response.json({ users: listUsers() });
}

/** Any registered user can add new accounts. */
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name || name.length > 60) return fail("Enter a name (up to 60 characters).");
  if (!EMAIL_RE.test(email) || email.length > 120) return fail("Enter a valid e-mail address.");
  if (password.length < MIN_PASSWORD_LENGTH) return fail(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);

  try {
    const user = createUser({ name, email, role: "member", passwordHash: await hashPassword(password) });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return fail("Someone already uses that e-mail address.", 409);
    console.error(error);
    return fail("Unable to add the account.", 500);
  }
}
