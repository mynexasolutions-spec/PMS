import { authorize } from "@/lib/auth";
import { getNotifications, markNotificationRead } from "@/lib/db/repo";
import { fail, idFrom } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null) return fail("Invalid notification id.");

  markNotificationRead(id, auth.user.id);
  return Response.json({ success: true, notifications: getNotifications(auth.user.id) });
}
