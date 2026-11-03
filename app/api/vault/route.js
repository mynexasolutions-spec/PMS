import { authorize } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createProject, createSecret, getAllVaultSecrets, getProject, getProjects } from "@/lib/db/repo";
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

  let projectId = Number(body.projectId);
  let project = projectId ? getProject(projectId) : null;

  // If no personal vault container was selected, find or create the user's default personal container
  if (!project) {
    const myContainers = getProjects().filter((p) => p.isVaultOnly && p.createdBy === auth.user.id);
    if (myContainers.length > 0) {
      project = myContainers[0];
      projectId = project.id;
    } else {
      const baseName = `Personal Vault (${auth.user.name})`;
      try {
        project = createProject(baseName, "#2e9e4f", "Personal credentials container", "account_setup", auth.user.id, auth.user.id, 1);
      } catch {
        project = createProject(`Personal Vault #${auth.user.id}`, "#2e9e4f", "Personal credentials container", "account_setup", auth.user.id, auth.user.id, 1);
      }
      projectId = project.id;
    }
  }

  if (!project || !project.isVaultOnly || project.createdBy !== auth.user.id) {
    return fail("You do not have permission to store personal credentials in this container.", 403);
  }

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
  return Response.json({ secret, project }, { status: 201, headers: noStore });
}
