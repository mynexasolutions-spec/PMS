import { authorize } from "@/lib/auth";
import { deleteTodo, getTodo, updateTodo } from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { DATE_RE, PRIORITIES, TODO_STATUSES } from "@/lib/constants";
import { fail, idFrom, noContent, readJson } from "@/lib/http";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid to-do id.");
  const existingTodo = getTodo(id);
  if (!existingTodo) return fail("To-do not found.", 404);

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";
  if (!isManager && existingTodo.assigneeId !== auth.user.id && existingTodo.createdBy !== auth.user.id) {
    return fail("You can only update your own to-dos.", 403);
  }

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  if (!isManager && body.assigneeId !== undefined && body.assigneeId !== auth.user.id) {
    return fail("Team members cannot reassign to-dos to other users.", 403);
  }
  if (!body) return fail("Invalid request.");

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  if (body.title !== undefined && !title) return fail("A to-do title is required.");
  if (body.status !== undefined && !TODO_STATUSES.includes(body.status)) return fail("Invalid status.");
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) return fail("Invalid priority.");
  if (body.todoDate !== undefined && !DATE_RE.test(body.todoDate)) return fail("Invalid date.");
  if (body.projectId != null && !Number.isInteger(body.projectId)) return fail("Invalid project.");
  if (body.assigneeId != null && !(Number.isInteger(body.assigneeId) && getUser(body.assigneeId)?.active)) return fail("Choose an active team member to assign this to.");

  const todo = updateTodo(id, { ...body, title });
  return Response.json({ todo });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid to-do id.");
  const todo = getTodo(id);
  if (!todo) return fail("To-do not found.", 404);
  if (!can.deleteTodo(auth.user, todo)) return fail("Only the person who created a to-do, or a manager, can delete it.", 403);

  deleteTodo(id);
  return noContent();
}
