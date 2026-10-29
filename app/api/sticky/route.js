import { authorize } from "@/lib/auth";
import { createStickyNote, getStickyNotes } from "@/lib/db/repo";
import { isStickyColor, STICKY_CATEGORIES } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  return Response.json({ notes: getStickyNotes() });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return fail("A sticky note needs some text.");
  if (content.length > 500) return fail("Keep a sticky note under 500 characters.");

  if (body.category != null && !STICKY_CATEGORIES.includes(body.category)) return fail("Invalid category.");

  const color = isStickyColor(body.color) ? body.color : "yellow";
  return Response.json({ note: createStickyNote(content, color, body.category ?? null) }, { status: 201 });
}
