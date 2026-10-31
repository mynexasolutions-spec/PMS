import { authorize } from "@/lib/auth";
import { deleteStickyNote, getStickyNote, isProjectAdmin, isProjectMember, updateStickyNote } from "@/lib/db/repo";
import { isStickyColor, STICKY_CATEGORIES } from "@/lib/constants";
import { fail, idFrom, noContent, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid sticky note id.");
  const note = getStickyNote(id);
  if (!note) return fail("Sticky note not found.", 404);

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";

  if (note.projectId) {
    const isMember = isProjectMember(note.projectId, auth.user.id);
    if (!isMember && !isManager) {
      return fail("Forbidden: You are not a member of this project.", 403);
    }
  } else {
    if (!isManager && note.userId !== auth.user.id) {
      return fail("You can only edit your own sticky notes.", 403);
    }
  }

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  if (body.content !== undefined && !content) return fail("A sticky note needs some text.");
  if (content && content.length > 500) return fail("Keep a sticky note under 500 characters.");
  if (body.color !== undefined && !isStickyColor(body.color)) return fail("Invalid colour.");
  if (body.pinned !== undefined && typeof body.pinned !== "boolean") return fail("Invalid pin value.");
  if (body.category != null && !STICKY_CATEGORIES.includes(body.category)) return fail("Invalid category.");

  return Response.json({ note: updateStickyNote(id, { ...body, content }) });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid sticky note id.");
  const note = getStickyNote(id);
  if (!note) return fail("Sticky note not found.", 404);

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";

  if (note.projectId) {
    const isProjAdm = isProjectAdmin(note.projectId, auth.user.id);
    const canDelete = isProjAdm || note.userId === auth.user.id || isManager;
    if (!canDelete) {
      return fail("Forbidden: Only the note creator or a Project Admin can delete this note.", 403);
    }
  } else {
    if (!isManager && note.userId !== auth.user.id) {
      return fail("You can only delete your own sticky notes.", 403);
    }
  }

  return deleteStickyNote(id) ? noContent() : fail("Sticky note not found.", 404);
}
