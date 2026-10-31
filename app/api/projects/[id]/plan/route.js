import { MANAGERS, authorize } from "@/lib/auth";
import {
  createProjectActionPlan,
  deleteProjectActionPlan,
  getProject,
  getProjectActionPlan,
  getProjectActionPlanByMonth,
  getProjectActionPlans,
  updateProjectActionPlan,
} from "@/lib/db/repo";
import { fail, idFrom, noContent, readJson } from "@/lib/http";
import { isManager } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get action plans for a project (optionally filtered by ?month=YYYY-MM). */
export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  if (projectId === null || !getProject(projectId)) return fail("Project not found.", 404);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (month) {
    const plan = getProjectActionPlanByMonth(projectId, month);
    return Response.json({ plan });
  }

  const plans = getProjectActionPlans(projectId);
  return Response.json({ plans });
}

/** Managers and Admins create a new monthly plan. */
export async function POST(request, { params }) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  if (projectId === null || !getProject(projectId)) return fail("Project not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const monthYear = typeof body.monthYear === "string" ? body.monthYear.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!monthYear) return fail("A month is required (e.g. 2026-11).");
  if (!title) return fail("A plan title is required.");

  const existing = getProjectActionPlanByMonth(projectId, monthYear);
  if (existing) return fail(`A plan for ${monthYear} already exists for this project.`);

  const plan = createProjectActionPlan({
    projectId,
    monthYear,
    title,
    prepDeadline: body.prepDeadline ?? null,
    execStart: body.execStart ?? null,
    kpis: Array.isArray(body.kpis) ? body.kpis : [],
    sections: Array.isArray(body.sections) ? body.sections : [],
  });

  return Response.json({ plan }, { status: 201 });
}

/** Update plan fields or task status. */
export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  if (projectId === null || !getProject(projectId)) return fail("Project not found.", 404);

  const body = await readJson(request);
  if (!body || !body.planId) return fail("Invalid request.");

  const existing = getProjectActionPlan(body.planId);
  if (!existing || existing.projectId !== projectId) return fail("Plan not found.", 404);

  const canManage = isManager(auth.user);

  const patch = {};

  if (canManage) {
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.prepDeadline !== undefined) patch.prepDeadline = body.prepDeadline;
    if (body.execStart !== undefined) patch.execStart = body.execStart;
    if (body.kpis !== undefined) patch.kpis = body.kpis;
    if (body.sections !== undefined) patch.sections = body.sections;
  } else {
    // Regular team members can update section task statuses
    if (body.sections !== undefined) {
      patch.sections = body.sections;
    } else {
      return fail("Forbidden: Only managers can update plan configuration.", 403);
    }
  }

  const updated = updateProjectActionPlan(body.planId, patch);
  return Response.json({ plan: updated });
}

/** Delete a monthly plan. */
export async function DELETE(request, { params }) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  if (projectId === null || !getProject(projectId)) return fail("Project not found.", 404);

  const { searchParams } = new URL(request.url);
  const planId = Number(searchParams.get("planId"));
  if (!Number.isInteger(planId)) return fail("Invalid plan ID.");

  const existing = getProjectActionPlan(planId);
  if (!existing || existing.projectId !== projectId) return fail("Plan not found.", 404);

  deleteProjectActionPlan(planId);
  return noContent();
}
