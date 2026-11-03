import { authorize } from "@/lib/auth";
import { getCollaborators, getCollaboratorRequests } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const collaborators = getCollaborators(auth.user.id);
  const requests = getCollaboratorRequests(auth.user.id);

  return Response.json({
    collaborators,
    requests,
  });
}
