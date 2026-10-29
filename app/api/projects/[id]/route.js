import { MANAGERS, authorize } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/db/repo";
import { isStage } from "@/lib/constants";
import { fail, idFrom, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Free-text project details and how long each may be. Empty text clears the field.
const DETAIL_FIELDS = {
  clientName: 80,
  repoUrl: 200,
  stagingUrl: 200,
  liveUrl: 200,
  hosting: 200,
  techStack: 200,
  notes: 2000,
};
const URL_FIELDS = new Set(["repoUrl", "stagingUrl", "liveUrl"]);

const isWebUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** Managers and admins update a project's stage, name, description, colour and details. */
export async function PATCH(request, { params }) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getProject(id)) return fail("Project not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const patch = {};
  if (body.stage !== undefined) {
    if (!isStage(body.stage)) return fail("Invalid project stage.");
    patch.stage = body.stage;
  }
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("A project name is required.");
    if (name.length > 50) return fail("Keep the project name under 50 characters.");
    patch.name = name;
  }
  if (body.description !== undefined) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length > 80) return fail("Keep the description under 80 characters.");
    patch.description = description || null;
  }
  if (body.color !== undefined) {
    if (!/^#[0-9a-f]{6}$/i.test(body.color ?? "")) return fail("Invalid colour.");
    patch.color = body.color;
  }
  for (const [field, max] of Object.entries(DETAIL_FIELDS)) {
    if (body[field] === undefined) continue;
    const value = typeof body[field] === "string" ? body[field].trim() : null;
    if (value === null || value.length > max) return fail(`Keep "${field}" under ${max} characters.`);
    if (value && URL_FIELDS.has(field) && !isWebUrl(value)) return fail("Links must start with http:// or https://.");
    patch[field] = value || null;
  }

  try {
    const project = updateProject(id, patch);
    if (!project) return fail("No valid fields supplied.");
    return Response.json({ project });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return fail("A project with that name already exists.", 409);
    console.error(error);
    return fail("Unable to update project.", 500);
  }
}
