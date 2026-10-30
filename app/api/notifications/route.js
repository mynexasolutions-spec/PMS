import { authorize } from "@/lib/auth";
import { getNotifications, markAllNotificationsRead } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  return Response.json({ notifications: getNotifications(auth.user.id) });
}

export async function PATCH(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  markAllNotificationsRead(auth.user.id);
  return Response.json({ success: true, notifications: getNotifications(auth.user.id) });
}
