import { authorize } from "@/lib/auth";
import { deleteAttachment, getAttachment, getNote, getProjects } from "@/lib/db/repo";
import { fail, idFrom, noContent } from "@/lib/http";
import { INLINE_IMAGE_TYPES, readFile, removeFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads the file. Only raster images may be shown inline (?inline=1); everything else is forced to download. */
export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const attachment = id === null ? null : getAttachment(id);
  if (!attachment) return fail("Attachment not found.", 404);

  const note = getNote(attachment.noteId);
  if (!note) return fail("Note not found.", 404);

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";
  if (!isManager) {
    const myProjectIds = new Set(getProjects().filter((p) => p.assigneeId === auth.user.id).map((p) => p.id));
    const canView = note.userId === auth.user.id || (note.projectId && myProjectIds.has(note.projectId)) || (note.userId == null && note.projectId == null);
    if (!canView) return fail("Forbidden.", 403);
  }

  let data;
  try {
    data = readFile(attachment.storedName);
  } catch {
    return fail("The file is missing from the server.", 404);
  }

  const inline = new URL(request.url).searchParams.get("inline") === "1" && INLINE_IMAGE_TYPES.has(attachment.mime);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid attachment id.");
  const attachment = getAttachment(id);
  if (!attachment) return fail("Attachment not found.", 404);

  const note = getNote(attachment.noteId);
  const isManager = auth.user.role === "admin" || auth.user.role === "manager";
  if (note && !isManager && note.userId !== auth.user.id) {
    return fail("You can only delete attachments from your own notes.", 403);
  }

  const removed = deleteAttachment(id);
  if (!removed) return fail("Attachment not found.", 404);
  removeFile(removed.storedName);
  return noContent();
}
