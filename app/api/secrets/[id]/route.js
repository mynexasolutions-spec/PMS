import { authorize } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { deleteSecret, getProject, getSecretRow, listSecrets, logSecretAccess, updateSecret } from "@/lib/db/repo";
import { fail, idFrom, noContent, readJson } from "@/lib/http";
import { decryptSecret, encryptSecret } from "@/lib/vault";
import { cleanSecretData, validLabel } from "@/lib/secret-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Opens a secret: decrypts it and records who looked. Managers and admins only. */
export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const row = id === null ? null : getSecretRow(id);
  if (!row) return fail("Not found.", 404);

  const project = getProject(row.projectId);
  if (!can.viewVault(auth.user, project)) return fail("Forbidden.", 403);

  let data;
  try {
    data = decryptSecret(row.payload);
  } catch {
    return fail("This secret can't be decrypted. Is the vault key the same one it was saved with?", 500);
  }
  logSecretAccess(id, auth.user.id, "view");
  return Response.json({ secret: { id, kind: row.kind, label: row.label, projectId: row.projectId, data } }, { headers: noStore });
}

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const row = id === null ? null : getSecretRow(id);
  if (!row) return fail("Not found.", 404);

  const project = getProject(row.projectId);
  if (!can.viewVault(auth.user, project)) return fail("Forbidden.", 403);

  const body = await readJson(request);
  if (!body) return fail("Invalid request.");

  let label;
  if (body.label !== undefined) {
    label = validLabel(body.label);
    if (!label) return fail("Give it a name (up to 80 characters).");
  }
  let payload;
  if (body.data !== undefined) {
    const data = cleanSecretData(row.kind, body.data);
    if (!data.ok) return fail(data.error);
    payload = encryptSecret(data.value);
  }

  updateSecret(id, { label, payload, userId: auth.user.id });
  return Response.json({ secret: listSecrets(row.projectId).find((secret) => secret.id === id) }, { headers: noStore });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  const row = id === null ? null : getSecretRow(id);
  if (!row) return fail("Not found.", 404);
  const project = getProject(row.projectId);
  if (!can.viewVault(auth.user, project)) return fail("Forbidden.", 403);
  return deleteSecret(id) ? noContent() : fail("Not found.", 404);
}
