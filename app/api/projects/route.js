import { authorize } from "@/lib/auth";
import { createNotification, createProject, getProjects } from "@/lib/db/repo";
import { DEFAULT_STAGE, isStage } from "@/lib/constants";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const includeVault = url.searchParams.get("includeVault") === "true";
  const vaultOnly = url.searchParams.get("vaultOnly") === "true";

  const all = getProjects();
  if (vaultOnly) {
    return Response.json({ projects: all.filter((p) => p.isVaultOnly) });
  }

  const accessible = all.filter(
    (p) =>
      p.isVaultOnly ||
      (p.members || []).some((m) => m.userId === auth.user.id && m.status !== "pending") ||
      p.createdBy === auth.user.id
  );
  const projects = includeVault ? accessible : accessible.filter((p) => !p.isVaultOnly);

  return Response.json({ projects });
}

/** Any registered user can create projects. They become Project Admin. */
export async function POST(request) {
  const auth = await authorize(request);
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
  const isVaultOnly = body.isVaultOnly ? 1 : 0;

  try {
    const project = createProject(name, color, description || null, body.stage ?? DEFAULT_STAGE, assigneeId, auth.user.id, isVaultOnly);
    if (assigneeId && assigneeId !== auth.user.id && !isVaultOnly) {
      try {
        createNotification({
          userId: assigneeId,
          title: "New Project Assigned",
          message: `${auth.user.name} added you to project "${project.name}"`,
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
