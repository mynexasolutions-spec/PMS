import { authorize } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSecret, getAllVaultSecrets, getProject, listSecrets } from "@/lib/db/repo";
import { fail, readJson } from "@/lib/http";
import { encryptSecret } from "@/lib/vault";
import { cleanSecretData, validLabel } from "@/lib/secret-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const secrets = getAllVaultSecrets(auth.user.id);
  return Response.json({ secrets }, { headers: noStore });
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  const projectId = Number(body.projectId);
  const project = projectId ? getProject(projectId) : null;
  if (!project) return fail("Please select a valid project.", 404);
  if (!can.viewVault(auth.user, project)) return fail("You do not have permission to store credentials for this project.", 403);

  const label = validLabel(body.label);
  if (!label) return fail("Give it a name or label (up to 80 characters).");
  const kind = body.kind === "credential" ? "credential" : "env";
  const data = cleanSecretData(kind, body.data);
  if (!data.ok) return fail(data.error);

  const id = createSecret({
    projectId,
    kind,
    label,
    payload: encryptSecret(data.value),
    userId: auth.user.id,
  });

  const all = getAllVaultSecrets(auth.user.id);
  const secret = all.find((s) => s.id === id);
  return Response.json({ secret }, { status: 201, headers: noStore });
}
