import { authorize } from "@/lib/auth";
import { createNote, getNotes } from "@/lib/db/repo";
import { NOTE_TAGS } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE = 100;
const MAX_CONTENT = 2000;

import { getProjects } from "@/lib/db/repo";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const notes = getNotes();
  if (auth.user.role === "member") {
    const myProjectIds = new Set(getProjects().filter((p) => p.assigneeId === auth.user.id).map((p) => p.id));
    const filtered = notes.filter((n) => n.userId === auth.user.id || (n.projectId && myProjectIds.has(n.projectId)) || (n.userId == null && n.projectId == null));
    return Response.json({ notes: filtered });
  }

  return Response.json({ notes });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return fail("A note title is required.");
  if (title.length > MAX_TITLE) return fail(`Keep the title under ${MAX_TITLE} characters.`);

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length > MAX_CONTENT) return fail(`Keep the note under ${MAX_CONTENT} characters.`);
  if (body.tag != null && !NOTE_TAGS.includes(body.tag)) return fail("Invalid tag.");
  if (body.projectId != null && !Number.isInteger(body.projectId)) return fail("Invalid project.");

  try {
    return Response.json({ note: createNote({ title, content, tag: body.tag ?? null, projectId: body.projectId ?? null, userId: auth.user.id }) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return fail("Unable to save the note.", 500);
  }
}
