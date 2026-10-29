import { authorize } from "@/lib/auth";
import { createFocusItem, getFocusItems } from "@/lib/db/repo";
import { DATE_RE } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  return Response.json({ items: getFocusItems() });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return fail("A focus item needs some text.");
  if (!DATE_RE.test(body.focusDate ?? "")) return fail("A valid date is required.");

  return Response.json({ item: createFocusItem(title, body.focusDate) }, { status: 201 });
}
