import { authorize } from "@/lib/auth";
import { getPendingProjectInvites } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const invites = getPendingProjectInvites(auth.user.id);
  return Response.json({ invites });
}
