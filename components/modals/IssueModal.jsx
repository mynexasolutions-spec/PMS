"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import { PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS, priorityLabel } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

function CompactSelect({ label, value, onChange, children, className = "" }) {
  return (
    <label className={`field text-[12.5px] font-semibold text-ink/75 ${className}`}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="!py-1.5 !text-[13.5px]"
      >
        {children}
      </select>
    </label>
  );
}

export default function IssueModal() {
  const {
    issueModal,
    closeIssueModal,
    createIssue,
    updateTask,
    tasks,
    projects,
    users,
    currentUser,
    isMember,
    myProjects,
    myTasks,
  } = useApp();
  const parent = issueModal.parent;
  const editingTask = issueModal.task;
  const [saving, setSaving] = useState(false);

  // Resolved projectId: either from editing task, parent, modal trigger, or current active project
  const resolvedProjectId =
    editingTask?.projectId ??
    parent?.projectId ??
    issueModal.projectId ??
    (isMember ? myProjects[0]?.id : projects[0]?.id) ??
    projects[0]?.id ??
    null;

  const [form, setForm] = useState({
    title: editingTask?.title ?? "",
    type: editingTask?.type ?? "Task",
    status: editingTask?.status ?? issueModal?.initialStatus ?? "todo",
    priority: editingTask?.priority ?? "medium",
    projectId: resolvedProjectId,
    parentId: editingTask?.parentId ?? parent?.id ?? null,
    assigneeId: editingTask?.assigneeId ?? null, // Default to Unassigned
    blockerReason: editingTask?.blockerReason ?? "",
  });

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  // Filter available parent tasks to the same project
  const projectTasks = tasks.filter(
    (t) => t.projectId === form.projectId && (!editingTask || t.id !== editingTask.id),
  );

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      projectId: Number(form.projectId),
      type: form.type || "Task",
      estimateHours: 0,
      loggedHours: 0,
      dueAt: null,
      blockerReason:
        form.status === "blocked"
          ? form.blockerReason?.trim() || "Blocked by external dependency"
          : null,
    };

    if (editingTask) {
      await updateTask(editingTask.id, payload);
      setSaving(false);
      closeIssueModal();
    } else {
      const created = await createIssue(payload);
      setSaving(false);
      if (created) closeIssueModal();
    }
  }

  return (
    <Modal
      size="wide"
      compact={true}
      eyebrow={editingTask ? "EDIT TASK" : "CREATE TASK"}
      title={editingTask ? `${editingTask.issueKey} · Edit task details` : "Add to project board"}
      onClose={closeIssueModal}
    >
      <form onSubmit={submit} className="space-y-3">
        {/* Row 1: Task summary */}
        <label className="field text-[12.5px] font-semibold text-ink/75">
          <span>Task summary</span>
          <input
            required
            autoFocus
            className="!py-1.5 !text-[14px]"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Handle failed payment webhook"
          />
        </label>

        {/* Row 2: Status, Priority, Assign to (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <CompactSelect label="Status" value={form.status} onChange={(status) => set({ status })}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </CompactSelect>

          <CompactSelect label="Priority" value={form.priority} onChange={(priority) => set({ priority })}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabel[priority]}
              </option>
            ))}
          </CompactSelect>

          <CompactSelect
            label="Assign to"
            value={form.assigneeId ?? ""}
            onChange={(value) => set({ assigneeId: value ? Number(value) : null })}
          >
            <option value="">Unassigned</option>
            {users
              .filter((user) => user.active)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.id === currentUser?.id ? "(me)" : ""}
                </option>
              ))}
          </CompactSelect>
        </div>

        {/* Conditional Blocker Alert (Only when status is 'blocked') */}
        {form.status === "blocked" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50/90 p-2.5">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <input
              type="text"
              required
              className="flex-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-hidden focus:border-rose-500"
              placeholder="Reason for blocker (e.g. Waiting for client credentials or API keys)"
              value={form.blockerReason}
              onChange={(e) => set({ blockerReason: e.target.value })}
            />
          </div>
        )}

        {/* Row 3: Parent task */}
        <div>
          <CompactSelect
            label="Parent task"
            value={form.parentId ?? ""}
            onChange={(value) => set({ parentId: value ? Number(value) : null })}
          >
            <option value="">No parent — top level</option>
            {projectTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.issueKey} · {task.title}
              </option>
            ))}
          </CompactSelect>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-line/60">
          <button type="button" className="btn-secondary !py-1.5 !px-3.5 !text-[13px]" onClick={closeIssueModal}>
            Cancel
          </button>
          <button className="btn-primary !py-1.5 !px-4 !text-[13px]" disabled={saving}>
            {saving ? (editingTask ? "Saving..." : "Creating...") : editingTask ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
