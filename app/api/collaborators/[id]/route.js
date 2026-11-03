import { authorize } from "@/lib/auth";
import { removeCollaborator } from "@/lib/db/repo";
import { fail, idFrom } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const targetUserId = await idFrom(params);
  if (!targetUserId) {
    return fail("Target user ID is required.", 400);
  }

  try {
    removeCollaborator(auth.user.id, targetUserId);
    return Response.json({ success: true, message: "Collaborator removed." });
  } catch (err) {
    return fail(err.message || "Failed to remove collaborator.", 400);
  }
}
