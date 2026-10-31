"use client";

import { useState } from "react";
import { X, KeyRound, FileCode2, FolderPlus, Zap, Calendar, User, FolderKanban } from "lucide-react";
import { useApp } from "@/components/AppProvider";

const PRESETS = [
  {
    id: "credentials",
    label: "Add Credentials",
    icon: KeyRound,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    defaultTitle: "Store credentials in Credentials Storage",
  },
  {
    id: "env",
    label: "Add .env File",
    icon: FileCode2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    defaultTitle: "Configure .env variables in Vault",
  },
  {
    id: "project_setup",
    label: "Setup New Project",
    icon: FolderPlus,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    defaultTitle: "Configure repository, staging URLs & invite team",
  },
  {
    id: "general",
    label: "Custom Action",
    icon: Zap,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    defaultTitle: "",
  },
];

export default function ActionRequestModal({ isOpen, onClose }) {
  const { users, projects, currentUser, createAction } = useApp();

  const [category, setCategory] = useState("credentials");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState(PRESETS[0].defaultTitle);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter available active team members
  const availableUsers = users.filter((u) => u.active);
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/80 pb-4">
          <div>
            <p className="eyebrow">Workspace Delegation</p>
            <h3 className="text-[19px] font-bold text-ink tracking-tight">New Action Request</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. Quick Presets */}
          <div>
            <label className="block text-[12.5px] font-semibold text-ink/75 mb-1.5">
              Action Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const active = category === preset.id;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-[13px] font-medium border transition ${
                      active
                        ? "border-brand-600 bg-brand-50/60 text-brand-900 shadow-2xs ring-1 ring-brand-500"
                        : "border-line bg-[#f8faf9] text-ink/70 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-lg border ${preset.color}`}>
                      <Icon size={14} />
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Assign To Teammate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-ink/75 mb-1">
                Assign to Teammate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-[40px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
                >
                  <option value="">-- Choose member --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === currentUser?.id ? "(me)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Related Project (Optional) */}
            <div>
              <label className="block text-[12.5px] font-semibold text-ink/75 mb-1">
                Related Project <span className="text-muted font-normal">(optional)</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-[40px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
              >
                <option value="">-- No specific project --</option>
                {normalProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Action Summary */}
          <div>
            <label className="block text-[12.5px] font-semibold text-ink/75 mb-1">
              Action Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add Razorpay keys for Greenleaf Store"
              className="w-full h-[40px] rounded-xl border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* 5. Due Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-ink/75 mb-1">
                Due Date <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[40px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-ink/75 mb-1">
                Notes / Context <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Credentials are in shared 1Password"
                className="w-full h-[40px] rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-[13.5px] font-medium text-muted hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !assigneeId}
              className="rounded-xl bg-brand-700 px-5 py-2 text-[13.5px] font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-40 transition"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
