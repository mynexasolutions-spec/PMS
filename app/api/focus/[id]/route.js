import { authorize } from "@/lib/auth";
import { deleteFocusItem, getFocusItem, updateFocusItem } from "@/lib/db/repo";
import { fail, idFrom, noContent, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getFocusItem(id)) return fail("Focus item not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  if (body.title !== undefined && !title) return fail("A focus item needs some text.");
  if (body.done !== undefined && typeof body.done !== "boolean") return fail("Invalid value.");

  return Response.json({ item: updateFocusItem(id, { done: body.done, title }) });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid focus item id.");
  return deleteFocusItem(id) ? noContent() : fail("Focus item not found.", 404);
}
