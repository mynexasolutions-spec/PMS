"use client";

import { useState } from "react";
import { Building2, ExternalLink, FlaskConical, GitBranch, Globe, Layers, Pencil, Server, StickyNote, UserCheck } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/components/AppProvider";
import CopyButton from "@/components/ui/CopyButton";

const EMPTY = "Not added yet";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f7ec] text-brand-700">
        <Icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink/60">{label}</p>
        <div className="mt-0.5 text-[15px] wrap-anywhere">{children}</div>
      </div>
    </div>
  );
}

const Empty = () => <span className="text-muted">{EMPTY}</span>;

function LinkValue({ url }) {
  if (!url) return <Empty />;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
        {url}
      </a>
      <CopyButton text={url} />
      <a href={url} target="_blank" rel="noopener noreferrer" className="dots-btn" aria-label="Open link">
        <ExternalLink size={14} />
      </a>
    </span>
  );
}

function DetailsForm({ project, onDone }) {
  const { updateProject, users } = useApp();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    clientName: project.clientName ?? "",
    techStack: project.techStack ?? "",
    hosting: project.hosting ?? "",
    repoUrl: project.repoUrl ?? "",
    stagingUrl: project.stagingUrl ?? "",
    liveUrl: project.liveUrl ?? "",
    notes: project.notes ?? "",
    assigneeId: project.assigneeId ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const saved = await updateProject(project.id, form);
    setBusy(false);
    if (saved) onDone();
  }

  return (
    <form onSubmit={submit} className="panel grid gap-5 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          Project name
          <input required maxLength={50} value={form.name} onChange={set("name")} />
        </label>
        <label className="field">
          Client
          <input maxLength={80} placeholder="Who is this project for?" value={form.clientName} onChange={set("clientName")} />
        </label>
        <label className="field md:col-span-2">
          Assigned team member
          <select value={form.assigneeId} onChange={(e) => setForm((c) => ({ ...c, assigneeId: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Unassigned</option>
            {users.filter((u) => u.active).map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </label>
        <label className="field md:col-span-2">
          Short description
          <input maxLength={80} placeholder="One line about the project" value={form.description} onChange={set("description")} />
        </label>
        <label className="field">
          Tech stack
          <input maxLength={200} placeholder="Next.js, Node, PostgreSQL" value={form.techStack} onChange={set("techStack")} />
        </label>
        <label className="field">
          Hosting
          <input maxLength={200} placeholder="Hostinger VPS, Vercel, AWS..." value={form.hosting} onChange={set("hosting")} />
        </label>
        <label className="field">
          Repository link
          <input type="url" maxLength={200} placeholder="https://github.com/..." value={form.repoUrl} onChange={set("repoUrl")} />
        </label>
        <label className="field">
          Staging link
          <input type="url" maxLength={200} placeholder="https://staging..." value={form.stagingUrl} onChange={set("stagingUrl")} />
        </label>
        <label className="field md:col-span-2">
          Live site link
          <input type="url" maxLength={200} placeholder="https://..." value={form.liveUrl} onChange={set("liveUrl")} />
        </label>
        <label className="field md:col-span-2">
          Notes
          <textarea rows={5} maxLength={2000} placeholder="Deploy steps, things to remember, who to call..." value={form.notes} onChange={set("notes")} />
        </label>
      </div>
      <p className="-mt-1 text-[13px] text-muted">Don&apos;t put passwords here. Use the Environments and Credentials tabs: they are stored encrypted.</p>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onDone}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Save details"}
        </button>
      </div>
    </form>
  );
}

/** What the team should know about a project. Everyone reads it; managers edit it. */
export default function DetailsTab({ project, canEdit }) {
  const { users } = useApp();
  const [editing, setEditing] = useState(false);
  const assignedUser = users.find((u) => u.id === project.assigneeId);

  if (editing) return <DetailsForm project={project} onDone={() => setEditing(false)} />;

  const stack = (project.techStack ?? "").split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <section className="panel p-5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Project details</p>
          <h2 className="text-[19px] font-bold tracking-tight">About {project.name}</h2>
        </div>
        {canEdit ? (
          <button type="button" className="btn-secondary btn-compact ml-auto" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit details
          </button>
        ) : (
          <p className="ml-auto text-[13px] text-muted">Only managers can edit these details.</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Row icon={UserCheck} label="Assigned to">
          {assignedUser ? (
            <div className="flex items-center gap-2">
              <Avatar user={assignedUser} size={24} />
              <span className="font-semibold text-ink">{assignedUser.name}</span>
              <span className="text-[12.5px] text-muted">({assignedUser.role})</span>
            </div>
          ) : (
            <Empty />
          )}
        </Row>
        <Row icon={Building2} label="Client">
          {project.clientName || <Empty />}
        </Row>
        <Row icon={Server} label="Hosting">
          {project.hosting || <Empty />}
        </Row>
        <Row icon={Layers} label="Tech stack">
          {stack.length ? (
            <span className="flex flex-wrap gap-1.5">
              {stack.map((item) => (
                <span key={item} className="rounded-full bg-[#eef6f0] px-2.5 py-0.5 text-[13px] font-medium text-brand-800">
                  {item}
                </span>
              ))}
            </span>
          ) : (
            <Empty />
          )}
        </Row>
        <Row icon={GitBranch} label="Repository">
          <LinkValue url={project.repoUrl} />
        </Row>
        <Row icon={FlaskConical} label="Staging">
          <LinkValue url={project.stagingUrl} />
        </Row>
        <Row icon={Globe} label="Live site">
          <LinkValue url={project.liveUrl} />
        </Row>
        <div className="md:col-span-2">
          <Row icon={StickyNote} label="Notes">
            {project.notes ? <p className="whitespace-pre-wrap">{project.notes}</p> : <Empty />}
          </Row>
        </div>
      </div>
    </section>
  );
}
