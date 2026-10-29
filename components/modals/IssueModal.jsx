"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import { PRIORITIES, TASK_STATUSES, TASK_TYPES, priorityLabel } from "@/lib/constants";

const statusLabel = { todo: "To do", progress: "In progress", done: "Done" };

function Select({ label, value, onChange, children, full = false }) {
  return (
    <label className={`field ${full ? "col-span-2" : ""}`}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

export default function IssueModal() {
  const { issueModal, closeIssueModal, createIssue, tasks, projects, users, currentUser } = useApp();
  const parent = issueModal.parent;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: parent ? "Subtask" : "Task",
    status: "todo",
    priority: "medium",
    projectId: parent?.projectId ?? issueModal.projectId ?? projects[0]?.id ?? null,
    parentId: parent?.id ?? null,
    assigneeId: currentUser.id,
    dueAt: issueModal.dueAt ?? "",
  });
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const created = await createIssue(form);
    setSaving(false);
    if (created) closeIssueModal();
  }

  return (
    <Modal eyebrow="CREATE TASK" title="Add to your project board" onClose={closeIssueModal}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Task summary
          <input required autoFocus value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Build the contact page" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Task type" value={form.type} onChange={(type) => set({ type })}>
            {TASK_TYPES.map((type) => <option key={type}>{type}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(status) => set({ status })}>
            {TASK_STATUSES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
          </Select>
          <Select label="Parent task" full value={form.parentId ?? ""} onChange={(value) => set({ parentId: value ? Number(value) : null })}>
            <option value="">No parent — top level</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.issueKey} · {task.title}</option>)}
          </Select>
          <Select label="Project" value={form.projectId ?? ""} onChange={(value) => set({ projectId: Number(value) })}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
          <Select label="Priority" value={form.priority} onChange={(priority) => set({ priority })}>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabel[priority]}</option>)}
          </Select>
          <Select label="Assign to" value={form.assigneeId ?? ""} onChange={(value) => set({ assigneeId: value ? Number(value) : null })}>
            {users
              .filter((user) => user.active)
              .map((user) => (
                <option key={user.id} value={user.id}>{user.id === currentUser.id ? `${user.name} (me)` : user.name}</option>
              ))}
            <option value="">Unassigned</option>
          </Select>
          <label className="field">
            Due date
            <input type="datetime-local" value={form.dueAt} onChange={(e) => set({ dueAt: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={closeIssueModal}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create task"}</button>
        </div>
      </form>
    </Modal>
  );
}
