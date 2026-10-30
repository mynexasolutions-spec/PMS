import { authorize } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSecret, getProject, listSecrets } from "@/lib/db/repo";
import { fail, idFrom, readJson } from "@/lib/http";
import { encryptSecret } from "@/lib/vault";
import { cleanSecretData, validLabel } from "@/lib/secret-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** The list of a project's secrets (labels and who touched them), never their contents. Managers and admins only. */
export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const project = id === null ? null : getProject(id);
  if (!project) return fail("Project not found.", 404);
  if (!can.viewVault(auth.user, project)) return fail("Forbidden.", 403);
  return Response.json({ secrets: listSecrets(id) }, { headers: noStore });
}

export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId === null ? null : getProject(projectId);
  if (!project) return fail("Project not found.", 404);
  if (!can.viewVault(auth.user, project)) return fail("Forbidden.", 403);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  const label = validLabel(body.label);
  if (!label) return fail("Give it a name (up to 80 characters).");
  const data = cleanSecretData(body.kind, body.data);
  if (!data.ok) return fail(data.error);

  const id = createSecret({ projectId, kind: body.kind, label, payload: encryptSecret(data.value), userId: auth.user.id });
  return Response.json({ secret: listSecrets(projectId).find((secret) => secret.id === id) }, { status: 201, headers: noStore });
}
