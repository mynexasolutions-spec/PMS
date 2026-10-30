"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Calendar,
  Check,
  Ellipsis,
  FolderKanban,
  FolderPlus,
  LayoutGrid,
  Lightbulb,
  List,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { PROJECT_STAGES } from "@/lib/constants";
import { hexToHsl } from "@/lib/color";
import { longDate, startOfDay } from "@/lib/datetime";
import { can } from "@/lib/permissions";
import { StageBar, StageChip } from "./stages";

const TIPS_KEY = "nexa.projects.tips.dismissed";
const dueFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const parseDb = (value) => new Date(`${value.replace(" ", "T")}Z`);

const stageOptions = [{ value: "all", label: "All stages" }, ...PROJECT_STAGES.map((stage) => ({ value: stage.id, label: stage.label }))];
const statusOptions = [
  { value: "all", label: "All task statuses" },
  { value: "todo", label: "Has to-do tasks" },
  { value: "progress", label: "Has tasks in progress" },
  { value: "done", label: "Has done tasks" },
  { value: "overdue", label: "Has overdue tasks" },
];
const sortOptions = [
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name (A–Z)" },
  { value: "stage", label: "Stage" },
  { value: "progress", label: "Progress" },
  { value: "issues", label: "Most tasks" },
  { value: "due", label: "Next due" },
];

const tips = ["Track every project's stage", "Organize tasks and bugs", "Set due dates and milestones", "Plan the day on the Daily To-Do board"];

function useProjectStats() {
  const { projects, tasks, now } = useApp();

  return useMemo(() => {
    const floor = now ? startOfDay(now).getTime() : 0;
    return projects.map((project) => {
      const own = tasks.filter((task) => task.projectId === project.id);
      const done = own.filter((task) => task.status === "done").length;
      const active = own.filter((task) => task.status === "progress").length;
      const dated = own.filter((task) => task.status !== "done" && task.dueAt);
      const upcoming = dated
        .filter((task) => new Date(task.dueAt).getTime() >= floor)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];
      return {
        project,
        total: own.length,
        done,
        active,
        todo: own.length - done - active,
        percent: own.length ? Math.round((done / own.length) * 100) : 0,
        overdue: now ? dated.filter((task) => new Date(task.dueAt).getTime() < floor).length : 0,
        upcoming,
        lastActivity: own.reduce((latest, task) => (task.updatedAt > latest ? task.updatedAt : latest), project.createdAt),
      };
    });
  }, [projects, tasks, now]);
}

function SummaryCard({ tint, tile, icon, label, value, foot }) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl border border-line p-5 shadow-card transition-all hover:shadow-md"
      style={{ background: tint }}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
          style={{ background: tile }}
        >
          {icon}
        </div>
        {foot && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 shadow-sm border border-brand-200/60 backdrop-blur-xs">
            <ArrowUp size={11} strokeWidth={2.4} className="shrink-0 text-brand-600" />
            {foot}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[30px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
        <p className="mt-1.5 text-[14px] font-medium text-ink/70">{label}</p>
      </div>
    </div>
  );
}

function Ring({ percent }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-[30px] w-[30px] -rotate-90" aria-hidden="true">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#f9d9a8" strokeWidth="5" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e8860c" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
    </svg>
  );
}

function CardMenu({ project, className = "" }) {
  const { openIssueModal } = useApp();
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  return (
    <div className={`relative z-10 ${className}`}>
      <button
        className="dots-btn"
        aria-label={`Actions for ${project.name}`}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
      >
        <Ellipsis size={20} />
      </button>
      {open && (
        <div className="menu-popover">
          <Link href={`/projects/${project.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14.5px] font-medium hover:bg-[#eef6f0]">
            <FolderKanban size={16} className="text-ink/55" /> Open project
          </Link>
          <button onClick={() => openIssueModal(null, project.id)}>
            <Plus size={16} /> Create task here
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectTile({ project, size = 52 }) {
  const tone = hexToHsl(project.color).l > 68 ? "text-ink" : "text-white";
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl shadow-sm ${tone}`} style={{ background: project.color, width: size, height: size }}>
      <FolderKanban size={size * 0.5} strokeWidth={1.8} />
    </span>
  );
}

function NextDue({ stat }) {
  const { total, upcoming, overdue } = stat;
  return (
    <>
      <span className="inline-flex items-start gap-2 text-ink/75">
        <Calendar size={17} className="mt-px shrink-0" />
        {upcoming ? `Next due: ${upcoming.issueKey} • ${dueFormat.format(new Date(upcoming.dueAt))}` : total ? "Nothing due" : "No tasks yet"}
      </span>
      {overdue > 0 && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">
          <TriangleAlert size={15} /> {overdue} overdue
        </span>
      )}
    </>
  );
}

function ProjectCard({ stat }) {
  const { users } = useApp();
  const { project, total, done, active, todo, percent } = stat;
  const assignee = users.find((u) => u.id === project.assigneeId);
  const tiles = [
    ["To do", todo, "bg-[#fde9e9] text-[#d63a3a]"],
    ["In progress", active, "bg-[#e4efff] text-[#2b5fd6]"],
    ["Done", done, "bg-[#dcf3e1] text-[#2d7a45]"],
    ["Tasks", total, "bg-[#edf0ee] text-ink/80"],
  ];

  return (
    <article
      className="panel relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_rgba(16,60,35,0.3)]"
      style={{ background: `linear-gradient(120deg, #ffffff 45%, ${project.color}22 100%)` }}
    >
      <div className="flex items-start gap-3.5">
        <ProjectTile project={project} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] font-bold leading-tight tracking-tight">
            {/* The whole card is clickable through this link; the ··· menu sits above it. */}
            <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
              {project.name}
            </Link>
          </h2>
          <p className="mt-1 text-[14px] leading-snug text-ink/65">{project.description || "No description yet"}</p>
          {assignee && (
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted">
              <Avatar user={assignee} size={18} />
              <span>Assigned: <span className="font-semibold text-ink/80">{assignee.name}</span></span>
            </div>
          )}
        </div>
        <CardMenu project={project} className="-mr-1.5 -mt-1" />
      </div>

      <div className="mt-4">
        <StageBar stage={project.stage} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-[7px] flex-1 rounded-full bg-[#e8ecea]">
          <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: project.color }} />
        </div>
        <span className="w-[38px] text-right text-[13.5px] font-medium text-ink/80">{percent}%</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {tiles.map(([label, value, tone]) => (
          <div key={label} className={`rounded-lg px-1 py-2.5 ${tone}`}>
            <p className="text-[19px] font-bold leading-none">{value}</p>
            <p className="mt-1 text-[12px] font-medium leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px]">
        <NextDue stat={stat} />
      </div>
    </article>
  );
}

function ProjectRow({ stat }) {
  const { users } = useApp();
  const { project, total, done, active, todo, percent } = stat;
  const assignee = users.find((u) => u.id === project.assigneeId);
  return (
    <article className="relative flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-line bg-white px-4 py-3.5 transition hover:bg-[#f7fbf8]">
      <ProjectTile project={project} size={44} />
      <div className="min-w-[200px] flex-1">
        <h2 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[16.5px] font-bold leading-tight">
          <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 after:rounded-xl">
            {project.name}
          </Link>
          <StageChip stage={project.stage} />
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink/65">{project.description || "No description yet"}</p>
        {assignee && (
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <Avatar user={assignee} size={16} />
            <span>Assigned: <span className="font-semibold text-ink/80">{assignee.name}</span></span>
          </div>
        )}
      </div>

      <div className="flex w-[210px] items-center gap-3">
        <div className="h-[7px] flex-1 rounded-full bg-[#e8ecea]">
          <div className="h-full rounded-full" style={{ width: `${percent}%`, background: project.color }} />
        </div>
        <span className="w-[38px] text-right text-[13.5px] font-medium text-ink/80">{percent}%</span>
      </div>

      <div className="flex gap-1.5 text-[12.5px] font-semibold">
        <span className="rounded-md bg-[#fde9e9] px-2 py-1 text-[#d63a3a]">{todo} to do</span>
        <span className="rounded-md bg-[#e4efff] px-2 py-1 text-[#2b5fd6]">{active} in progress</span>
        <span className="rounded-md bg-[#dcf3e1] px-2 py-1 text-[#2d7a45]">{done} done</span>
        <span className="rounded-md bg-[#edf0ee] px-2 py-1 text-ink/80">{total} tasks</span>
      </div>

      <div className="flex min-w-[190px] flex-col gap-1 text-[13.5px]">
        <NextDue stat={stat} />
      </div>
      <CardMenu project={project} />
    </article>
  );
}

export default function ProjectsView() {
  const { projects, tasks, completed, progress, now, todayDate, setProjectModalOpen, currentUser, isMember } = useApp();
  const canCreate = can.manageProjects(currentUser); // only managers and admins create projects
  const stats = useProjectStats();
  const userStats = useMemo(() => {
    if (!isMember) return stats;
    return stats.filter((stat) => stat.project.assigneeId === currentUser?.id);
  }, [isMember, stats, currentUser?.id]);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("grid");
  const [tipsOpen, setTipsOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  useCloseOnOutsideClick(moreOpen, () => setMoreOpen(false));

  useEffect(() => {
    try {
      if (localStorage.getItem(TIPS_KEY) === "1") setTipsOpen(false);
    } catch {
      // Storage unavailable: the tips card just stays visible.
    }
  }, []);

  function dismissTips() {
    setTipsOpen(false);
    try {
      localStorage.setItem(TIPS_KEY, "1");
    } catch {
      // Not persisted; it will reappear on the next visit.
    }
  }

  const resetFilters = () => {
    setSearch("");
    setStage("all");
    setStatus("all");
    setSort("recent");
  };
  const filtering = search || stage !== "all" || status !== "all";

  const needle = search.trim().toLowerCase();
  const stageRank = (project) => PROJECT_STAGES.findIndex((item) => item.id === project.stage);
  const visible = userStats
    .filter(({ project, done, active, todo, overdue }) => {
      if (needle && !`${project.name} ${project.description ?? ""}`.toLowerCase().includes(needle)) return false;
      if (stage !== "all" && project.stage !== stage) return false;
      if (status === "todo" && todo === 0) return false;
      if (status === "progress" && active === 0) return false;
      if (status === "done" && done === 0) return false;
      if (status === "overdue" && overdue === 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.project.name.localeCompare(b.project.name);
      if (sort === "stage") return stageRank(a.project) - stageRank(b.project) || a.project.id - b.project.id;
      if (sort === "progress") return b.percent - a.percent || a.project.id - b.project.id;
      if (sort === "issues") return b.total - a.total || a.project.id - b.project.id;
      if (sort === "due") {
        const aDue = a.upcoming ? new Date(a.upcoming.dueAt).getTime() : Infinity;
        const bDue = b.upcoming ? new Date(b.upcoming.dueAt).getTime() : Infinity;
        return aDue - bDue || a.project.id - b.project.id;
      }
      return b.lastActivity.localeCompare(a.lastActivity) || a.project.id - b.project.id;
    });

  // Real, derived "recent" numbers (nothing is estimated).
  const weekAgo = now ? now.getTime() - 7 * 86_400_000 : 0;
  const newProjects = now ? projects.filter((project) => { const d = parseDb(project.createdAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length : null;
  const newTasks = now ? tasks.filter((task) => parseDb(task.createdAt).getTime() >= weekAgo).length : null;
  const doneThisWeek = now ? tasks.filter((task) => task.status === "done" && parseDb(task.updatedAt).getTime() >= weekAgo).length : null;
  const totalProjectsVal = isMember ? userStats.length : projects.length;
  const totalTasksVal = isMember ? userStats.reduce((sum, s) => sum + s.total, 0) : tasks.length;
  const totalCompletedVal = isMember ? userStats.reduce((sum, s) => sum + s.done, 0) : completed;
  const overallProgressVal = isMember ? (totalTasksVal ? Math.round((totalCompletedVal / totalTasksVal) * 100) : 0) : progress;

  return (
    <div className="space-y-5 px-5 pb-8 pt-6 md:px-[34px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">{longDate(todayDate, true)}</p>
          <h1 className="mt-2 text-[44px] font-extrabold leading-none tracking-tight text-brand-900 md:text-[50px]">Projects</h1>
          <p className="mt-3 text-[16px] text-muted">{isMember ? "Projects assigned to you, with their current progress and stage." : "Every project your team is working on, with the stage it has reached."}</p>
        </div>
        {canCreate && (
          <button className="btn-primary h-[52px] px-6 text-[16px]" onClick={() => setProjectModalOpen(true)}>
            <Plus size={20} /> New project
          </button>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Project summary">
        <SummaryCard
          tint="linear-gradient(135deg,#f6fcf7,#e7f6eb)"
          tile="linear-gradient(145deg,#d8f2de,#b5e4c1)"
          icon={<FolderKanban size={24} strokeWidth={1.7} className="text-[#1f7a42]" />}
          label="Total Projects"
          value={totalProjectsVal}
          foot={newProjects === null ? null : `+${newProjects} this month`}
        />
        <SummaryCard
          tint="linear-gradient(135deg,#f6f9ff,#e9f1ff)"
          tile="linear-gradient(145deg,#dfe9ff,#c3d4ff)"
          icon={<ListChecks size={24} strokeWidth={1.7} className="text-[#3558d6]" />}
          label="Total Tasks"
          value={totalTasksVal}
          foot={newTasks === null ? null : `+${newTasks} this week`}
        />
        <SummaryCard
          tint="linear-gradient(135deg,#faf6ff,#f1e9fd)"
          tile="linear-gradient(145deg,#eadcfb,#d8c3f6)"
          icon={<ShieldCheck size={24} strokeWidth={1.7} className="text-[#7c3aed]" />}
          label="Completed"
          value={totalCompletedVal}
          foot={doneThisWeek === null ? null : `+${doneThisWeek} this week`}
        />
        <SummaryCard
          tint="linear-gradient(135deg,#fffaf2,#fdf0dc)"
          tile="linear-gradient(145deg,#ffedc9,#fcd596)"
          icon={<Ring percent={overallProgressVal} />}
          label="Overall Progress"
          value={`${overallProgressVal}%`}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-[44px] min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-4 shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
          <Search size={19} className="shrink-0 text-ink/70" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </label>
        <Dropdown value={stage} options={stageOptions} onChange={setStage} />
        <Dropdown value={status} options={statusOptions} onChange={setStatus} />
        <Dropdown label="Sort by" value={sort} options={sortOptions} onChange={setSort} />

        <div className="flex overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
          {[
            ["grid", LayoutGrid, "Grid view"],
            ["list", List, "List view"],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              aria-label={label}
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`grid h-[44px] w-[50px] place-items-center transition ${view === id ? "bg-brand-700 text-white" : "text-ink/60 hover:bg-[#f6faf7]"}`}
            >
              <Icon size={19} />
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            className="icon-btn h-[44px] w-[48px]"
            aria-label="More actions"
            aria-expanded={moreOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMoreOpen((open) => !open);
            }}
          >
            <Ellipsis size={19} />
          </button>
          {moreOpen && (
            <div className="menu-popover">
              {canCreate && (
                <button onClick={() => setProjectModalOpen(true)}>
                  <Plus size={16} /> New project
                </button>
              )}
              <button onClick={resetFilters} disabled={!filtering && sort === "recent"}>
                <X size={16} /> Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={view === "grid" ? "grid gap-[17px] md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {visible.map((stat) => (view === "grid" ? <ProjectCard key={stat.project.id} stat={stat} /> : <ProjectRow key={stat.project.id} stat={stat} />))}
        {!visible.length && (
          <div className="empty-view col-span-full">{filtering ? "No project matches these filters." : "No projects yet. Create your first one."}</div>
        )}
      </div>

      <div className="grid gap-[17px] md:grid-cols-2 xl:grid-cols-3">
        {canCreate && (
          <button
            onClick={() => setProjectModalOpen(true)}
            className="flex min-h-[250px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cfe3d5] bg-white/50 p-6 text-center transition hover:border-brand-300 hover:bg-[#f2faf4]"
          >
            <span className="grid h-[56px] w-[56px] place-items-center rounded-2xl bg-[#e8f7ec] text-brand-600">
              <FolderPlus size={28} strokeWidth={1.8} />
            </span>
            <span className="mt-1 text-[19px] font-bold">Create a new project</span>
            <span className="max-w-[260px] text-[14.5px] text-muted">Set up a new project and start tracking your work.</span>
            <span className="btn-primary mt-3 h-[46px] px-6 text-[15px]">
              <Plus size={18} /> Create project
            </span>
          </button>
        )}

        {tipsOpen && (
          <section className="relative rounded-2xl border border-line bg-gradient-to-br from-white via-[#f7fcf8] to-[#e6f6ea] p-6 shadow-card md:col-span-1 xl:col-span-2">
            <button className="dots-btn absolute right-4 top-4" onClick={dismissTips} aria-label="Dismiss tips">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#dff3e5] text-brand-700">
                <Lightbulb size={24} strokeWidth={1.8} />
              </span>
              <h2 className="text-[20px] font-bold tracking-tight">Keep your projects organized</h2>
            </div>
            <ul className="mt-5 grid gap-3.5 sm:grid-cols-2">
              {tips.map((tip) => (
                <li key={tip} className="flex items-center gap-3 text-[15.5px]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <Check size={15} strokeWidth={3.2} />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
