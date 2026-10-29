import { MANAGERS, authorize } from "@/lib/auth";
import { createSecret, getProject, listSecrets } from "@/lib/db/repo";
import { fail, idFrom, readJson } from "@/lib/http";
import { encryptSecret } from "@/lib/vault";
import { cleanSecretData, validLabel } from "@/lib/secret-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** The list of a project's secrets (labels and who touched them), never their contents. Managers and admins only. */
export async function GET(request, { params }) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getProject(id)) return fail("Project not found.", 404);
  return Response.json({ secrets: listSecrets(id) }, { headers: noStore });
}

export async function POST(request, { params }) {
  const auth = await authorize(request, MANAGERS);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  if (projectId === null || !getProject(projectId)) return fail("Project not found.", 404);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");
  const label = validLabel(body.label);
  if (!label) return fail("Give it a name (up to 80 characters).");
  const data = cleanSecretData(body.kind, body.data);
  if (!data.ok) return fail(data.error);

  const id = createSecret({ projectId, kind: body.kind, label, payload: encryptSecret(data.value), userId: auth.user.id });
  return Response.json({ secret: listSecrets(projectId).find((secret) => secret.id === id) }, { status: 201, headers: noStore });
}
