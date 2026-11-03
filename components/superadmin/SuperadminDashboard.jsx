"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderKanban,
  Layers,
  Loader2,
  LogOut,
  Mail,
  Search,
  ShieldCheck,
  Unlock,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";

const STAGE_LABELS = {
  account_setup: "Account Setup",
  in_progress: "In Progress",
  working: "Working",
  review: "In Review",
  completed: "Completed",
  on_hold: "On Hold",
};

function formatDateTime(ts) {
  if (!ts) return "Never";
  try {
    const iso = ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return ts;
  }
}

export default function SuperadminDashboard({ data, superadminEmail }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("accounts"); // "accounts" | "projects"
  const [search, setSearch] = useState("");
  const [expandedUserIds, setExpandedUserIds] = useState(() => new Set());
  const [expandedProjectIds, setExpandedProjectIds] = useState(() => new Set());
  const [loggingOut, setLoggingOut] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const { stats, accounts, projects } = data;

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.createdProjects.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.createdByName && p.createdByName.toLowerCase().includes(q)) ||
        (p.createdByEmail && p.createdByEmail.toLowerCase().includes(q)) ||
        p.members.some((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    );
  }, [projects, search]);

  function toggleUser(id) {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleProject(id) {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    await request("/api/superadmin/logout", "POST");
    router.refresh();
  }

  async function handleToggleUserStatus(e, account) {
    e.stopPropagation();
    if (togglingUserId) return;
    setTogglingUserId(account.id);
    const { ok } = await request(`/api/superadmin/users/${account.id}`, "PATCH", {
      active: !account.active,
    });
    setTogglingUserId(null);
    if (ok) {
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f7ec] p-1.5 ring-1 ring-brand-200">
              <Image
                src="/logo.png"
                alt="Nexa PMS"
                width={30}
                height={30}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-extrabold tracking-tight text-ink">Nexa Superadmin</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-800">
                  <ShieldCheck size={12} /> Root
                </span>
              </div>
              <p className="text-[12.5px] text-muted">Signed in as {superadminEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/" className="btn-secondary btn-compact hidden sm:inline-flex">
              <ArrowLeft size={15} /> Open Workspace
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary btn-compact text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <LogOut size={15} />
              <span>{loggingOut ? "Signing out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wider text-muted">
                Total Registered Accounts
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                <Users size={18} />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-extrabold tracking-tight text-ink">{stats.totalAccounts}</p>
            <p className="mt-1 text-[12.5px] text-muted">
              <span className="font-semibold text-brand-700">{stats.activeAccounts} active</span> ·{" "}
              {stats.verifiedAccounts} email verified
            </p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wider text-muted">
                Total Projects Created
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                <FolderKanban size={18} />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-extrabold tracking-tight text-ink">{stats.totalProjects}</p>
            <p className="mt-1 text-[12.5px] text-muted">Across all registered accounts</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wider text-muted">
                Project Team Memberships
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                <UserCheck size={18} />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-extrabold tracking-tight text-ink">{stats.totalMemberships}</p>
            <p className="mt-1 text-[12.5px] text-muted">
              Avg{" "}
              {stats.totalProjects > 0
                ? (stats.totalMemberships / stats.totalProjects).toFixed(1)
                : "0"}{" "}
              members per project
            </p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wider text-muted">
                Total Workspace Tasks
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                <Layers size={18} />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-extrabold tracking-tight text-ink">{stats.totalTasks}</p>
            <p className="mt-1 text-[12.5px] text-muted">Tracked across all active projects</p>
          </div>
        </div>

        {/* Controls Bar: Tabs + Search */}
        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-line bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
                activeTab === "accounts"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              <Users size={16} />
              Accounts & Projects Created ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
                activeTab === "projects"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              <FolderKanban size={16} />
              All Projects & Team Members ({projects.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "accounts"
                  ? "Search account name, email, or project..."
                  : "Search project, creator, or member..."
              }
              className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3.5 text-[13.5px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* TAB 1: ACCOUNTS & THEIR CREATED PROJECTS */}
        {activeTab === "accounts" && (
          <div className="mt-4 space-y-3">
            {filteredAccounts.length === 0 ? (
              <div className="empty-view py-12">No matching accounts found.</div>
            ) : (
              filteredAccounts.map((acc) => {
                const isExpanded = expandedUserIds.has(acc.id);
                return (
                  <div key={acc.id} className="panel overflow-hidden transition">
                    <div
                      onClick={() => toggleUser(acc.id)}
                      className="flex cursor-pointer flex-col justify-between gap-4 p-4 transition hover:bg-[#f7fbf8] sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="flex items-start gap-3.5 sm:items-center">
                        <Avatar name={acc.name} id={acc.id} size={42} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15.5px] font-bold text-ink">{acc.name}</h3>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink/70">
                              {acc.role}
                            </span>
                            {acc.active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                <CheckCircle2 size={11} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                                <XCircle size={11} /> Blocked
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Mail size={13} /> {acc.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} /> Joined: {formatDateTime(acc.createdAt)}
                            </span>
                            <span>Last Login: {formatDateTime(acc.lastLoginAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 sm:border-t-0 sm:pt-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="rounded-xl bg-[#eef8f0] px-3 py-1.5 text-center ring-1 ring-brand-200/70">
                            <span className="block text-[16px] font-extrabold leading-none text-brand-800">
                              {acc.createdProjectsCount}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-brand-700">
                              Projects Created
                            </span>
                          </div>

                          <div className="rounded-xl bg-blue-50/80 px-3 py-1.5 text-center ring-1 ring-blue-200/70">
                            <span className="block text-[16px] font-extrabold leading-none text-blue-800">
                              {acc.totalTeamMembersAcrossCreatedProjects}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-blue-700">
                              Team Members
                            </span>
                          </div>

                          <div className="hidden rounded-xl bg-gray-50 px-3 py-1.5 text-center ring-1 ring-gray-200 sm:block">
                            <span className="block text-[16px] font-extrabold leading-none text-ink/80">
                              {acc.memberProjectsCount}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                              Joined Projects
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={togglingUserId === acc.id}
                            onClick={(e) => handleToggleUserStatus(e, acc)}
                            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold transition disabled:opacity-50 ${
                              acc.active
                                ? "border border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100"
                                : "border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {togglingUserId === acc.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : acc.active ? (
                              <Ban size={14} />
                            ) : (
                              <Unlock size={14} />
                            )}
                            <span>{acc.active ? "Block Access" : "Unblock"}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-line bg-[#fafcfb] px-4 py-4 sm:px-6">
                        {/* Projects Created by this Account */}
                        <div>
                          <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink/70">
                            Projects Created by {acc.name} ({acc.createdProjects.length})
                          </h4>

                          {acc.createdProjects.length === 0 ? (
                            <p className="mt-2 rounded-xl border border-dashed border-line bg-white px-4 py-3 text-[13px] text-muted">
                              This account has not created any projects yet.
                            </p>
                          ) : (
                            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                              {acc.createdProjects.map((proj) => (
                                <div
                                  key={proj.id}
                                  className="rounded-xl border border-line bg-white p-3.5 shadow-2xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{ backgroundColor: proj.color || "#2ba55a" }}
                                      />
                                      <span className="text-[14.5px] font-bold text-ink">{proj.name}</span>
                                    </div>
                                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800 ring-1 ring-brand-200">
                                      {proj.memberCount} {proj.memberCount === 1 ? "Member" : "Members"}
                                    </span>
                                  </div>

                                  {proj.description && (
                                    <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">
                                      {proj.description}
                                    </p>
                                  )}

                                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-ink/75">
                                      Stage: {STAGE_LABELS[proj.stage] || proj.stage}
                                    </span>
                                    <span>Tasks: {proj.completedTasks}/{proj.totalTasks} done</span>
                                    <span>Created: {formatDateTime(proj.createdAt)}</span>
                                  </div>

                                  {/* Team Members list inside project card */}
                                  <div className="mt-3 border-t border-line pt-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                      Project Team Members ({proj.members.length})
                                    </p>
                                    {proj.members.length === 0 ? (
                                      <p className="mt-1 text-[12px] text-muted">No members assigned</p>
                                    ) : (
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {proj.members.map((m) => (
                                          <span
                                            key={`${proj.id}-${m.id}`}
                                            title={`${m.name} (${m.email}) - ${m.role} (${m.status})`}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] ${
                                              m.status === "pending"
                                                ? "border-amber-200 bg-amber-50/60 text-amber-900"
                                                : "border-line bg-[#f8faf9] text-ink"
                                            }`}
                                          >
                                            <Avatar name={m.name} id={m.id} size={18} />
                                            <span className="font-medium">{m.name}</span>
                                            <span className="text-[10.5px] uppercase text-muted">
                                              ({m.role}{m.status === "pending" ? " · invited" : ""})
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Projects where this user is a Team Member (created by others or self) */}
                        {acc.memberOfProjects.length > 0 && (
                          <div className="mt-4 border-t border-line pt-3.5">
                            <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-muted">
                              All Projects Joined as Team Member ({acc.memberOfProjects.length})
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {acc.memberOfProjects.map((mp) => (
                                <span
                                  key={mp.id}
                                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1 text-[12.5px]"
                                >
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: mp.color || "#2ba55a" }}
                                  />
                                  <span className="font-semibold text-ink">{mp.name}</span>
                                  <span className="text-[11px] text-muted">
                                    ({mp.myRole} · {mp.memberCount} members)
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ALL PROJECTS & TEAM BREAKDOWN */}
        {activeTab === "projects" && (
          <div className="mt-4 space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="empty-view py-12">No matching projects found.</div>
            ) : (
              filteredProjects.map((proj) => {
                const isExpanded = expandedProjectIds.has(proj.id);
                return (
                  <div key={proj.id} className="panel overflow-hidden">
                    <div
                      onClick={() => toggleProject(proj.id)}
                      className="flex cursor-pointer flex-col justify-between gap-4 p-4 transition hover:bg-[#f7fbf8] sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="flex items-start gap-3.5 sm:items-center">
                        <span
                          className="mt-1 h-4 w-4 shrink-0 rounded-full sm:mt-0"
                          style={{ backgroundColor: proj.color || "#2ba55a" }}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15.5px] font-bold text-ink">{proj.name}</h3>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-ink/75">
                              {STAGE_LABELS[proj.stage] || proj.stage}
                            </span>
                          </div>
                          {proj.description && (
                            <p className="mt-0.5 text-[13px] text-muted">{proj.description}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                            <span>
                              Created by:{" "}
                              <strong className="font-semibold text-ink">{proj.createdByName}</strong>
                              {proj.createdByEmail ? ` (${proj.createdByEmail})` : ""}
                            </span>
                            <span>Created on: {formatDateTime(proj.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 sm:border-t-0 sm:pt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-xl bg-[#eef8f0] px-3 py-1.5 text-center ring-1 ring-brand-200/70">
                            <span className="block text-[16px] font-extrabold leading-none text-brand-800">
                              {proj.memberCount}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-brand-700">
                              Team Members
                            </span>
                          </div>

                          {proj.pendingInviteCount > 0 && (
                            <div className="rounded-xl bg-amber-50 px-3 py-1.5 text-center ring-1 ring-amber-200">
                              <span className="block text-[16px] font-extrabold leading-none text-amber-800">
                                {proj.pendingInviteCount}
                              </span>
                              <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-amber-700">
                                Invited
                              </span>
                            </div>
                          )}

                          <div className="rounded-xl bg-gray-50 px-3 py-1.5 text-center ring-1 ring-gray-200">
                            <span className="block text-[16px] font-extrabold leading-none text-ink/80">
                              {proj.totalTasks}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                              Tasks
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"
                          aria-label="Toggle project members"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-line bg-[#fafcfb] px-4 py-4 sm:px-6">
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink/70">
                          Team Members in {proj.name} ({proj.members.length})
                        </h4>
                        {proj.members.length === 0 ? (
                          <p className="mt-2 text-[13px] text-muted">No members in this project.</p>
                        ) : (
                          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {proj.members.map((m) => (
                              <div
                                key={`${proj.id}-${m.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5"
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <Avatar name={m.name} id={m.id} size={32} />
                                  <div className="min-w-0">
                                    <p className="truncate text-[13.5px] font-semibold text-ink">{m.name}</p>
                                    <p className="truncate text-[12px] text-muted">{m.email}</p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase ${
                                      m.role === "admin"
                                        ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                                        : "bg-gray-100 text-ink/70"
                                    }`}
                                  >
                                    {m.role}
                                  </span>
                                  {m.status === "pending" && (
                                    <span className="text-[10.5px] font-semibold text-amber-700">
                                      Pending Invite
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
