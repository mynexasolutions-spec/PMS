import { authorize } from "@/lib/auth";
import { deleteStickyNote, getStickyNote, updateStickyNote } from "@/lib/db/repo";
import { isStickyColor, STICKY_CATEGORIES } from "@/lib/constants";
import { fail, idFrom, noContent, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getStickyNote(id)) return fail("Sticky note not found.", 404);

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
  return deleteStickyNote(id) ? noContent() : fail("Sticky note not found.", 404);
}
