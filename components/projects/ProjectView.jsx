"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileCode2, FlaskConical, GitBranch, Globe, Info, KeyRound, ListChecks, Lock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import TasksPanel from "@/components/issues/TasksPanel";
import Greeting from "@/components/overview/Greeting";
import { StageStepper } from "@/components/projects/stages";
import { can } from "@/lib/permissions";
import DetailsTab from "./DetailsTab";
import VaultSection from "./VaultSection";

const TABS = [
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "details", label: "Details", icon: Info },
  { id: "env", label: "Environments", icon: FileCode2, secret: true },
  { id: "credentials", label: "Credentials", icon: KeyRound, secret: true },
];

const LINKS = [
  { field: "repoUrl", label: "Repository", icon: GitBranch },
  { field: "stagingUrl", label: "Staging", icon: FlaskConical },
  { field: "liveUrl", label: "Live site", icon: Globe },
];

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f4f8f5] px-4 py-2.5">
      <p className="text-[22px] font-extrabold leading-none tracking-tight">{value}</p>
      <p className="mt-1 text-[12.5px] text-muted">{label}</p>
    </div>
  );
}

/** One project: where it stands, its tasks, its details and (for managers) its saved .env files and logins. */
export default function ProjectView({ projectId, initialTab = "tasks" }) {
  const { tasks, projects, currentUser, updateProject } = useApp();
  const project = projects.find((item) => item.id === projectId);
  const [tab, setTab] = useState(TABS.some((item) => item.id === initialTab) ? initialTab : "tasks");
  const canManage = can.manageProjects(currentUser);
  const canVault = can.viewVault(currentUser, project);

  function selectTab(id) {
    setTab(id);
    // Keep the address in step so a tab can be bookmarked or shared, without a navigation.
    window.history.replaceState(null, "", id === "tasks" ? `/projects/${projectId}` : `/projects/${projectId}?tab=${id}`);
  }

  const isMember = currentUser?.role === "member";
  const isAssigned = !isMember || (project && project.assigneeId === currentUser?.id);

  if (!project || !isAssigned) {
    return (
      <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
        <Link href="/projects" className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} /> {isMember ? "My projects" : "All projects"}
        </Link>
        <Greeting
          showWave={false}
          showQuote={false}
          title={!project ? "Project not found" : "Access restricted"}
          subtitle={!project ? "It may have been removed." : "Only managers and the assigned team member can view this project."}
        />
        <div className="empty-view">
          {!project
            ? "This project doesn't exist. Pick one from the Projects page."
            : "You are not assigned to this project. Ask an admin or manager if you need to work on it."}
        </div>
      </div>
    );
  }

  const own = tasks.filter((task) => task.projectId === project.id);
  const done = own.filter((task) => task.status === "done").length;
  const people = new Set(own.map((task) => task.assigneeId).filter((id) => id != null)).size;
  const links = LINKS.filter((link) => project[link.field]);

  return (
    <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
      <Link href="/projects" className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} /> {isMember ? "My projects" : "All projects"}
      </Link>
      <Greeting
        showWave={false}
        showQuote={false}
        title={project.name}
        subtitle={project.description || project.clientName || "A focused view of this project."}
      />

      <section className="panel overflow-hidden">
        <div className="h-[5px]" style={{ background: project.color }} />
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div>
                <p className="eyebrow">Project stage</p>
                <h2 className="text-[19px] font-bold tracking-tight">Where this project stands</h2>
              </div>
              <p className="ml-auto text-[13px] text-muted">{canManage ? "Click a stage to move the project." : "Only managers can move a project between stages."}</p>
            </div>
            <StageStepper stage={project.stage} onChange={canManage ? (stage) => stage !== project.stage && updateProject(project.id, { stage }) : undefined} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <Stat label="Open tasks" value={own.length - done} />
            <Stat label="Done" value={done} />
            <Stat label="Progress" value={`${own.length ? Math.round((done / own.length) * 100) : 0}%`} />
            <Stat label="People on it" value={people} />
          </div>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2.5 border-t border-line bg-[#fafcfb] px-5 py-3">
            {links.map(({ field, label, icon: Icon }) => (
              <a
                key={field}
                href={project[field]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[13.5px] font-medium transition hover:bg-[#f6faf7]"
              >
                <Icon size={15} className="text-brand-700" />
                {label}
                <ExternalLink size={13} className="text-ink/45" />
              </a>
            ))}
          </div>
        )}
      </section>

      <div role="tablist" aria-label="Project sections" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ id, label, icon: Icon, secret }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-[3px] px-4 py-3 text-[14.5px] transition ${
                active ? "border-brand-600 font-bold text-ink" : "border-transparent font-medium text-ink/65 hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {label}
              {secret && !canVault && <Lock size={13} className="text-ink/45" aria-label="Managers only" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {tab === "tasks" && <TasksPanel projectId={project.id} title={project.name} />}
        {tab === "details" && <DetailsTab project={project} canEdit={canManage} />}
        {tab === "env" && <VaultSection key="env" project={project} kind="env" canOpen={canVault} />}
        {tab === "credentials" && <VaultSection key="credential" project={project} kind="credential" canOpen={canVault} />}
      </div>
    </div>
  );
}
