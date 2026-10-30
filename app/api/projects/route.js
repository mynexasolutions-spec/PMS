import { MANAGERS, authorize } from "@/lib/auth";
import { createNotification, createProject, getProjects } from "@/lib/db/repo";
import { DEFAULT_STAGE, isStage } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  const all = getProjects();
  const projects = auth.user.role === "member" ? all.filter((p) => p.assigneeId === auth.user.id) : all;
  return Response.json({ projects });
}

/** Managers and admins create projects. */
export async function POST(request) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return fail("A project name is required.");
  if (name.length > 50) return fail("Keep the project name under 50 characters.");

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 80) return fail("Keep the description under 80 characters.");
  if (body.stage !== undefined && !isStage(body.stage)) return fail("Invalid project stage.");

  const color = /^#[0-9a-f]{6}$/i.test(body.color ?? "") ? body.color : "#4e8447";
  const assigneeId = body.assigneeId != null ? Number(body.assigneeId) : null;
  try {
    const project = createProject(name, color, description || null, body.stage ?? DEFAULT_STAGE, assigneeId);
    if (assigneeId) {
      try {
        createNotification({
          userId: assigneeId,
          title: "New Project Assigned",
          message: `${auth.user.name} assigned you to project "${project.name}"`,
          link: `/projects/${project.id}`,
        });
      } catch (err) {
        console.error("Failed to create notification:", err);
      }
    }
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return fail("A project with that name already exists.", 409);
    }
    console.error(error);
    return fail("Unable to create project.", 500);
  }
}
