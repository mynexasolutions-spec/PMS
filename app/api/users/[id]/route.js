import { authorize } from "@/lib/auth";
import { deleteUserSessions, getUser, updateUser } from "@/lib/db/users";
import { fail, idFrom, readJson } from "@/lib/http";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update an account: name, password, or active state. */
export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const target = id === null ? null : getUser(id);
  if (!target) return fail("Account not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  const patch = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return fail("Enter a name (up to 60 characters).");
    patch.name = name;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return fail("Invalid value.");
    if (id === auth.user.id && body.active === false) return fail("You cannot disable your own account.", 400);
    patch.active = body.active;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) return fail(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
    patch.passwordHash = await hashPassword(body.password);
  }

  const user = updateUser(id, patch);
  if (patch.passwordHash || patch.active === false) deleteUserSessions(id);
  return Response.json({ user });
}
