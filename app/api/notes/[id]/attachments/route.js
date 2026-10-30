import { authorize } from "@/lib/auth";
import { addAttachment, getNote } from "@/lib/db/repo";
import { fail, idFrom } from "@/lib/http";
import { MAX_FILES_PER_NOTE, MAX_FILE_BYTES, cleanName, mimeFor, saveFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Multipart upload: one or more `files` fields. Validated as a whole before anything is written. */
export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const noteId = await idFrom(params);
  const note = noteId === null ? null : getNote(noteId);
  if (!note) return fail("Note not found.", 404);

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";
  if (!isManager && note.userId !== auth.user.id) {
    return fail("You can only add attachments to your own notes.", 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload.");
  }
  const files = form.getAll("files").filter((entry) => typeof entry !== "string");
  if (!files.length) return fail("Choose a file to attach.");
  if (note.attachments.length + files.length > MAX_FILES_PER_NOTE) return fail(`A note can have at most ${MAX_FILES_PER_NOTE} attachments.`);

  const accepted = [];
  for (const file of files) {
    const filename = cleanName(file.name);
    const mime = mimeFor(filename);
    if (!mime) return fail(`"${filename}" is not an allowed file type.`);
    if (file.size > MAX_FILE_BYTES) return fail(`"${filename}" is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
    accepted.push({ file, filename, mime });
  }

  for (const { file, filename, mime } of accepted) {
    const storedName = saveFile(Buffer.from(await file.arrayBuffer()), filename);
    addAttachment({ noteId, filename, storedName, mime, size: file.size });
  }
  return Response.json({ attachments: getNote(noteId).attachments }, { status: 201 });
}
