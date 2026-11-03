import { authorize } from "@/lib/auth";
import { createStickyNote, getStickyNotes, isProjectMember } from "@/lib/db/repo";
import { isStickyColor, STICKY_CATEGORIES } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const projectIdParam = url.searchParams.get("projectId");
  const projectId = projectIdParam ? Number(projectIdParam) : null;

  if (projectId) {
    const isMember = isProjectMember(projectId, auth.user.id);
    if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);
    const notes = getStickyNotes(projectId);
    return Response.json({ notes });
  }

  // Personal sticky notes
  const notes = getStickyNotes().filter((n) => n.userId === auth.user.id);
  return Response.json({ notes });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return fail("A sticky note needs some text.");
  if (content.length > 2000) return fail("Keep a sticky note under 2000 characters.");

  if (body.category != null && !STICKY_CATEGORIES.includes(body.category)) return fail("Invalid category.");

  const color = isStickyColor(body.color) ? body.color : "yellow";
  const projectId = body?.projectId ? Number(body.projectId) : null;

  if (projectId) {
    const isMember = isProjectMember(projectId, auth.user.id);
    if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);
    const note = createStickyNote(content, color, body.category ?? null, auth.user.id, projectId);
    return Response.json({ note }, { status: 201 });
  }

  const note = createStickyNote(content, color, body.category ?? null, auth.user.id, null);
  return Response.json({ note }, { status: 201 });
}
