"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import { PRIORITIES, TASK_STATUSES, TASK_TYPES, TASK_STATUS_LABELS, priorityLabel } from "@/lib/constants";
import { AlertCircle, Clock } from "lucide-react";

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

  const [form, setForm] = useState({
    title: editingTask?.title ?? "",
    type: editingTask?.type ?? (parent ? "Subtask" : "Task"),
    status: editingTask?.status ?? issueModal?.initialStatus ?? "todo",
    priority: editingTask?.priority ?? "medium",
    projectId:
      editingTask?.projectId ??
      parent?.projectId ??
      issueModal.projectId ??
      (isMember ? myProjects[0]?.id : projects[0]?.id) ??
      null,
    parentId: editingTask?.parentId ?? parent?.id ?? null,
    assigneeId: editingTask ? editingTask.assigneeId : currentUser.id,
    dueAt: editingTask?.dueAt ? editingTask.dueAt.slice(0, 16) : (issueModal.dueAt ?? ""),
    estimateHours: editingTask?.estimateHours ?? 0,
    loggedHours: editingTask?.loggedHours ?? 0,
    blockerReason: editingTask?.blockerReason ?? "",
  });

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      estimateHours: Number(form.estimateHours) >= 0 ? Number(form.estimateHours) : 0,
      loggedHours: Number(form.loggedHours) >= 0 ? Number(form.loggedHours) : 0,
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

        {/* Row 2: Type, Status, Priority (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <CompactSelect label="Task type" value={form.type} onChange={(type) => set({ type })}>
            {TASK_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </CompactSelect>

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

        {/* Row 3: Project, Assign to, Due date (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <CompactSelect
            label="Project"
            value={form.projectId ?? ""}
            onChange={(value) => set({ projectId: Number(value) })}
          >
            {(isMember ? myProjects : projects).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </CompactSelect>

          <CompactSelect
            label="Assign to"
            value={form.assigneeId ?? ""}
            onChange={(value) => set({ assigneeId: value ? Number(value) : null })}
          >
            {isMember ? (
              <option value={currentUser.id}>{currentUser.name} (me)</option>
            ) : (
              <>
                {users
                  .filter((user) => user.active)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.id === currentUser.id ? `${user.name} (me)` : user.name}
                    </option>
                  ))}
                <option value="">Unassigned</option>
              </>
            )}
          </CompactSelect>

          <label className="field text-[12.5px] font-semibold text-ink/75">
            <span>Due date</span>
            <input
              type="datetime-local"
              className="!py-1.5 !text-[13px]"
              value={form.dueAt}
              onChange={(e) => set({ dueAt: e.target.value })}
            />
          </label>
        </div>

        {/* Row 4: Parent task (2 cols) + Est Hours (1 col) + Logged Hours (1 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <CompactSelect
            label="Parent task"
            className="sm:col-span-2"
            value={form.parentId ?? ""}
            onChange={(value) => set({ parentId: value ? Number(value) : null })}
          >
            <option value="">No parent — top level</option>
            {(isMember ? myTasks : tasks)
              .filter((task) => !editingTask || task.id !== editingTask.id)
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.issueKey} · {task.title}
                </option>
              ))}
          </CompactSelect>

          <label className="field text-[12.5px] font-semibold text-ink/75">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-brand-700" /> Est. hours
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              className="!py-1.5 !text-[13.5px]"
              placeholder="e.g. 4.0"
              value={form.estimateHours || ""}
              onChange={(e) => set({ estimateHours: parseFloat(e.target.value) || 0 })}
            />
          </label>

          <label className="field text-[12.5px] font-semibold text-ink/75">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-blue-600" /> Logged hrs
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              className="!py-1.5 !text-[13.5px]"
              placeholder="e.g. 2.5"
              value={form.loggedHours || ""}
              onChange={(e) => set({ loggedHours: parseFloat(e.target.value) || 0 })}
            />
          </label>
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
