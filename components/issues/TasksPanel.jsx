"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Dropdown from "@/components/ui/Dropdown";
import IssueBoard from "./IssueBoard";

/** The "Assigned to" filter and the workflow board, for every task (`projectId` null) or for a single project. */
export default function TasksPanel({ projectId = null, title }) {
  const { tasks, users, currentUser, filterTasks } = useApp();
  const [assignee, setAssignee] = useState("all"); // "all" | "none" | a user id

  const scoped = projectId === null ? tasks : tasks.filter((task) => task.projectId === projectId);
  const visible = filterTasks(scoped).filter(
    (task) => assignee === "all" || (assignee === "none" ? task.assigneeId == null : task.assigneeId === assignee),
  );
  const assigneeOptions = [
    { value: "all", label: "Everyone" },
    ...users.filter((user) => user.active).map((user) => ({ value: user.id, label: user.id === currentUser.id ? `${user.name} (me)` : user.name })),
    { value: "none", label: "Unassigned" },
  ];

  return (
    <div className="space-y-[14px]">
      <div className="flex flex-wrap items-center gap-3">
        <Dropdown label="Assigned to" value={assignee} options={assigneeOptions} onChange={setAssignee} />
        <p className="text-[13.5px] text-muted">{visible.length} of {scoped.length} tasks</p>
      </div>
      <IssueBoard tasks={visible} eyebrow="Workflow board" title={title} subtitle={`${visible.length} matching tasks`} />
    </div>
  );
}
