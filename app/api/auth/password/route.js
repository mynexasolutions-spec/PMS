import { authorize, currentTokenHash } from "@/lib/auth";
import { deleteUserSessions, getUserForLogin, updateUser } from "@/lib/db/users";
import { fail, noContent, readJson } from "@/lib/http";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Change your own password. Every other device is signed out; this one stays signed in. */
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (next.length < MIN_PASSWORD_LENGTH) return fail(`Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`);
  if (next === current) return fail("The new password must be different from the current one.");

  const user = getUserForLogin(auth.user.email);
  if (!user || !(await verifyPassword(current, user.passwordHash))) return fail("Your current password is wrong.", 400);

  updateUser(user.id, { passwordHash: await hashPassword(next) });
  deleteUserSessions(user.id, await currentTokenHash());
  return noContent();
}
