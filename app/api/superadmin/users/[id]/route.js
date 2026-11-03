import { deleteUserSessions, getUser, updateUser } from "@/lib/db/users";
import { fail, idFrom, readJson } from "@/lib/http";
import { getSuperadminSession } from "@/lib/superadmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Toggle user active/blocked status from the Superadmin Dashboard. */
export async function PATCH(request, { params }) {
  const session = await getSuperadminSession();
  if (!session) {
    return fail("Unauthorized superadmin access.", 401);
  }

  const id = await idFrom(params);
  const target = id === null ? null : getUser(id);
  if (!target) {
    return fail("Account not found.", 404);
  }

  const body = await readJson(request);
  if (!body || typeof body.active !== "boolean") {
    return fail("Invalid request.", 400);
  }

  const updated = updateUser(id, { active: body.active });
  if (body.active === false) {
    // Immediately sign the blocked user out of all active sessions
    deleteUserSessions(id);
  }

  return Response.json({ user: updated });
}
