"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  KeyRound,
  FileCode2,
  FolderPlus,
  Zap,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  User,
  Clock,
  Sparkles,
  Inbox,
  Send,
  Users,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import ActionRequestModal from "@/components/modals/ActionRequestModal";

const CATEGORY_MAP = {
  credentials: {
    label: "Project Storage Vault",
    icon: KeyRound,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    actionLabel: "Open Vault",
  },
  env: {
    label: ".env File",
    icon: FileCode2,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    actionLabel: "Open Project Vault",
  },
  project_setup: {
    label: "Project Setup",
    icon: FolderPlus,
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    actionLabel: "View Project",
  },
  general: {
    label: "General Action",
    icon: Zap,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    actionLabel: null,
  },
};

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}

export default function ActionCenterView() {
  const { actionRequests, currentUser, updateAction, deleteAction } = useApp();
  const [activeTab, setActiveTab] = useState("assigned"); // "assigned" | "delegated" | "all"
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === "admin";

  // Counts
  const assignedToMe = useMemo(
    () => actionRequests.filter((a) => a.assigneeId === currentUser?.id),
    [actionRequests, currentUser?.id]
  );
  const delegatedByMe = useMemo(
    () => actionRequests.filter((a) => a.createdBy === currentUser?.id),
    [actionRequests, currentUser?.id]
  );

  const pendingAssignedCount = assignedToMe.filter((a) => a.status === "pending").length;
  const pendingDelegatedCount = delegatedByMe.filter((a) => a.status === "pending").length;
  const completedCount = actionRequests.filter((a) => a.status === "completed").length;

  // Filtered list based on active tab
  const displayedList = useMemo(() => {
    let list = [];
    if (activeTab === "assigned") {
      list = assignedToMe;
    } else if (activeTab === "delegated") {
      list = delegatedByMe;
    } else {
      list = actionRequests;
    }

    if (filterPendingOnly) {
      return list.filter((a) => a.status === "pending");
    }
    return list;
  }, [activeTab, assignedToMe, delegatedByMe, actionRequests, filterPendingOnly]);

  async function handleToggleStatus(action) {
    const newStatus = action.status === "pending" ? "completed" : "pending";
    await updateAction(action.id, { status: newStatus });
  }

  async function handleDelete(action) {
    if (!confirm(`Are you sure you want to remove action: "${action.title}"?`)) return;
    await deleteAction(action.id);
  }

  // Get action shortcut URL
  function getShortcutUrl(action) {
    if (action.category === "credentials") {
      return action.projectId ? `/projects/${action.projectId}?tab=vault` : "/credentials";
    }
    if (action.category === "env") {
      return action.projectId ? `/projects/${action.projectId}?tab=vault` : "/credentials";
    }
    if (action.category === "project_setup") {
      return action.projectId ? `/projects/${action.projectId}` : "/projects";
    }
    return action.projectId ? `/projects/${action.projectId}` : null;
  }

  return (
    <div className="space-y-5 px-5 pb-8 pt-4 md:px-[30px]">
      {/* ---------------- 1. PAGE HEADER ---------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <ShieldCheck size={18} />
            </span>
            <p className="eyebrow">Workspace Operations</p>
          </div>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink">Action Center</h1>
          <p className="text-[13.5px] text-muted">
            Delegated operational requests, credentials setup & workspace handoffs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-[14px] font-bold text-white shadow-xs hover:bg-brand-800 transition shrink-0 self-start sm:self-auto"
        >
          <Plus size={17} />
          New Action Request
        </button>
      </div>

      {/* ---------------- 2. TOP KPI CARDS ROW (Option 2 Style) ---------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4 flex items-center gap-3.5 transition hover:shadow-xs">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Inbox size={20} />
          </div>
          <div>
            <p className="text-[23px] font-extrabold leading-none tracking-tight text-ink">{pendingAssignedCount}</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">Assigned to me</p>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3.5 transition hover:shadow-xs">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Send size={20} />
          </div>
          <div>
            <p className="text-[23px] font-extrabold leading-none tracking-tight text-ink">{pendingDelegatedCount}</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">Delegated by me</p>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3.5 transition hover:shadow-xs">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[23px] font-extrabold leading-none tracking-tight text-ink">{completedCount}</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">Total completed</p>
          </div>
        </div>

        <div className="panel p-4 flex items-center gap-3.5 transition hover:shadow-xs">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[23px] font-extrabold leading-none tracking-tight text-ink">
              {actionRequests.filter((a) => a.status === "pending").length}
            </p>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">Active in workspace</p>
          </div>
        </div>
      </div>

      {/* ---------------- 3. TABS & CONTROLS ---------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-bold transition ${
              activeTab === "assigned"
                ? "bg-brand-700 text-white shadow-xs"
                : "bg-white text-ink/70 border border-line hover:bg-[#f6faf7]"
            }`}
          >
            <Inbox size={16} />
            Assigned to Me
            {pendingAssignedCount > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.2 text-[11px] font-extrabold ${
                  activeTab === "assigned" ? "bg-white/25 text-white" : "bg-blue-100 text-blue-800"
                }`}
              >
                {pendingAssignedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delegated")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-bold transition ${
              activeTab === "delegated"
                ? "bg-brand-700 text-white shadow-xs"
                : "bg-white text-ink/70 border border-line hover:bg-[#f6faf7]"
            }`}
          >
            <Send size={16} />
            Delegated by Me
            {pendingDelegatedCount > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.2 text-[11px] font-extrabold ${
                  activeTab === "delegated" ? "bg-white/25 text-white" : "bg-purple-100 text-purple-800"
                }`}
              >
                {pendingDelegatedCount}
              </span>
            )}
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-bold transition ${
                activeTab === "all"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-white text-ink/70 border border-line hover:bg-[#f6faf7]"
              }`}
            >
              <Users size={16} />
              All Team Actions
            </button>
          )}
        </div>

        {/* Pending vs All Filter */}
        <label className="inline-flex items-center gap-2 text-[13px] font-medium text-ink/75 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterPendingOnly}
            onChange={(e) => setFilterPendingOnly(e.target.checked)}
            className="rounded border-line text-brand-600 focus:ring-brand-500 h-4 w-4"
          />
          Show pending only
        </label>
      </div>

      {/* ---------------- 4. ACTION ITEMS LIST ---------------- */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="panel p-12 text-center text-muted">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f8f5] text-brand-700 mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-[16px] font-bold text-ink">No Action Requests Found</h3>
            <p className="mt-1 text-[13px] text-muted max-w-sm mx-auto">
              {activeTab === "assigned"
                ? "You have no pending operational actions right now. You're all caught up!"
                : "You haven't delegated any actions yet. Click 'New Action Request' to assign setup tasks to collaborators."}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-brand-800 transition"
            >
              <Plus size={15} /> Delegate an Action
            </button>
          </div>
        ) : (
          displayedList.map((action) => {
            const isCompleted = action.status === "completed";
            const categoryInfo = CATEGORY_MAP[action.category] || CATEGORY_MAP.general;
            const CategoryIcon = categoryInfo.icon;
            const shortcutUrl = getShortcutUrl(action);
            const canDelete = action.createdBy === currentUser?.id || isSuperAdmin;

            return (
              <div
                key={action.id}
                className={`panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition ${
                  isCompleted ? "bg-[#fafcfb] opacity-75 border-line/60" : "bg-white hover:border-brand-300 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Status Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(action)}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border mt-0.5 transition ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "border-line/90 hover:border-brand-600 bg-white text-transparent hover:text-brand-600"
                    }`}
                    title={isCompleted ? "Mark pending" : "Mark completed"}
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  <div className="min-w-0 space-y-1.5">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${categoryInfo.badgeBg}`}
                      >
                        <CategoryIcon size={12} />
                        {categoryInfo.label}
                      </span>

                      {action.projectName && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: action.projectColor || "#2e9e4f" }}
                          />
                          {action.projectName}
                        </span>
                      )}

                      {isCompleted ? (
                        <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                          ⏳ Pending
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      className={`text-[15.5px] font-bold text-ink leading-snug break-words ${
                        isCompleted ? "line-through text-muted" : ""
                      }`}
                    >
                      {action.title}
                    </h4>

                    {/* Description */}
                    {action.description && (
                      <p className="text-[13px] text-muted line-clamp-2">{action.description}</p>
                    )}

                    {/* Metadata & Attribution */}
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={action.creatorName} id={action.createdBy} size={18} />
                        <span>
                          From <strong className="text-ink font-semibold">{action.creatorName}</strong>
                        </span>
                      </span>

                      <span>→</span>

                      <span className="flex items-center gap-1.5">
                        <Avatar name={action.assigneeName} id={action.assigneeId} size={18} />
                        <span>
                          To <strong className="text-ink font-semibold">{action.assigneeName}</strong>
                        </span>
                      </span>

                      {action.dueDate && (
                        <>
                          <span className="text-black/20">·</span>
                          <span className="flex items-center gap-1 text-ink/65">
                            <Clock size={12} /> Due {formatShortDate(action.dueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 sm:self-center shrink-0 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
                  {/* Direct 1-Click Shortcut Button */}
                  {shortcutUrl && categoryInfo.actionLabel && (
                    <Link
                      href={shortcutUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-brand-700 hover:bg-[#f6faf7] transition shadow-2xs"
                    >
                      <CategoryIcon size={14} />
                      {categoryInfo.actionLabel}
                      <ExternalLink size={12} className="text-muted" />
                    </Link>
                  )}

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(action)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete action request"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- 5. CREATE ACTION REQUEST MODAL ---------------- */}
      <ActionRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
