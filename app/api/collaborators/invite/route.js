import { authorize } from "@/lib/auth";
import { createNotification, sendCollaboratorInvite } from "@/lib/db/repo";
import { getUserByEmail } from "@/lib/db/users";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const email = body?.email ? String(body.email).trim().toLowerCase() : "";

  if (!email) {
    return fail("Please enter an email address.", 400);
  }

  // Check if target user exists
  const targetUser = getUserByEmail(email);
  if (!targetUser) {
    return fail("No account found with this email. Please check the spelling or ask them to register.", 404);
  }

  if (targetUser.id === auth.user.id) {
    return fail("You cannot add yourself as a collaborator.", 400);
  }

  if (!targetUser.active) {
    return fail("This account is currently inactive.", 400);
  }

  try {
    const result = sendCollaboratorInvite(auth.user.id, targetUser.id);

    if (result.autoAccepted) {
      // Both users wanted to connect
      createNotification({
        userId: targetUser.id,
        title: "Collaborator Connected",
        message: `${auth.user.name} accepted your collaborator request. You are now connected!`,
        link: "/collaborators",
        type: "general",
      });
      return Response.json({
        success: true,
        status: "accepted",
        message: `You are now connected with ${targetUser.name}!`,
        user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
      });
    }

    // Send notification to target user
    createNotification({
      userId: targetUser.id,
      title: "Collaborator Request",
      message: `${auth.user.name} wants to connect with you as a collaborator.`,
      link: "/collaborators",
      type: "collaborator_invite",
      metadata: {
        connectionId: result.connectionId,
        fromUserId: auth.user.id,
        fromUserName: auth.user.name,
      },
    });

    return Response.json({
      success: true,
      status: "pending",
      message: `Invitation sent to ${targetUser.name}.`,
      user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
    });
  } catch (err) {
    return fail(err.message || "Failed to send invitation.", 400);
  }
}
