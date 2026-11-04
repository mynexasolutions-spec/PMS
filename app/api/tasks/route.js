import { authorize } from "@/lib/auth";
import { createNotification, createTask, getProjects, getTasks } from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const allProjects = getProjects();
  const myProjectIds = new Set(
    allProjects
      .filter((p) => (p.members || []).some((m) => m.userId === auth.user.id) || p.createdBy === auth.user.id)
      .map((p) => p.id),
  );

  const tasks = getTasks().filter((t) =>
    t.projectId == null
      ? t.createdBy === auth.user.id || t.assigneeId === auth.user.id
      : myProjectIds.has(t.projectId),
  );
  return Response.json({ tasks });
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
  if (body.projectId != null && !Number.isInteger(body.projectId)) return fail("Invalid project.");
  if (body.parentId != null && !Number.isInteger(body.parentId)) return fail("Invalid parent task.");
  // Anyone can assign a task to anyone on the team (only active team members, though).
  if (body.assigneeId != null && !(Number.isInteger(body.assigneeId) && getUser(body.assigneeId)?.active)) return fail("Choose an active team member to assign this to.");

  const projectId = body.projectId ?? null;
  const assigneeId = projectId == null ? (body.assigneeId ?? auth.user.id) : (body.assigneeId ?? null);

  try {
    const task = createTask({
      title,
      category: typeof body.category === "string" ? body.category.trim() || null : null,
      type: body.type,
      status: body.status,
      priority: body.priority,
      projectId,
      parentId: body.parentId ?? null,
      assigneeId,
      createdBy: auth.user.id,
      startDate: typeof body.startDate === "string" ? body.startDate : null,
      dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
      estimateHours: Number(body.estimateHours) >= 0 ? Number(body.estimateHours) : 0,
      loggedHours: Number(body.loggedHours) >= 0 ? Number(body.loggedHours) : 0,
      blockerReason: typeof body.blockerReason === "string" ? body.blockerReason.trim() : null,
    });
    if (assigneeId && Number(assigneeId) !== auth.user.id) {
      try {
        createNotification({
          userId: Number(assigneeId),
          title: "New Task Assigned",
          message: `${auth.user.name} assigned you to task "${task.issueKey}: ${task.title}"`,
          link: task.projectId ? `/projects/${task.projectId}` : "/",
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
