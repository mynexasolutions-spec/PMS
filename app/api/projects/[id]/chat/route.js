import { authorize } from "@/lib/auth";
import {
  createProjectMessage,
  deleteProjectMessage,
  getProject,
  getProjectMessages,
  getProjectUnreadChatCount,
  hideProjectMessageForUser,
  isProjectAdmin,
  markProjectChatRead,
} from "@/lib/db/repo";
import { fail, idFrom, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  // Only project members (accepted) can read messages
  const isMember =
    (project.members || []).some((m) => m.userId === auth.user.id && m.status !== "pending") ||
    project.createdBy === auth.user.id;
  if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);

  const url = new URL(request.url);
  const shouldMarkRead = url.searchParams.get("markRead") === "1" || url.searchParams.get("markRead") === "true";
  if (shouldMarkRead) {
    markProjectChatRead(projectId, auth.user.id);
  }

  // Filter messages hiding those "deleted for me" by this user
  const messages = getProjectMessages(projectId, auth.user.id);
  const unreadCount = getProjectUnreadChatCount(projectId, auth.user.id);
  return Response.json({ messages, unreadCount }, { headers: noStore });
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

  const body = await readJson(request);
  const text = typeof body?.message === "string" ? body.message.trim() : "";
  if (!text) return fail("Message cannot be empty.", 400);
  if (text.length > 2000) return fail("Message too long (max 2000 characters).", 400);

  const message = createProjectMessage(projectId, auth.user.id, text);
  if (message?.id) {
    markProjectChatRead(projectId, auth.user.id, message.id);
  }
  return Response.json({ message }, { status: 201, headers: noStore });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  const url = new URL(request.url);
  const messageId = Number(url.searchParams.get("messageId"));
  const mode = url.searchParams.get("mode") || "everyone"; // "me" | "everyone"
  if (!messageId) return fail("Message ID required.", 400);

  const isAdmin = isProjectAdmin(projectId, auth.user.id);
  const messages = getProjectMessages(projectId);
  const target = messages.find((m) => m.id === messageId);

  if (!target) return fail("Message not found.", 404);

  // 1. Delete for Me: any project member can hide a message for themselves
  if (mode === "me") {
    hideProjectMessageForUser(messageId, auth.user.id);
    return Response.json({ success: true, mode: "me", deletedId: messageId }, { headers: noStore });
  }

  // 2. Delete for Everyone: author OR project admin only
  if (target.userId !== auth.user.id && !isAdmin) {
    return fail("Forbidden: Only the message author or a Project Admin can delete this message for everyone.", 403);
  }

  deleteProjectMessage(messageId, projectId);
  return Response.json({ success: true, mode: "everyone", deletedId: messageId }, { headers: noStore });
}
