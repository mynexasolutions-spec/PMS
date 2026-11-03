"use client";

import { useState } from "react";
import { KeyRound, FileCode2, FolderPlus, Zap, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Modal from "@/components/ui/Modal";

const PRESETS = [
  {
    id: "credentials",
    label: "Add Credentials",
    icon: KeyRound,
    defaultTitle: "Store credentials in Project Storage Vault",
  },
  {
    id: "env",
    label: "Add .env File",
    icon: FileCode2,
    defaultTitle: "Configure .env variables in Vault",
  },
  {
    id: "project_setup",
    label: "Setup New Project",
    icon: FolderPlus,
    defaultTitle: "Configure repository, staging URLs & invite team",
  },
  {
    id: "general",
    label: "Custom Action",
    icon: Zap,
    defaultTitle: "",
  },
];

export default function ActionRequestModal({ isOpen, onClose }) {
  const { collaborators, projects, currentUser, createAction } = useApp();

  const [category, setCategory] = useState("credentials");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState(PRESETS[0].defaultTitle);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Only active connected collaborators can be assigned actions
  const availableCollaborators = (collaborators || []).filter((u) => u.active);
  // Normal projects
  const normalProjects = projects.filter((p) => !p.isVaultOnly);

  function handleSelectPreset(preset) {
    setCategory(preset.id);
    if (!title || PRESETS.some((p) => p.defaultTitle === title)) {
      setTitle(preset.defaultTitle);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !assigneeId) return;

    setSubmitting(true);
    const res = await createAction({
      title: title.trim(),
      description: description.trim(),
      category,
      assigneeId: Number(assigneeId),
      projectId: projectId ? Number(projectId) : null,
      dueDate: dueDate || null,
    });
    setSubmitting(false);

    if (res) {
      onClose();
    }
  }

  return (
    <Modal
      icon={<ShieldCheck size={22} className="text-brand-700" />}
      eyebrow="Workspace Delegation"
      title="New Action Request"
      subtitle="Delegate an action directly to a collaborator."
      onClose={onClose}
      size="default"
      compact={true}
    >
      <div className="space-y-3">
        {/* Quick Template Chips */}
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink/55 mb-1.5">
            Quick Templates
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((preset) => {
              const active = category === preset.id;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-all ${
                    active
                      ? "bg-brand-900 text-white shadow-2xs"
                      : "bg-[#f1f6f2] text-ink/70 hover:bg-[#e4efe6] hover:text-ink"
                  }`}
                >
                  <Icon size={12.5} className={active ? "text-white" : "text-brand-700"} />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5 pt-0.5">
          {/* Action Summary */}
          <label className="field !gap-1">
            <span className="font-semibold text-ink/80 text-[12px]">
              Action Summary <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Store credentials in Project Storage Vault"
              className="w-full h-[37px] rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition"
            />
          </label>

          {/* Row 1: Assignee & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="field !gap-1">
              <span className="font-semibold text-ink/80 text-[12px]">
                Assign to Collaborator <span className="text-red-500">*</span>
              </span>
              <select
                required
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-[37px] rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition"
              >
                <option value="">-- Choose collaborator --</option>
                {availableCollaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              {availableCollaborators.length === 0 && (
                <span className="text-[11px] text-amber-700 leading-tight">
                  No collaborators added yet. Add someone from Collaborators tab first.
                </span>
              )}
            </label>

            <label className="field !gap-1">
              <span className="font-semibold text-ink/80 text-[12px]">
                Related Project <span className="text-muted font-normal text-[11px]">(optional)</span>
              </span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-[37px] rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition"
              >
                <option value="">-- No specific project --</option>
                {normalProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 2: Due Date & Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="field !gap-1">
              <span className="font-semibold text-ink/80 text-[12px]">
                Due Date <span className="text-muted font-normal text-[11px]">(optional)</span>
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[37px] rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition"
              />
            </label>

            <label className="field !gap-1">
              <span className="font-semibold text-ink/80 text-[12px]">
                Notes / Context <span className="text-muted font-normal text-[11px]">(optional)</span>
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Credentials are in 1Password"
                className="w-full h-[37px] rounded-lg border border-line bg-white px-2.5 text-[12.5px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition"
              />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary h-[36px] px-3.5 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !assigneeId || availableCollaborators.length === 0}
              className="btn-primary h-[36px] px-5 text-[13px] font-bold shadow-xs"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
