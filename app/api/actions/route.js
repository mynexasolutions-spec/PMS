import { authorize } from "@/lib/auth";
import { createActionRequest, getActionRequests } from "@/lib/db/repo";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const view = url.searchParams.get("view"); // "all" for admin or null for user's scope
  const isSuperAdmin = auth.user.role === "admin";
  const actions = view === "all" && isSuperAdmin ? getActionRequests(null) : getActionRequests(auth.user.id);

  return Response.json({ actions }, { headers: noStore });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return fail("Title is required.", 400);

  const assigneeId = Number(body?.assigneeId);
  if (!assigneeId) return fail("Assignee is required.", 400);

  const category = ["credentials", "env", "project_setup", "general"].includes(body?.category)
    ? body.category
    : "general";

  const projectId = body?.projectId ? Number(body.projectId) : null;
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const dueDate = typeof body?.dueDate === "string" ? body.dueDate : null;

  const action = createActionRequest({
    title,
    description,
    category,
    projectId,
    assigneeId,
    createdBy: auth.user.id,
    dueDate,
  });

  return Response.json({ action }, { status: 201, headers: noStore });
}
