import { authorize } from "@/lib/auth";
import { deleteActionRequest, getActionRequest, updateActionRequest } from "@/lib/db/repo";
import { fail, idFrom, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (!id) return fail("Invalid ID.", 400);

  const current = getActionRequest(id);
  if (!current) return fail("Action request not found.", 404);

  // User must be assignee, creator, or workspace admin
  const isSuperAdmin = auth.user.role === "admin";
  const canUpdate = current.assigneeId === auth.user.id || current.createdBy === auth.user.id || isSuperAdmin;
  if (!canUpdate) return fail("Forbidden.", 403);

  const body = await readJson(request);
  const updated = updateActionRequest(id, body, auth.user.id);
  return Response.json({ action: updated }, { headers: noStore });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (!id) return fail("Invalid ID.", 400);

  const current = getActionRequest(id);
  if (!current) return fail("Action request not found.", 404);

  // User must be creator or workspace admin to delete
  const isSuperAdmin = auth.user.role === "admin";
  const canDelete = current.createdBy === auth.user.id || isSuperAdmin;
  if (!canDelete) return fail("Forbidden: Only the creator or an admin can delete this request.", 403);

  deleteActionRequest(id);
  return Response.json({ success: true, deletedId: id }, { headers: noStore });
}
