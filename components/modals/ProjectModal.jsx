"use client";

import { useState } from "react";
import { Folder, FolderPlus, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import ProjectColorPicker, { DEFAULT_PROJECT_COLOR, rememberProjectColor } from "./ProjectColorPicker";

const MAX_NAME = 50;

export default function ProjectModal() {
  const { setProjectModalOpen, createProject, goToProject } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const [saving, setSaving] = useState(false);
  const close = () => setProjectModalOpen(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const project = await createProject(name, color, description, null);
    setSaving(false);
    if (!project) return;
    rememberProjectColor(color);
    close();
    goToProject(project);
  }

  return (
    <Modal
      size="wide"
      icon={<FolderPlus size={24} strokeWidth={1.8} className="sm:h-[30px] sm:w-[30px]" />}
      eyebrow="New project"
      title="Create a project"
      subtitle="You will be the Project Admin with full control over this project. You can add team members from the Project Team tab."
      onClose={close}
    >
      <form onSubmit={submit}>
        <label htmlFor="project-name" className="block text-[13.5px] sm:text-[15px] font-bold">
          Project name
        </label>
        <div className="mt-1.5 sm:mt-2 flex items-center gap-2.5 sm:gap-3 rounded-xl border border-brand-300 bg-white px-3.5 sm:px-4 ring-2 ring-brand-100 focus-within:border-brand-500">
          <Folder size={19} strokeWidth={1.7} className="shrink-0 text-ink/80 sm:h-[21px] sm:w-[21px]" />
          <input
            id="project-name"
            required
            autoFocus
            maxLength={MAX_NAME}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Bright Dental Website"
            className="h-[42px] sm:h-[50px] min-w-0 flex-1 bg-transparent text-[14.5px] sm:text-[16px] outline-none placeholder:text-muted"
          />
          <span className="shrink-0 text-[12.5px] sm:text-[14px] text-muted">
            {name.length}/{MAX_NAME}
          </span>
        </div>

        <label htmlFor="project-description" className="mt-3.5 sm:mt-5 block text-[13.5px] sm:text-[15px] font-bold">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="project-description"
          maxLength={80}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. E-commerce website with modern UI"
          className="mt-1.5 sm:mt-2 h-[42px] sm:h-[48px] w-full rounded-xl border border-line bg-white px-3.5 sm:px-4 text-[14px] sm:text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />

        <p className="mb-2 sm:mb-3 mt-3.5 sm:mt-5 text-[13.5px] sm:text-[15px] font-bold">Project color</p>
        <ProjectColorPicker value={color} onChange={setColor} />

        <div className="mt-4 sm:mt-6 flex justify-end gap-2.5 sm:gap-3 border-t border-line pt-3.5 sm:pt-5">
          <button type="button" className="btn-secondary h-[40px] sm:h-[46px] px-5 sm:px-7 text-[13.5px] sm:text-[15px]" onClick={close}>
            Cancel
          </button>
          <button className="btn-primary h-[40px] sm:h-[46px] px-5 sm:px-6 text-[13.5px] sm:text-[15px]" disabled={saving}>
            <Plus size={17} /> {saving ? "Creating..." : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
