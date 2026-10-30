"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import { priorityLabel, PRIORITIES } from "@/lib/constants";
import { longDate } from "@/lib/datetime";
import { todoColumns } from "./columns";

export default function NewTodoModal({ initialStatus, date, onClose }) {
  const { projects, addTodo, users, currentUser, isMember, myProjects } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priority: "medium",
    startTime: "",
    endTime: "",
    status: initialStatus,
    projectId: projects[0]?.id ?? null,
    assigneeId: currentUser.id,
  });
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const created = await addTodo(form, date);
    setSaving(false);
    if (created) onClose();
  }

  return (
    <Modal eyebrow="NEW TASK" title={`Add to ${longDate(date, true)}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Task
          <input required autoFocus value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Fix the checkout bug" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="field">
            Project
            <select value={form.projectId ?? ""} onChange={(e) => set({ projectId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">No project</option>
              {(isMember ? myProjects : projects).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="field">
            Priority
            <select value={form.priority} onChange={(e) => set({ priority: e.target.value })}>
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabel[priority]}</option>)}
            </select>
          </label>
          <label className="field">
            Column
            <select value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {todoColumns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
            </select>
          </label>
          <label className="field">
            Assign to
            <select
              disabled={isMember}
              value={form.assigneeId ?? ""}
              onChange={(e) => set({ assigneeId: e.target.value ? Number(e.target.value) : null })}
            >
              {isMember ? (
                <option value={currentUser.id}>{currentUser.name} (me)</option>
              ) : (
                <>

              {users
                .filter((user) => user.active)
                .map((user) => (
                  <option key={user.id} value={user.id}>{user.id === currentUser.id ? `${user.name} (me)` : user.name}</option>
                ))}
                  <option value="">Unassigned</option>
                </>
              )}
            </select>
          </label>
          <label className="field">
            Start time
            <input type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />
          </label>
          <label className="field">
            End time
            <input type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Adding..." : "Add task"}</button>
        </div>
      </form>
    </Modal>
  );
}
