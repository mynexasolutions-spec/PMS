// Who may do what. Shared by the API routes (which enforce it) and the UI (which hides what you can't use).

export const ROLES = ["admin", "manager", "member"];
export const roleLabel = { admin: "Admin", manager: "Manager", member: "Team member" };
export const MANAGER_ROLES = ["admin", "manager"];

export const isAdmin = (user) => user?.role === "admin";
export const isManager = (user) => MANAGER_ROLES.includes(user?.role);

// Anyone on the team can create, assign and comment on tasks and to-dos. These are the restricted actions:
export const can = {
  manageUsers: isAdmin, //            add / disable people, change roles, reset passwords
  manageProjects: isManager, //       create projects, edit details, move them between stages
  viewVault: (user, project) => isManager(user) || (project?.assigneeId != null && project.assigneeId === user?.id), // .env files and account credentials of a project
  deleteTask: (user, task) => isManager(user) || (task?.createdBy != null && task.createdBy === user?.id),
  deleteTodo: (user, todo) => isManager(user) || (todo?.createdBy != null && todo.createdBy === user?.id),
};
