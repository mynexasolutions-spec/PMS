// API for Project Calendar custom events (meetings, milestones, releases, deadlines)
import { authorize } from "@/lib/auth";
import { createProjectEvent, deleteProjectEvent, getProject, getProjectEvents, isProjectAdmin, isProjectMember } from "@/lib/db/repo";
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

  const isMember = isProjectMember(projectId, auth.user.id);
  if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);

  const events = getProjectEvents(projectId);
  return Response.json({ events }, { headers: noStore });
}

export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  const isMember = isProjectMember(projectId, auth.user.id);
  if (!isMember) return fail("Forbidden: You are not a member of this project.", 403);

  const body = await readJson(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return fail("Event title is required.", 400);

  const eventDate = typeof body?.eventDate === "string" ? body.eventDate : "";
  if (!eventDate) return fail("Event date is required.", 400);

  const type = ["meeting", "milestone", "release", "deadline"].includes(body?.type) ? body.type : "meeting";
  const eventTime = typeof body?.eventTime === "string" && body.eventTime ? body.eventTime : null;

  const event = createProjectEvent({
    projectId,
    title,
    type,
    eventDate,
    eventTime,
    createdBy: auth.user.id,
  });

  return Response.json({ event }, { status: 201, headers: noStore });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  const url = new URL(request.url);
  const eventId = Number(url.searchParams.get("eventId"));
  if (!eventId) return fail("Event ID required.", 400);

  const isMember = isProjectMember(projectId, auth.user.id);
  if (!isMember) return fail("Forbidden.", 403);

  deleteProjectEvent(eventId, projectId);
  return Response.json({ success: true, deletedId: eventId }, { headers: noStore });
}
