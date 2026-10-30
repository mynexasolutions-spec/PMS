"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Dropdown from "@/components/ui/Dropdown";
import IssueBoard from "./IssueBoard";

/** The "Assigned to" filter and the workflow board, for every task (`projectId` null) or for a single project. */
export default function TasksPanel({ projectId = null, title }) {
  const { tasks, users, currentUser, filterTasks, isMember } = useApp();
  const [assignee, setAssignee] = useState(isMember ? currentUser.id : "all"); // "all" | "none" | a user id

  const scoped = projectId === null ? tasks : tasks.filter((task) => task.projectId === projectId);
  const userScoped = isMember ? scoped.filter((task) => task.assigneeId === currentUser.id) : scoped;
  const visible = filterTasks(userScoped).filter(
    (task) => isMember || assignee === "all" || (assignee === "none" ? task.assigneeId == null : task.assigneeId === assignee),
  );
  const assigneeOptions = isMember
    ? [{ value: currentUser.id, label: `${currentUser.name} (me)` }]
    : [
    { value: "all", label: "Everyone" },
    ...users.filter((user) => user.active).map((user) => ({ value: user.id, label: user.id === currentUser.id ? `${user.name} (me)` : user.name })),
    { value: "none", label: "Unassigned" },
  ];

  return (
    <div className="space-y-[14px]">
      <div className="flex flex-wrap items-center gap-3">
        {!isMember ? (
          <Dropdown label="Assigned to" value={assignee} options={assigneeOptions} onChange={setAssignee} />
        ) : (
          <span className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-line bg-[#f4fbf6] px-3 text-[13px] font-semibold text-brand-800 shadow-xs">
            Assigned to me
          </span>
        )}
        <p className="text-[13.5px] text-muted">
          {visible.length} of {userScoped.length} {isMember ? "assigned tasks" : "tasks"}
        </p>
      </div>
      <IssueBoard tasks={visible} eyebrow="Workflow board" title={title} subtitle={`${visible.length} matching tasks`} />
    </div>
  );
}
