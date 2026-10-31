import { authorize } from "@/lib/auth";
import { createNotification, createTask, getTasks } from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  return Response.json({ tasks: getTasks() });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return fail("A title is required.");
  if (!TASK_TYPES.includes(body.type)) return fail("Invalid task type.");
  if (!TASK_STATUSES.includes(body.status)) return fail("Invalid task status.");
  if (!PRIORITIES.includes(body.priority)) return fail("Invalid priority.");
  if (!Number.isInteger(body.projectId)) return fail("A project is required.");
  if (body.parentId != null && !Number.isInteger(body.parentId)) return fail("Invalid parent task.");
  // Anyone can assign a task to anyone on the team (only active team members, though).
  if (body.assigneeId != null && !(Number.isInteger(body.assigneeId) && getUser(body.assigneeId)?.active)) return fail("Choose an active team member to assign this to.");

  try {
    const task = createTask({
      title,
      type: body.type,
      status: body.status,
      priority: body.priority,
      projectId: body.projectId,
      parentId: body.parentId ?? null,
      assigneeId: body.assigneeId ?? null,
      createdBy: auth.user.id,
      dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
      estimateHours: Number(body.estimateHours) >= 0 ? Number(body.estimateHours) : 0,
      loggedHours: Number(body.loggedHours) >= 0 ? Number(body.loggedHours) : 0,
      blockerReason: typeof body.blockerReason === "string" ? body.blockerReason.trim() : null,
    });
    if (body.assigneeId) {
      try {
        createNotification({
          userId: Number(body.assigneeId),
          title: "New Task Assigned",
          message: `${auth.user.name} assigned you to task "${task.issueKey}: ${task.title}"`,
          link: `/projects/${task.projectId}`,
        });
      } catch (err) {
        console.error("Failed to create notification:", err);
      }
    }
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error(error);
    return fail("Unable to create task.", 500);
  }
}
