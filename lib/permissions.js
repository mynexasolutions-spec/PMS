// Who may do what. Shared by the API routes and UI.
// Projects have their own Project Admins (creator or appointed admins) and Members (WhatsApp style).

export const ROLES = ["member"];
export const roleLabel = { admin: "Admin", member: "Member" };
export const MANAGER_ROLES = ["admin", "manager", "member"];

export const isProjectAdmin = (user, project) => {
  if (!user || !project) return false;
  if (project.isProjectAdmin) return true;
  if (project.createdBy === user.id) return true;
  return (project.members || []).some((m) => m.userId === user.id && m.role === "admin" && m.status !== "pending");
};

export const isProjectMember = (user, project) => {
  if (!user || !project) return false;
  if (project.createdBy === user.id) return true;
  return (project.members || []).some((m) => m.userId === user.id && m.status !== "pending");
};

// Global fallback helpers
export const isAdmin = (user) => Boolean(user?.id);
export const isManager = (user) => Boolean(user?.id);

export const can = {
  createProject: (user) => Boolean(user?.id),
  manageProjects: (user, project) => !project || isProjectAdmin(user, project),
  manageProject: (user, project) => isProjectAdmin(user, project),
  viewVault: (user, project) => isProjectMember(user, project),
  manageUsers: (user) => Boolean(user?.id),
  deleteTask: (user, task, project) => (project && isProjectAdmin(user, project)) || (task?.createdBy != null && task.createdBy === user?.id),
  deleteTodo: (user, todo, project) => (project && isProjectAdmin(user, project)) || (todo?.createdBy != null && todo.createdBy === user?.id) || (todo?.assigneeId === user?.id),
};
