import { authorize } from "@/lib/auth";
import { carryOverTodos, getTodos } from "@/lib/db/repo";
import { DATE_RE } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Moves every unfinished to-do from one day to another (the end-of-day carry-over). */
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!DATE_RE.test(body?.from ?? "") || !DATE_RE.test(body?.to ?? "")) return fail("Valid dates are required.");

  const isManager = auth.user.role === "admin" || auth.user.role === "manager";
  const userId = isManager ? null : auth.user.id;
  const moved = carryOverTodos(body.from, body.to, userId);
  return Response.json({ moved, todos: getTodos() });
}
