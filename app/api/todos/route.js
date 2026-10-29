import { authorize } from "@/lib/auth";
import { createTodo, getTodos } from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { DATE_RE, PRIORITIES, TIME_RE, TODO_STATUSES } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  return Response.json({ todos: getTodos() });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return fail("A to-do title is required.");
  if (!PRIORITIES.includes(body.priority)) return fail("Invalid priority.");
  const status = body.status ?? "todo";
  if (!TODO_STATUSES.includes(status)) return fail("Invalid status.");
  if (body.projectId != null && !Number.isInteger(body.projectId)) return fail("Invalid project.");
  if (!DATE_RE.test(body.todoDate ?? "")) return fail("A valid date is required.");
  if (body.assigneeId != null && !(Number.isInteger(body.assigneeId) && getUser(body.assigneeId)?.active)) return fail("Choose an active team member to assign this to.");

  const startTime = body.startTime || null;
  const endTime = body.endTime || null;
  if ((startTime && !TIME_RE.test(startTime)) || (endTime && !TIME_RE.test(endTime))) return fail("Invalid time.");

  try {
    const todo = createTodo({
      title,
      priority: body.priority,
      startTime,
      endTime,
      todoDate: body.todoDate,
      status,
      projectId: body.projectId ?? null,
      assigneeId: body.assigneeId ?? null,
      createdBy: auth.user.id,
    });
    return Response.json({ todo }, { status: 201 });
  } catch (error) {
    console.error(error);
    return fail("Unable to create to-do.", 500);
  }
}
