import { authorize } from "@/lib/auth";
import { addProjectMember, createNotification, getProject, getProjectMembers, inviteProjectMember, isProjectAdmin, removeProjectMember, updateProjectMemberRole } from "@/lib/db/repo";
import { getUser, getUserByEmail } from "@/lib/db/users";
import { fail, idFrom, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const id = await idFrom(params);
  if (id === null || !getProject(id)) return fail("Project not found.", 404);

  const members = getProjectMembers(id);
  return Response.json({ members });
}

export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  if (!isProjectAdmin(projectId, auth.user.id)) {
    return fail("Only a Project Admin can add members.", 403);
  }

  const body = await readJson(request);
  let userId = body?.userId ? Number(body.userId) : null;
  const email = body?.email ? String(body.email).trim().toLowerCase() : "";
  const role = body?.role === "admin" ? "admin" : "member";

  if (!userId && email) {
    const targetUser = getUserByEmail(email);
    if (!targetUser) {
      return fail("No registered account found with this email.", 404);
    }
    userId = targetUser.id;
  }

  if (!userId || !getUser(userId)) {
    return fail("Please choose a valid collaborator or enter a registered email.", 400);
  }

  // Check if user is already a member or pending invite
  const currentMembers = getProjectMembers(projectId);
  if (currentMembers.some((m) => m.userId === userId)) {
    return fail("This user is already a member (or has a pending invitation) in this project.", 400);
  }

  const members = inviteProjectMember(projectId, userId, role);

  try {
    createNotification({
      userId,
      title: "Project Invitation",
      message: `${auth.user.name} invited you to join "${project.name}" as ${role === "admin" ? "Project Admin" : "Team Member"}`,
      link: `/projects/${projectId}`,
      type: "project_invite",
      metadata: {
        projectId,
        projectName: project.name,
        role,
        inviterName: auth.user.name,
      },
    });
  } catch (err) {
    console.error("Failed to notify user:", err);
  }

  return Response.json({ members });
}

export async function PATCH(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  if (!isProjectAdmin(projectId, auth.user.id)) {
    return fail("Only a Project Admin can change member roles.", 403);
  }

  const body = await readJson(request);
  const userId = Number(body?.userId);
  const role = body?.role === "admin" ? "admin" : "member";

  if (!userId) return fail("User ID is required.", 400);

  // If demoting self, make sure there is at least one other admin
  if (userId === auth.user.id && role === "member") {
    const currentMembers = getProjectMembers(projectId);
    const otherAdmins = currentMembers.filter((m) => m.userId !== userId && m.role === "admin");
    if (otherAdmins.length === 0) {
      return fail("You cannot remove your admin status because you are the only Project Admin.", 400);
    }
  }

  const members = updateProjectMemberRole(projectId, userId, role);

  try {
    createNotification({
      userId,
      title: "Project role updated",
      message: `${auth.user.name} changed your role in "${project.name}" to ${role === "admin" ? "Project Admin" : "Team Member"}`,
      link: `/projects/${projectId}`,
    });
  } catch (err) {
    console.error("Failed to notify user:", err);
  }

  return Response.json({ members });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const projectId = await idFrom(params);
  const project = projectId !== null ? getProject(projectId) : null;
  if (!project) return fail("Project not found.", 404);

  if (!isProjectAdmin(projectId, auth.user.id)) {
    return fail("Only a Project Admin can remove members.", 403);
  }

  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId"));
  if (!userId) return fail("User ID is required.", 400);

  if (userId === auth.user.id) {
    const currentMembers = getProjectMembers(projectId);
    const otherAdmins = currentMembers.filter((m) => m.userId !== userId && m.role === "admin");
    if (otherAdmins.length === 0) {
      return fail("You cannot leave the project because you are the only Project Admin.", 400);
    }
  }

  const members = removeProjectMember(projectId, userId);
  return Response.json({ members });
}
