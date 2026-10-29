import { ADMINS, authorize } from "@/lib/auth";
import { countActiveAdmins, deleteUserSessions, getUser, updateUser } from "@/lib/db/users";
import { fail, idFrom, readJson } from "@/lib/http";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admins change a person's name, role, active flag, or reset their password. */
export async function PATCH(request, { params }) {
  const auth = await authorize(request, ADMINS);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const target = id === null ? null : getUser(id);
  if (!target) return fail("User not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  const patch = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return fail("Enter a name (up to 60 characters).");
    patch.name = name;
  }
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return fail("Choose a role.");
    patch.role = body.role;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return fail("Invalid value.");
    patch.active = body.active;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) return fail(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
    patch.passwordHash = await hashPassword(body.password);
  }

  // Never leave the company without an active admin, and don't let admins lock themselves out.
  const losesAdmin = target.role === "admin" && target.active && ((patch.role && patch.role !== "admin") || patch.active === false);
  if (losesAdmin && countActiveAdmins() <= 1) return fail("There must be at least one active admin.", 400);
  if (id === auth.user.id && patch.active === false) return fail("You can't disable your own account.", 400);

  const user = updateUser(id, patch);
  if (patch.passwordHash || patch.active === false) deleteUserSessions(id); // sign them out everywhere
  return Response.json({ user });
}
