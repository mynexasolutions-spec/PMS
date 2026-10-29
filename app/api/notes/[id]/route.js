import { authorize } from "@/lib/auth";
import { deleteNote, getNote, getNoteFiles, updateNote } from "@/lib/db/repo";
import { NOTE_TAGS } from "@/lib/constants";
import { fail, idFrom, noContent, readJson } from "@/lib/http";
import { removeFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE = 100;
const MAX_CONTENT = 2000;

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getNote(id)) return fail("Note not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  if (body.title !== undefined && !title) return fail("A note title is required.");
  if (title && title.length > MAX_TITLE) return fail(`Keep the title under ${MAX_TITLE} characters.`);
  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  if (content && content.length > MAX_CONTENT) return fail(`Keep the note under ${MAX_CONTENT} characters.`);
  if (body.tag != null && !NOTE_TAGS.includes(body.tag)) return fail("Invalid tag.");
  if (body.projectId != null && !Number.isInteger(body.projectId)) return fail("Invalid project.");

  return Response.json({ note: updateNote(id, { title, content, tag: body.tag, projectId: body.projectId }) });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid note id.");

  const files = getNoteFiles(id); // read before the rows cascade away
  if (!deleteNote(id)) return fail("Note not found.", 404);
  files.forEach(removeFile);
  return noContent();
}
