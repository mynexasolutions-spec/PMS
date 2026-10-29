import { authorize } from "@/lib/auth";
import { deleteTask, getTask, updateTask } from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/constants";
import { fail, idFrom, noContent, readJson } from "@/lib/http";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isInt = (value) => value === null || Number.isInteger(value);
const isText = (value) => value === null || typeof value === "string";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getTask(id)) return fail("Task not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  if (body.title !== undefined && !(typeof body.title === "string" && body.title.trim())) return fail("A title is required.");
  if (body.type !== undefined && !TASK_TYPES.includes(body.type)) return fail("Invalid task type.");
  if (body.status !== undefined && !TASK_STATUSES.includes(body.status)) return fail("Invalid status.");
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) return fail("Invalid priority.");
  if (body.projectId !== undefined && !Number.isInteger(body.projectId)) return fail("Invalid project.");
  if (body.parentId !== undefined && !isInt(body.parentId)) return fail("Invalid parent task.");
  if (body.position !== undefined && !Number.isInteger(body.position)) return fail("Invalid position.");
  if (body.dueAt !== undefined && !isText(body.dueAt)) return fail("Invalid due date.");
  if (body.assigneeId != null && !(Number.isInteger(body.assigneeId) && getUser(body.assigneeId)?.active)) return fail("Choose an active team member to assign this to.");

  const task = updateTask(id, body);
  if (!task) return fail("No valid fields supplied.");
  return Response.json({ task });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid task id.");
  const task = getTask(id);
  if (!task) return fail("Task not found.", 404);
  if (!can.deleteTask(auth.user, task)) return fail("Only the person who created a task, or a manager, can delete it.", 403);

  deleteTask(id);
  return noContent();
}
