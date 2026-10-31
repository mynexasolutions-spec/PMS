import { authorize } from "@/lib/auth";
import { acceptProjectInvite, createNotification, declineProjectInvite, getProject, markNotificationRead } from "@/lib/db/repo";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const projectId = Number(body?.projectId);
  const notificationId = Number(body?.notificationId);
  const action = body?.action === "accept" ? "accept" : "decline";

  if (!projectId) return fail("Project ID is required.", 400);

  const project = getProject(projectId);
  if (!project) return fail("Project not found.", 404);

  if (action === "accept") {
    acceptProjectInvite(projectId, auth.user.id);
    if (notificationId) {
      markNotificationRead(notificationId, auth.user.id);
    }

    // Notify project creator / admins if different user
    if (project.createdBy && project.createdBy !== auth.user.id) {
      try {
        createNotification({
          userId: project.createdBy,
          title: "Invitation Accepted",
          message: `${auth.user.name} accepted your invitation to join "${project.name}"`,
          link: `/projects/${projectId}?tab=team`,
        });
      } catch (err) {
        console.error("Failed to notify admin of accept:", err);
      }
    }

    return Response.json({
      success: true,
      accepted: true,
      projectId,
      projectName: project.name,
    });
  } else {
    declineProjectInvite(projectId, auth.user.id);
    if (notificationId) {
      markNotificationRead(notificationId, auth.user.id);
    }

    if (project.createdBy && project.createdBy !== auth.user.id) {
      try {
        createNotification({
          userId: project.createdBy,
          title: "Invitation Declined",
          message: `${auth.user.name} declined the invitation to join "${project.name}"`,
          link: `/projects/${projectId}?tab=team`,
        });
      } catch (err) {
        console.error("Failed to notify admin of decline:", err);
      }
    }

    return Response.json({
      success: true,
      accepted: false,
      projectId,
      projectName: project.name,
    });
  }
}
