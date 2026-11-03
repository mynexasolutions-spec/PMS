import { authorize } from "@/lib/auth";
import {
  acceptCollaboratorInvite,
  cancelOutgoingCollaboratorInvite,
  createNotification,
  declineCollaboratorInvite,
  markNotificationRead,
} from "@/lib/db/repo";
import { getUser } from "@/lib/db/users";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const connectionId = Number(body?.connectionId);
  const notificationId = body?.notificationId ? Number(body.notificationId) : null;
  const action = body?.action; // "accept", "decline", or "cancel"

  if (!connectionId) {
    return fail("Connection ID is required.", 400);
  }

  if (!["accept", "decline", "cancel"].includes(action)) {
    return fail("Invalid action specified.", 400);
  }

  try {
    if (action === "accept") {
      const conn = acceptCollaboratorInvite(connectionId, auth.user.id);
      if (notificationId) {
        markNotificationRead(notificationId, auth.user.id);
      }

      // Notify the sender
      if (conn.fromUserId) {
        const inviter = getUser(conn.fromUserId);
        createNotification({
          userId: conn.fromUserId,
          title: "Collaborator Connected",
          message: `${auth.user.name} accepted your collaborator request. You are now connected!`,
          link: "/collaborators",
          type: "general",
        });
      }

      return Response.json({
        success: true,
        action: "accept",
        message: "Collaborator request accepted.",
      });
    }

    if (action === "decline") {
      declineCollaboratorInvite(connectionId, auth.user.id);
      if (notificationId) {
        markNotificationRead(notificationId, auth.user.id);
      }

      return Response.json({
        success: true,
        action: "decline",
        message: "Collaborator request declined.",
      });
    }

    if (action === "cancel") {
      cancelOutgoingCollaboratorInvite(connectionId, auth.user.id);
      return Response.json({
        success: true,
        action: "cancel",
        message: "Invitation cancelled.",
      });
    }
  } catch (err) {
    return fail(err.message || "Failed to process request.", 400);
  }
}
