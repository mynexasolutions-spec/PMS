import { authorize } from "@/lib/auth";
import { deleteComment, getComment } from "@/lib/db/repo";
import { fail, idFrom, noContent } from "@/lib/http";
import { isManager } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** You can remove your own comments; managers and admins can remove anyone's. */
export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const comment = id === null ? null : getComment(id);
  if (!comment) return fail("Comment not found.", 404);
  if (comment.authorId !== auth.user.id && !isManager(auth.user)) return fail("You can only delete your own comments.", 403);

  deleteComment(id);
  return noContent();
}
