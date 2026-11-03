"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Check,
  ExternalLink,
  FileCode2,
  FlaskConical,
  GitBranch,
  Globe,
  Info,
  Kanban,
  KeyRound,
  ListTodo,
  MessageSquare,
  Settings2,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import IssueBoard from "@/components/issues/IssueBoard";
import Greeting from "@/components/overview/Greeting";
import { StageStepper } from "@/components/projects/stages";
import { request } from "@/lib/api";
import DetailsTab from "./DetailsTab";
import ProjectCalendarTab from "./ProjectCalendarTab";
import ProjectChatTab from "./ProjectChatTab";
import ProjectStickyTab from "./ProjectStickyTab";
import ProjectTeamTab from "./ProjectTeamTab";
import VaultSection from "./VaultSection";

const CORE_TABS = [
  { id: "kanban", label: "Kanban Board", icon: Kanban },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "chat", label: "Team Chat", icon: MessageSquare },
  { id: "sticky", label: "Sticky Notes", icon: StickyNote },
  { id: "vault", label: "Project Storage Vault", icon: KeyRound },
];

const MORE_TABS = [
  { id: "team", label: "Project Team", icon: Users, desc: "Team members & role access" },
  { id: "details", label: "Project Details", icon: Info, desc: "Description, dates & client info" },
];

const ALL_TABS = [...CORE_TABS, ...MORE_TABS];

const LINKS = [
  { field: "repoUrl", label: "Repository", icon: GitBranch },
  { field: "stagingUrl", label: "Staging", icon: FlaskConical },
  { field: "liveUrl", label: "Live site", icon: Globe },
];

function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="panel flex items-center gap-3.5 p-4 transition hover:shadow-xs">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[23px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
        <p className="mt-1 text-[12.5px] font-medium text-muted truncate">{label}</p>
      </div>
    </div>
  );
}

/** One project: its Kanban board (cards & table), live team chat, calendar, sticky notes, team members, details, and vault. */
export default function ProjectView({ projectId, initialTab = "kanban" }) {
  const { tasks, projects, currentUser, updateProject } = useApp();
  const project = projects.find((item) => item.id === projectId);
  const normalizedTab = initialTab === "env" || initialTab === "credentials" ? "vault" : initialTab;
  const [tab, setTab] = useState(ALL_TABS.some((item) => item.id === normalizedTab) ? normalizedTab : "kanban");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const tabsContainerRef = useRef(null);

  // Auto-scroll active tab into view on smaller screens (iPad / mobile)
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeBtn = tabsContainerRef.current.querySelector('[aria-selected="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [tab]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isMoreActive = MORE_TABS.some((t) => t.id === tab);
  const activeMoreItem = MORE_TABS.find((t) => t.id === tab);

  const isProjAdmin =
    project?.isProjectAdmin ||
    project?.createdBy === currentUser?.id ||
    (project?.members || []).some((m) => m.userId === currentUser?.id && m.role === "admin");

  const isMember =
    isProjAdmin ||
    project?.createdBy === currentUser?.id ||
    (project?.members || []).some((m) => m.userId === currentUser?.id);

  const canManage = isProjAdmin;
  const canVault = isMember;
  const hasAccess = project && (isProjAdmin || isMember);

  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Poll unread chat count when user is on another tab (e.g. Kanban, Calendar)
  useEffect(() => {
    if (!projectId || !hasAccess) return;

    let active = true;

    async function checkUnread() {
      if (tab === "chat") {
        setChatUnreadCount(0);
        return;
      }
      try {
        const { ok, data } = await request(`/api/projects/${projectId}/chat/unread`);
        if (active && ok && typeof data?.unreadCount === "number") {
          setChatUnreadCount(data.unreadCount);
        }
      } catch {}
    }

    checkUnread();
    const timer = setInterval(checkUnread, 4000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [projectId, hasAccess, tab]);

  function selectTab(id) {
    setTab(id);
    if (id === "chat") {
      setChatUnreadCount(0);
      request(`/api/projects/${projectId}/chat/unread`, { method: "POST" }).catch(() => {});
    }
    window.history.replaceState(null, "", id === "kanban" ? `/projects/${projectId}` : `/projects/${projectId}?tab=${id}`);
  }

  if (!project || !hasAccess) {
    return (
      <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
        <Link href="/projects" className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline">
          <ArrowLeft size={15} /> All projects
        </Link>
        <Greeting
          showWave={false}
          showQuote={false}
          title={!project ? "Project not found" : "Access restricted"}
          subtitle={!project ? "It may have been removed." : "You are not a member of this project team."}
        />
        <div className="empty-view">
          {!project
            ? "This project doesn't exist. Pick one from the Projects page."
            : "You are not a member of this project team. Ask a Project Admin to invite you."}
        </div>
      </div>
    );
  }

  const own = tasks.filter((task) => task.projectId === project.id);
  const done = own.filter((task) => task.status === "done").length;
  const openTasks = own.length - done;
  const progressPercent = own.length ? Math.round((done / own.length) * 100) : 0;
  const people = (project.members || []).filter((m) => m.status !== "pending").length || 1;
  const links = LINKS.filter((link) => project[link.field]);

  return (
    <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
      <Link href="/projects" className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline">
        <ArrowLeft size={15} /> All projects
      </Link>
      <Greeting
        showWave={false}
        showQuote={false}
        title={project.name}
        subtitle={project.description || project.clientName || "A focused view of this project."}
      />

      {/* Standalone KPI Metrics Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Open tasks"
          value={openTasks}
          icon={ListTodo}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Tasks completed"
          value={done}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Progress"
          value={`${progressPercent}%`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Team size"
          value={people}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Project Stage Stepper Section */}
      <section className="panel overflow-hidden">
        <div className="h-[5px]" style={{ background: project.color }} />
        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <p className="eyebrow">Project stage</p>
              <h2 className="text-[19px] font-bold tracking-tight">Where this project stands</h2>
            </div>
            <p className="ml-auto text-[13px] text-muted">
              {canManage ? "Click a stage to move the project." : "Only Project Admins can change stage."}
            </p>
          </div>
          <StageStepper
            stage={project.stage}
            onChange={canManage ? (stage) => stage !== project.stage && updateProject(project.id, { stage }) : undefined}
          />
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

      {/* Navigation Tabs (Sliding Core Daily Tabs + Pinned Manage Dropdown) */}
      <div className="border-b border-line">
        <div role="tablist" aria-label="Project sections" className="flex items-center justify-between gap-1 overflow-visible">
          {/* Horizontally sliding / swipeable tabs */}
          <div
            ref={tabsContainerRef}
            className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {CORE_TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const hasChatUnread = id === "chat" && chatUnreadCount > 0;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(id)}
                  className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-[3px] px-3.5 sm:px-4 py-3 text-[14px] sm:text-[14.5px] transition ${
                    active
                      ? "border-brand-600 font-bold text-ink"
                      : "border-transparent font-medium text-ink/65 hover:text-ink hover:border-line"
                  }`}
                >
                  <div className="relative inline-flex items-center">
                    <Icon size={17} className={active ? "text-brand-700" : ""} />
                  </div>
                  <span>{label}</span>
                  {hasChatUnread && (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-bold leading-none rounded-full bg-rose-600 text-white shadow-xs"
                      title={`${chatUnreadCount} unread message${chatUnreadCount > 1 ? "s" : ""}`}
                    >
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Manage / Setup Dropdown (Pinned to the right, outside overflow-x-auto so dropdown never clips!) */}
          <div className="relative shrink-0 border-l border-line/70 pl-1" ref={moreMenuRef}>
            <button
              type="button"
              role="tab"
              aria-expanded={moreOpen}
              aria-selected={isMoreActive}
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap border-b-[3px] px-3 sm:px-4 py-3 text-[14px] sm:text-[14.5px] transition ${
                isMoreActive
                  ? "border-brand-600 font-bold text-ink"
                  : "border-transparent font-medium text-ink/65 hover:text-ink hover:border-line"
              }`}
            >
              {isMoreActive && activeMoreItem ? (
                <>
                  <activeMoreItem.icon size={17} className="text-brand-700" />
                  <span className="hidden sm:inline">{activeMoreItem.label}</span>
                </>
              ) : (
                <>
                  <Settings2 size={17} />
                  <span>Manage</span>
                </>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {moreOpen && (
              <div className="absolute right-0 top-full z-40 mt-1.5 w-72 rounded-2xl border border-line bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="border-b border-line/60 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Project Setup & Ops
                  </p>
                </div>
                <div className="space-y-0.5 py-1">
                  {MORE_TABS.map(({ id, label, icon: Icon, desc }) => {
                    const active = tab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          selectTab(id);
                          setMoreOpen(false);
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          active ? "bg-[#f2f9f4] text-brand-900" : "hover:bg-[#f7faf8] text-ink"
                        }`}
                      >
                        <div
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                            active ? "bg-brand-600 text-white shadow-xs" : "bg-ink/5 text-ink/70"
                          }`}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-[13.5px] font-semibold leading-tight ${active ? "text-brand-900" : "text-ink"}`}>
                              {label}
                            </p>
                            {active && <Check size={14} className="text-brand-700 shrink-0" />}
                          </div>
                          {desc && (
                            <p className="mt-0.5 text-[11.5px] text-muted line-clamp-1">
                              {desc}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div role="tabpanel">
        {tab === "kanban" && (
          <IssueBoard
            tasks={own}
            projectId={project.id}
            eyebrow="Project Kanban"
            title={`${project.name} Board`}
            subtitle={`${own.length} project tasks across stages`}
          />
        )}
        {tab === "chat" && (
          <ProjectChatTab
            project={project}
            onMessagesRead={() => setChatUnreadCount(0)}
          />
        )}
        {tab === "calendar" && <ProjectCalendarTab project={project} />}
        {tab === "sticky" && <ProjectStickyTab project={project} />}
        {tab === "team" && <ProjectTeamTab project={project} canManage={canManage} />}
        {tab === "details" && <DetailsTab project={project} canEdit={canManage} />}
        {tab === "vault" && <VaultSection key="vault" project={project} canOpen={canVault} />}
      </div>
    </div>
  );
}
