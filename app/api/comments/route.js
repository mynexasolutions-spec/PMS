import { authorize } from "@/lib/auth";
import { DATE_RE } from "@/lib/constants";
import { createComment, getComments, getCommentCounts, getTask, getTodo } from "@/lib/db/repo";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCOPES = ["task", "todo", "day"];
const MAX_COMMENT = 1000;

// A comment must point at something real: an existing task/to-do, or a calendar day.
function validRef(scope, ref) {
  if (scope === "day") return DATE_RE.test(ref);
  if (!/^\d+$/.test(ref)) return false;
  return Boolean(scope === "task" ? getTask(Number(ref)) : getTodo(Number(ref)));
}

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "";
  const ref = url.searchParams.get("ref") ?? "";
  if (!SCOPES.includes(scope) || !validRef(scope, ref)) return fail("Unknown thread.", 404);
  return Response.json({ comments: getComments(scope, ref) });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const scope = body?.scope;
  const ref = String(body?.ref ?? "");
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!SCOPES.includes(scope) || !validRef(scope, ref)) return fail("Unknown thread.", 404);
  if (!text) return fail("Write a comment first.");
  if (text.length > MAX_COMMENT) return fail(`Keep a comment under ${MAX_COMMENT} characters.`);

  const comment = createComment({ scope, ref, authorId: auth.user.id, body: text });
  return Response.json({ comment, count: getCommentCounts()[`${scope}:${ref}`] ?? 1 }, { status: 201 });
}
