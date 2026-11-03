import { authorize } from "@/lib/auth";
import { getProject, getProjectUnreadChatCount, markProjectChatRead } from "@/lib/db/repo";
import { fail, idFrom } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  const isMember =
    (project.members || []).some((m) => m.userId === auth.user.id && m.status !== "pending") ||
    project.createdBy === auth.user.id;
  if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);

  const unreadCount = getProjectUnreadChatCount(projectId, auth.user.id);
  return Response.json({ unreadCount }, { headers: noStore });
}

export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  const isMember =
    (project.members || []).some((m) => m.userId === auth.user.id && m.status !== "pending") ||
    project.createdBy === auth.user.id;
  if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);

  markProjectChatRead(projectId, auth.user.id);
  return Response.json({ success: true, unreadCount: 0 }, { headers: noStore });
}
