"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Crosshair,
  Edit2,
  Filter,
  Layers,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { request } from "@/lib/api";
import Modal from "@/components/ui/Modal";

// Pre-defined template 1: Nexa Business & Agency Strategy (9 Pillars & Targets)
// All tasks are clean & empty by default!
const NEXA_AGENCY_TEMPLATE = {
  title: "Agency Targets & Action Plan",
  kpis: [
    { id: "kpi-1", label: "New projects onboarded", target: "30", current: 0, unit: "projects" },
    { id: "kpi-2", label: "Projects delivered", target: "20+", current: 0, unit: "projects" },
    { id: "kpi-3", label: "Meagle360 HRMS clients", target: "10", current: 0, unit: "clients" },
    { id: "kpi-4", label: "Sales interns hired", target: "4", current: 0, unit: "interns" },
    { id: "kpi-5", label: "Full-time hire", target: "1", current: 0, unit: "hire" },
    { id: "kpi-6", label: "Nexa marketing videos", target: "25", current: 0, unit: "videos" },
    { id: "kpi-7", label: "Nexa carousel posts", target: "6", current: 0, unit: "posts" },
    { id: "kpi-8", label: "Nexa marketing scripts", target: "5", current: 0, unit: "scripts" },
    { id: "kpi-9", label: "Meagle360 ad scripts", target: "2", current: 0, unit: "scripts" },
  ],
  sections: [
    { id: "sec-1", name: "1. Google Ads Campaign – Meagle360 HRMS", tasks: [] },
    { id: "sec-2", name: "2. Nexa Solutions – Marketing Video Scripts", tasks: [] },
    { id: "sec-3", name: "3. Meagle360 HRMS – Advertising Scripts", tasks: [] },
    { id: "sec-4", name: "4. Project Onboarding & Delivery", tasks: [] },
    { id: "sec-5", name: "5. Meagle360 HRMS – Customer Acquisition", tasks: [] },
    { id: "sec-6", name: "6. Hiring & Team Expansion", tasks: [] },
    { id: "sec-7", name: "7. Pending Project Completion & Payment Recovery", tasks: [] },
    { id: "sec-8", name: "8. Nexa Solutions – Social Media Content", tasks: [] },
    { id: "sec-9", name: "9. Meagle360 HRMS – Social Media Content Strategy", tasks: [] },
  ],
};

// Pre-defined template 2: Software & Coding Project Template (Full-Stack Dev, QA, Deployment)
// All tasks are clean & empty by default!
const CODING_PROJECT_TEMPLATE = {
  title: "Software & Coding Project Roadmap",
  kpis: [
    { id: "kpi-code-1", label: "UI Screens / Pages", target: "15", current: 0, unit: "screens" },
    { id: "kpi-code-2", label: "APIs Integrated", target: "12", current: 0, unit: "endpoints" },
    { id: "kpi-code-3", label: "QA & Bugs Resolved", target: "20", current: 0, unit: "fixes" },
    { id: "kpi-code-4", label: "Sprint Milestones", target: "3", current: 0, unit: "milestones" },
    { id: "kpi-code-5", label: "Deployment & Release", target: "1", current: 0, unit: "release" },
    { id: "kpi-code-6", label: "Client Handover & UAT", target: "1", current: 0, unit: "sign-off" },
  ],
  sections: [
    { id: "sec-code-1", name: "1. UI/UX & Design System", tasks: [] },
    { id: "sec-code-2", name: "2. Frontend Development", tasks: [] },
    { id: "sec-code-3", name: "3. Backend & API Integration", tasks: [] },
    { id: "sec-code-4", name: "4. Testing, QA & Bug Fixing", tasks: [] },
    { id: "sec-code-5", name: "5. DevOps & Deployment", tasks: [] },
    { id: "sec-code-6", name: "6. Client UAT & Handover", tasks: [] },
  ],
};

const STATUS_CONFIG = {
  not_started: { label: "Not started", bg: "bg-gray-100 text-gray-700 border-gray-200" },
  in_progress: { label: "In progress", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  done: { label: "Done", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function shiftMonth(monthStr, delta) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) monthStr = "2026-11";
  const [year, month] = monthStr.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthName(monthStr) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) return monthStr || "";
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ActionPlanTab({ project, canManage }) {
  const [plans, setPlans] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("2026-11");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    title: "",
    monthYear: "2026-11",
    prepDeadline: "2026-10-31",
    execStart: "2026-11-01",
    completionDeadline: "2026-11-30",
    template: "coding", // "blank" | "nexa" | "coding"
  });

  // KPI Modal & Edit state
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [kpiFormData, setKpiFormData] = useState({ label: "", target: "", current: 0, unit: "" });

  // Section Modal & Edit state
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionTitle, setSectionTitle] = useState("");

  // Task Modal & Edit state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [taskFormData, setTaskFormData] = useState({ id: "", task: "", subtask: "", deadline: "" });

  // The active plan corresponds to currentMonth
  const activePlan = useMemo(() => {
    return plans.find((p) => p.monthYear === currentMonth) || null;
  }, [plans, currentMonth]);

  // Load plans on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await request(`/api/projects/${project.id}/plan`);
      if (res.ok && res.data?.plans) {
        setPlans(res.data.plans);
        if (res.data.plans.length > 0) {
          const matchCurrent = res.data.plans.find((p) => p.monthYear === "2026-11");
          if (matchCurrent) {
            setCurrentMonth("2026-11");
          } else {
            setCurrentMonth(res.data.plans[0].monthYear);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [project.id]);

  // Open Create Plan modal prefilled for a month
  function openCreatePlanModal(monthToUse = currentMonth, defaultTemplate = "coding") {
    let prep = "";
    let exec = "";
    let completion = "";
    if (/^\d{4}-\d{2}$/.test(monthToUse)) {
      const [year, month] = monthToUse.split("-").map(Number);
      exec = `${monthToUse}-01`;
      const lastDayThisMonth = new Date(year, month, 0).getDate();
      completion = `${monthToUse}-${String(lastDayThisMonth).padStart(2, "0")}`;
      prep = new Date(year, month - 1, 0).toISOString().split("T")[0];
    }

    let defaultTitle = `${project.name} - Software & Coding Roadmap`;
    if (defaultTemplate === "nexa") defaultTitle = `${project.name} - Agency Targets & Action Plan`;
    if (defaultTemplate === "blank") defaultTitle = `${project.name} Action Plan`;

    setPlanFormData({
      title: defaultTitle,
      monthYear: monthToUse,
      prepDeadline: prep,
      execStart: exec,
      completionDeadline: completion,
      template: defaultTemplate,
    });
    setPlanModalOpen(true);
  }

  // Handle template selection in create modal
  function handleTemplateSelect(templateKey) {
    let title = `${project.name} Action Plan`;
    if (templateKey === "nexa") {
      title = `${project.name} - Agency Targets & Action Plan`;
    } else if (templateKey === "coding") {
      title = `${project.name} - Software & Coding Roadmap`;
    }

    setPlanFormData((prev) => ({
      ...prev,
      template: templateKey,
      title,
    }));
  }

  // Handle Month Change in modal
  function handleMonthChange(newMonth) {
    let prep = "";
    let exec = "";
    let completion = "";
    if (/^\d{4}-\d{2}$/.test(newMonth)) {
      const [year, month] = newMonth.split("-").map(Number);
      exec = `${newMonth}-01`;
      const lastDayThisMonth = new Date(year, month, 0).getDate();
      completion = `${newMonth}-${String(lastDayThisMonth).padStart(2, "0")}`;
      prep = new Date(year, month - 1, 0).toISOString().split("T")[0];
    }

    setPlanFormData((prev) => ({
      ...prev,
      monthYear: newMonth,
      prepDeadline: prep || prev.prepDeadline,
      execStart: exec || prev.execStart,
      completionDeadline: completion || prev.completionDeadline,
    }));
  }

  // Save changes to active plan
  async function savePlan(patch) {
    if (!activePlan) return;
    const optimistic = { ...activePlan, ...patch };
    setPlans((prev) => prev.map((p) => (p.id === activePlan.id ? optimistic : p)));

    const res = await request(`/api/projects/${project.id}/plan`, "PATCH", {
      planId: activePlan.id,
      ...patch,
    });
    if (!res.ok) {
      const reload = await request(`/api/projects/${project.id}/plan`);
      if (reload.ok && reload.data?.plans) setPlans(reload.data.plans);
    }
  }

  // Quick KPI increment/decrement
  function adjustKpi(kpiId, delta) {
    if (!activePlan || !canManage) return;
    const updatedKpis = activePlan.kpis.map((kpi) => {
      if (kpi.id === kpiId) {
        const next = Math.max(0, (Number(kpi.current) || 0) + delta);
        return { ...kpi, current: next };
      }
      return kpi;
    });
    savePlan({ kpis: updatedKpis });
  }

  // Quick task status change
  function handleTaskStatusChange(sectionId, taskId, newStatus) {
    if (!activePlan) return;
    const updatedSections = activePlan.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          tasks: sec.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      }
      return sec;
    });
    savePlan({ sections: updatedSections });
  }

  // Task inline deadline date change
  function handleTaskDeadlineChange(sectionId, taskId, newDeadline) {
    if (!activePlan) return;
    const updatedSections = activePlan.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          tasks: sec.tasks.map((t) => (t.id === taskId ? { ...t, deadline: newDeadline } : t)),
        };
      }
      return sec;
    });
    savePlan({ sections: updatedSections });
  }

  // Create new Plan handler
  async function handleCreatePlan(e) {
    e.preventDefault();

    let body = {
      title: planFormData.title,
      monthYear: planFormData.monthYear,
      prepDeadline: planFormData.prepDeadline || null,
      execStart: planFormData.execStart || null,
      kpis: [],
      sections: [],
    };

    if (planFormData.template === "nexa") {
      body.kpis = NEXA_AGENCY_TEMPLATE.kpis;
      body.sections = NEXA_AGENCY_TEMPLATE.sections.map((sec) => ({
        ...sec,
        tasks: [], // Clean & blank
      }));
    } else if (planFormData.template === "coding") {
      body.kpis = CODING_PROJECT_TEMPLATE.kpis;
      body.sections = CODING_PROJECT_TEMPLATE.sections.map((sec) => ({
        ...sec,
        tasks: [], // Clean & blank
      }));
    }

    const res = await request(`/api/projects/${project.id}/plan`, "POST", body);
    if (res.ok && res.data?.plan) {
      setPlans((prev) => [res.data.plan, ...prev.filter((p) => p.id !== res.data.plan.id)]);
      setCurrentMonth(res.data.plan.monthYear);
      setPlanModalOpen(false);
    } else {
      alert(res.data?.error || "Failed to create plan.");
    }
  }

  // Delete current plan
  async function handleDeletePlan() {
    if (!activePlan || !canManage) return;
    if (!confirm(`Are you sure you want to delete the plan for ${formatMonthName(activePlan.monthYear)}?`)) return;

    const res = await request(`/api/projects/${project.id}/plan?planId=${activePlan.id}`, "DELETE");
    if (res.ok) {
      const remaining = plans.filter((p) => p.id !== activePlan.id);
      setPlans(remaining);
    }
  }

  // Open Add KPI modal
  function handleOpenAddKpi() {
    setEditingKpiId(null);
    setKpiFormData({ label: "", target: "", current: 0, unit: "" });
    setKpiModalOpen(true);
  }

  // Open Edit KPI modal
  function handleOpenEditKpi(kpi) {
    setEditingKpiId(kpi.id);
    setKpiFormData({
      label: kpi.label,
      target: kpi.target,
      current: kpi.current ?? 0,
      unit: kpi.unit || "",
    });
    setKpiModalOpen(true);
  }

  // Save KPI (Create or Edit)
  function handleSaveKpi(e) {
    e.preventDefault();
    if (!activePlan) return;

    if (editingKpiId) {
      const updatedKpis = activePlan.kpis.map((k) =>
        k.id === editingKpiId
          ? {
              ...k,
              label: kpiFormData.label.trim(),
              target: kpiFormData.target.trim(),
              current: Number(kpiFormData.current) || 0,
              unit: kpiFormData.unit.trim() || "",
            }
          : k
      );
      savePlan({ kpis: updatedKpis });
    } else {
      const newKpi = {
        id: `kpi-${Date.now()}`,
        label: kpiFormData.label.trim(),
        target: kpiFormData.target.trim(),
        current: Number(kpiFormData.current) || 0,
        unit: kpiFormData.unit.trim() || "",
      };
      savePlan({ kpis: [...activePlan.kpis, newKpi] });
    }

    setKpiFormData({ label: "", target: "", current: 0, unit: "" });
    setEditingKpiId(null);
    setKpiModalOpen(false);
  }

  // Delete KPI Target
  function handleDeleteKpi(kpiId) {
    if (!activePlan || !canManage) return;
    savePlan({ kpis: activePlan.kpis.filter((k) => k.id !== kpiId) });
  }

  // Open Add Section modal
  function handleOpenAddSection() {
    setEditingSectionId(null);
    setSectionTitle("");
    setSectionModalOpen(true);
  }

  // Open Edit Section modal
  function handleOpenEditSection(section) {
    setEditingSectionId(section.id);
    setSectionTitle(section.name);
    setSectionModalOpen(true);
  }

  // Save Section (Create or Edit)
  function handleSaveSection(e) {
    e.preventDefault();
    if (!activePlan || !sectionTitle.trim()) return;

    if (editingSectionId) {
      const updatedSections = activePlan.sections.map((s) =>
        s.id === editingSectionId ? { ...s, name: sectionTitle.trim() } : s
      );
      savePlan({ sections: updatedSections });
    } else {
      const newSection = {
        id: `sec-${Date.now()}`,
        name: sectionTitle.trim(),
        tasks: [],
      };
      savePlan({ sections: [...activePlan.sections, newSection] });
    }

    setSectionTitle("");
    setEditingSectionId(null);
    setSectionModalOpen(false);
  }

  // Delete Section
  function handleDeleteSection(secId) {
    if (!activePlan || !canManage) return;
    if (!confirm("Are you sure you want to delete this section and all its tasks?")) return;
    savePlan({ sections: activePlan.sections.filter((s) => s.id !== secId) });
  }

  // Open Add Task modal
  function handleOpenAddTask(sectionId) {
    setCurrentSectionId(sectionId);
    setEditingTaskId(null);
    setTaskFormData({
      id: "",
      task: "",
      subtask: "",
      deadline: activePlan?.monthYear ? `${activePlan.monthYear}-30` : "",
    });
    setTaskModalOpen(true);
  }

  // Open Edit Task modal
  function handleOpenEditTask(sectionId, task) {
    setCurrentSectionId(sectionId);
    setEditingTaskId(task.id);
    setTaskFormData({
      id: task.id,
      task: task.task,
      subtask: task.subtask || "",
      deadline: task.deadline || "",
    });
    setTaskModalOpen(true);
  }

  // Save Task (Create or Edit)
  function handleSaveTask(e) {
    e.preventDefault();
    if (!activePlan || !currentSectionId) return;

    if (editingTaskId) {
      const updatedSections = activePlan.sections.map((sec) => {
        if (sec.id === currentSectionId) {
          return {
            ...sec,
            tasks: sec.tasks.map((t) =>
              t.id === editingTaskId
                ? {
                    ...t,
                    id: taskFormData.id.trim() || t.id,
                    task: taskFormData.task.trim(),
                    subtask: taskFormData.subtask.trim(),
                    deadline: taskFormData.deadline.trim(),
                  }
                : t
            ),
          };
        }
        return sec;
      });
      savePlan({ sections: updatedSections });
    } else {
      const newTask = {
        id: taskFormData.id.trim() || `${Date.now()}`,
        task: taskFormData.task.trim(),
        subtask: taskFormData.subtask.trim(),
        deadline: taskFormData.deadline.trim() || (activePlan.monthYear ? `${activePlan.monthYear}-30` : ""),
        status: "not_started",
      };
      const updatedSections = activePlan.sections.map((sec) => {
        if (sec.id === currentSectionId) {
          return { ...sec, tasks: [...sec.tasks, newTask] };
        }
        return sec;
      });
      savePlan({ sections: updatedSections });
    }

    setTaskFormData({ id: "", task: "", subtask: "", deadline: "" });
    setEditingTaskId(null);
    setTaskModalOpen(false);
  }

  // Delete Task
  function handleDeleteTask(secId, taskId) {
    if (!activePlan || !canManage) return;
    const updatedSections = activePlan.sections.map((sec) => {
      if (sec.id === secId) {
        return { ...sec, tasks: sec.tasks.filter((t) => t.id !== taskId) };
      }
      return sec;
    });
    savePlan({ sections: updatedSections });
  }

  // Stats calculation
  const stats = useMemo(() => {
    if (!activePlan) return { totalTasks: 0, doneTasks: 0, progress: 0 };
    let total = 0;
    let done = 0;
    activePlan.sections.forEach((s) => {
      s.tasks.forEach((t) => {
        total++;
        if (t.status === "done") done++;
      });
    });
    return {
      totalTasks: total,
      doneTasks: done,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [activePlan]);

  if (loading) {
    return (
      <div className="panel p-8 text-center text-muted">
        <p className="animate-pulse">Loading action plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP MONTH & YEAR NAVIGATION BAR */}
      <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        {/* Left: Previous / Current Month / Next Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
            className="icon-btn h-9 w-9 text-ink/75 hover:bg-[#f6faf7] hover:text-brand-800"
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[17px] font-extrabold tracking-tight text-ink min-w-[145px]">
              {formatMonthName(currentMonth)}
            </span>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
              className="cursor-pointer rounded-lg border border-line bg-white px-2 py-1 text-[12px] font-semibold text-muted hover:border-brand-500 hover:text-brand-700 transition"
              title="Pick custom month & year"
            />
          </div>

          <button
            type="button"
            onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
            className="icon-btn h-9 w-9 text-ink/75 hover:bg-[#f6faf7] hover:text-brand-800"
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>

          {currentMonth !== "2026-11" && (
            <button
              type="button"
              onClick={() => setCurrentMonth("2026-11")}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11.5px] font-semibold text-muted hover:bg-gray-50 transition"
            >
              Go to Nov 2026
            </button>
          )}
        </div>

        {/* Middle: Badges for All Months that have saved plans */}
        {plans.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted mr-1">Saved:</span>
            {plans.map((p) => {
              const isSelected = p.monthYear === currentMonth;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentMonth(p.monthYear)}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold transition ${
                    isSelected
                      ? "bg-brand-700 text-white shadow-xs"
                      : "border border-line bg-[#fafcfb] text-ink/70 hover:bg-[#f4f8f5] hover:text-ink"
                  }`}
                >
                  {formatMonthName(p.monthYear)}
                </button>
              );
            })}
          </div>
        )}

        {/* Right: New Plan / Manage Button */}
        {canManage && (
          <div className="flex items-center gap-2">
            {!activePlan ? (
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth)}
                className="btn-primary btn-compact"
              >
                <Plus size={15} /> Create {formatMonthName(currentMonth)} Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCreatePlanModal()}
                className="btn-secondary btn-compact"
              >
                <Plus size={14} /> New Month
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. IF NO PLAN EXISTS FOR THE SELECTED MONTH */}
      {!activePlan ? (
        <div className="panel p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4fbf6] text-brand-700">
            <Calendar size={28} />
          </div>
          <h3 className="mt-4 text-[20px] font-bold text-ink">No Action Plan for {formatMonthName(currentMonth)}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[14px] text-muted leading-relaxed">
            There is no targets roadmap set for {formatMonthName(currentMonth)} yet. Pick a template below to start this month with clean sections and KPIs.
          </p>

          {canManage && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "coding")}
                className="btn-primary bg-[#1f4a8a] hover:bg-[#16386b]"
              >
                <Code2 size={16} /> Coding Roadmap (Clean Sections)
              </button>
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "nexa")}
                className="btn-primary"
              >
                <Sparkles size={16} /> Nexa Agency Template
              </button>
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "blank")}
                className="btn-secondary"
              >
                <Plus size={16} /> Blank Plan
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 3. ACTIVE PLAN VIEW FOR CURRENT MONTH */
        <>
          {/* Plan Info Banner */}
          <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8f7ec] px-2.5 py-1 text-[13px] font-bold text-brand-800">
                  <Target size={14} />
                  {formatMonthName(activePlan.monthYear)}
                </span>
                {activePlan.prepDeadline && (
                  <span className="rounded-lg border border-line bg-[#fafcfb] px-2.5 py-1 text-[12px] font-medium text-muted">
                    Prep: {activePlan.prepDeadline}
                  </span>
                )}
                {activePlan.execStart && (
                  <span className="rounded-lg border border-line bg-[#fafcfb] px-2.5 py-1 text-[12px] font-medium text-muted">
                    Starts: {activePlan.execStart}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-[21px] font-bold tracking-tight text-ink">{activePlan.title}</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">
                {stats.doneTasks} of {stats.totalTasks} action items completed ({stats.progress}%)
              </p>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  className="icon-btn text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete this month's plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Monthly Target Summary (KPI Cards Grid) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-700" />
                <h3 className="text-[17px] font-bold tracking-tight">Monthly Target Summary (KPIs)</h3>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold text-brand-800">
                  {activePlan.kpis.length} Targets
                </span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenAddKpi}
                  className="btn-secondary btn-compact"
                >
                  <Plus size={14} /> Add Target KPI
                </button>
              )}
            </div>

            {activePlan.kpis.length === 0 ? (
              <div className="panel p-6 text-center text-[13.5px] text-muted">
                No KPI targets added yet. Click &quot;Add Target KPI&quot; to define quantitative monthly goals.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activePlan.kpis.map((kpi) => {
                  const numericTarget = parseInt(kpi.target, 10);
                  const progressPct = !isNaN(numericTarget) && numericTarget > 0 ? Math.min(100, Math.round((kpi.current / numericTarget) * 100)) : 0;
                  return (
                    <div key={kpi.id} className="panel relative flex flex-col justify-between p-4 transition hover:shadow-md">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink/75 leading-snug">{kpi.label}</p>
                          {canManage && (
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditKpi(kpi)}
                                className="dots-btn text-ink/40 hover:text-brand-700"
                                title="Edit target metric"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKpi(kpi.id)}
                                className="dots-btn text-ink/40 hover:text-red-600"
                                title="Remove target"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-[26px] font-extrabold leading-none text-ink">{kpi.current}</span>
                          <span className="text-[15px] font-medium text-muted">/ {kpi.target}</span>
                          {kpi.unit && <span className="text-[12px] text-muted">({kpi.unit})</span>}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {canManage && (
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => adjustKpi(kpi.id, -1)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-white text-ink/70 hover:bg-[#f6faf7]"
                              title="Decrease progress"
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustKpi(kpi.id, 1)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-brand-50 font-bold text-brand-700 hover:bg-brand-100"
                              title="Increase progress"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Action Plan Sections (The Pillars) */}
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-brand-700" />
                <h3 className="text-[17px] font-bold tracking-tight">Action Plan & Milestones</h3>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold text-brand-800">
                  {activePlan.sections.length} Sections
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-44 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-brand-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] font-medium text-ink shadow-xs"
                >
                  <option value="all">All statuses</option>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                {canManage && (
                  <button
                    type="button"
                    onClick={handleOpenAddSection}
                    className="btn-primary btn-compact"
                  >
                    <Plus size={15} /> Add Section
                  </button>
                )}
              </div>
            </div>

            {activePlan.sections.length === 0 ? (
              <div className="panel p-8 text-center text-muted">
                No sections created yet. Click &quot;Add Section&quot; to organize your action plan into functional pillars.
              </div>
            ) : (
              <div className="space-y-4">
                {activePlan.sections.map((section) => {
                  const matchingTasks = section.tasks.filter((t) => {
                    const matchesSearch =
                      !search ||
                      t.task.toLowerCase().includes(search.toLowerCase()) ||
                      t.subtask.toLowerCase().includes(search.toLowerCase()) ||
                      t.id.toLowerCase().includes(search.toLowerCase());
                    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  });

                  const doneCount = section.tasks.filter((t) => t.status === "done").length;

                  return (
                    <div key={section.id} className="panel overflow-hidden border border-line shadow-card">
                      {/* Section Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#fafcfb] px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-[15px] font-bold text-ink">{section.name}</h4>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11.5px] font-semibold text-muted border border-line">
                            {doneCount} / {section.tasks.length} done
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAddTask(section.id)}
                                className="btn-secondary btn-compact text-[12.5px] h-8 px-2.5"
                              >
                                <Plus size={13} /> Add Task
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditSection(section)}
                                className="dots-btn text-ink/40 hover:text-brand-700"
                                title="Rename section"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section.id)}
                                className="dots-btn text-ink/40 hover:text-red-600"
                                title="Delete section"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tasks Table */}
                      <div className="overflow-x-auto">
                        {section.tasks.length === 0 ? (
                          <div className="p-5 text-center text-[13.5px] text-muted bg-[#fdfefd]">
                            No tasks in this section yet.
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddTask(section.id)}
                                className="ml-2 font-semibold text-brand-700 hover:underline inline-flex items-center gap-1"
                              >
                                <Plus size={13} /> Add first task
                              </button>
                            )}
                          </div>
                        ) : matchingTasks.length === 0 ? (
                          <div className="p-4 text-center text-[13px] text-muted">
                            No tasks match your filter.
                          </div>
                        ) : (
                          <table className="w-full text-left text-[13.5px]">
                            <thead>
                              <tr className="border-b border-line bg-[#fbfdfb] text-[12px] font-bold uppercase tracking-wider text-ink/60">
                                <th className="px-4 py-2.5 w-16">ID</th>
                                <th className="px-4 py-2.5">Task</th>
                                <th className="px-4 py-2.5">Subtask / Expected Output</th>
                                <th className="px-4 py-2.5 w-44">Deadline</th>
                                <th className="px-4 py-2.5 w-36">Status</th>
                                {canManage && <th className="px-4 py-2.5 w-20 text-right"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {matchingTasks.map((task) => {
                                const conf = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
                                return (
                                  <tr key={task.id} className="transition hover:bg-[#f6faf7]/60">
                                    <td className="px-4 py-3 font-semibold text-brand-800">{task.id}</td>
                                    <td className="px-4 py-3 font-medium text-ink">{task.task}</td>
                                    <td className="px-4 py-3 text-muted">{task.subtask || "—"}</td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="date"
                                        value={task.deadline && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline) ? task.deadline : ""}
                                        onChange={(e) => handleTaskDeadlineChange(section.id, task.id, e.target.value)}
                                        className="h-8 rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-ink outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
                                        title="Click to select deadline date"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={task.status}
                                        onChange={(e) => handleTaskStatusChange(section.id, task.id, e.target.value)}
                                        className={`rounded-lg border px-2.5 py-1 text-[12.5px] font-semibold cursor-pointer outline-none transition ${conf.bg}`}
                                      >
                                        <option value="not_started">Not started</option>
                                        <option value="in_progress">In progress</option>
                                        <option value="done">Done</option>
                                      </select>
                                    </td>
                                    {canManage && (
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditTask(section.id, task)}
                                            className="dots-btn inline-grid text-ink/40 hover:text-brand-700"
                                            title="Edit task"
                                          >
                                            <Pencil size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTask(section.id, task.id)}
                                            className="dots-btn inline-grid text-ink/40 hover:text-red-600"
                                            title="Delete task"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Render Modals */}
      {planModalOpen && renderPlanModal()}
      {kpiModalOpen && renderKpiModal()}
      {sectionModalOpen && renderSectionModal()}
      {taskModalOpen && renderTaskModal()}
    </div>
  );

  function renderPlanModal() {
    return (
      <Modal
        eyebrow="Monthly Strategy"
        title="Create Action Plan"
        subtitle={`Set up a monthly target plan for ${project.name}`}
        icon={<Target size={24} />}
        onClose={() => setPlanModalOpen(false)}
      >
        <form onSubmit={handleCreatePlan} className="grid gap-4 pt-2">
          {/* Template Selection Dropdown */}
          <label className="field">
            Template
            <select
              value={planFormData.template}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="bg-white font-medium"
            >
              <option value="coding">Coding Project Template (6 Clean Sections & KPIs)</option>
              <option value="nexa">Nexa Template (9 Clean Pillars & KPIs)</option>
              <option value="blank">Blank Plan (Empty Roadmap from Scratch)</option>
            </select>
          </label>

          {/* Template Info Card */}
          <div className="rounded-xl border border-line bg-[#f8fcf9] p-3 text-[13px]">
            {planFormData.template === "nexa" && (
              <div className="flex items-start gap-2 text-ink/80">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
                <p>
                  <strong>Nexa Template:</strong> Creates the 9 Pillars (Google Ads, Scripts, HRMS Strategy, Hiring, Recovery, etc.) + 9 KPI targets. Sections start clean with empty task lists.
                </p>
              </div>
            )}
            {planFormData.template === "coding" && (
              <div className="flex items-start gap-2 text-ink/80">
                <Code2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p>
                  <strong>Coding Project Template:</strong> Creates 6 Core Sections (UI/UX, Frontend, Backend, QA, DevOps, UAT) + 6 Dev KPIs with clean, empty task lists.
                </p>
              </div>
            )}
            {planFormData.template === "blank" && (
              <div className="flex items-start gap-2 text-ink/80">
                <Plus size={16} className="mt-0.5 shrink-0 text-muted" />
                <p>
                  <strong>Blank Plan:</strong> Start completely fresh. You can add your own custom KPI metric cards and action plan sections anytime.
                </p>
              </div>
            )}
          </div>

          {/* Month & Year with Calendar Month Picker */}
          <label className="field">
            Target Month & Year
            <input
              type="month"
              required
              value={planFormData.monthYear}
              onChange={(e) => handleMonthChange(e.target.value)}
            />
          </label>

          {/* Plan Title */}
          <label className="field">
            Plan Title
            <input
              required
              placeholder="e.g. November 2026 Action Plan"
              value={planFormData.title}
              onChange={(e) => setPlanFormData({ ...planFormData, title: e.target.value })}
            />
          </label>

          {/* Date Pickers for Prep Deadline, Execution Start, and Tasks Target Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="field">
              Prep Deadline
              <input
                type="date"
                value={planFormData.prepDeadline}
                onChange={(e) => setPlanFormData({ ...planFormData, prepDeadline: e.target.value })}
              />
            </label>
            <label className="field">
              Execution Start
              <input
                type="date"
                value={planFormData.execStart}
                onChange={(e) => setPlanFormData({ ...planFormData, execStart: e.target.value })}
              />
            </label>
            <label className="field">
              Tasks Deadline Date
              <input
                type="date"
                required
                value={planFormData.completionDeadline}
                onChange={(e) => setPlanFormData({ ...planFormData, completionDeadline: e.target.value })}
              />
            </label>
          </div>

          <p className="text-[12px] text-muted -mt-1">
            💡 The <strong>Tasks Deadline Date</strong> will be set as the default due date for new tasks in this plan.
          </p>

          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" onClick={() => setPlanModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Plan
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderKpiModal() {
    return (
      <Modal
        eyebrow="Target Metric"
        title={editingKpiId ? "Edit Target KPI" : "Add Target KPI"}
        subtitle={editingKpiId ? "Update this measurable target" : "Define a measurable target for this month"}
        icon={<TrendingUp size={24} />}
        onClose={() => {
          setKpiModalOpen(false);
          setEditingKpiId(null);
        }}
      >
        <form onSubmit={handleSaveKpi} className="grid gap-4 pt-2">
          <label className="field">
            Metric / Area Label
            <input
              required
              placeholder="e.g. New projects onboarded, Leads generated..."
              value={kpiFormData.label}
              onChange={(e) => setKpiFormData({ ...kpiFormData, label: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              Target Value
              <input
                required
                placeholder="e.g. 30, 20+, 100"
                value={kpiFormData.target}
                onChange={(e) => setKpiFormData({ ...kpiFormData, target: e.target.value })}
              />
            </label>
            <label className="field">
              Current Progress
              <input
                type="number"
                min="0"
                value={kpiFormData.current}
                onChange={(e) => setKpiFormData({ ...kpiFormData, current: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            Unit (Optional)
            <input
              placeholder="e.g. projects, clients, videos, ₹"
              value={kpiFormData.unit}
              onChange={(e) => setKpiFormData({ ...kpiFormData, unit: e.target.value })}
            />
          </label>

          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setKpiModalOpen(false);
                setEditingKpiId(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingKpiId ? "Save Changes" : "Add KPI"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderSectionModal() {
    return (
      <Modal
        eyebrow="Pillar / Category"
        title={editingSectionId ? "Edit Section" : "Add Action Section"}
        subtitle={editingSectionId ? "Rename or update this section" : "Group related action items together"}
        icon={<Layers size={24} />}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSectionId(null);
        }}
      >
        <form onSubmit={handleSaveSection} className="grid gap-4 pt-2">
          <label className="field">
            Section Title
            <input
              required
              placeholder="e.g. Frontend Development, Testing & QA..."
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
          </label>
          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSectionModalOpen(false);
                setEditingSectionId(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingSectionId ? "Save Changes" : "Create Section"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderTaskModal() {
    return (
      <Modal
        eyebrow="Action Item"
        title={editingTaskId ? "Edit Action Item" : "Add Action Item"}
        subtitle={editingTaskId ? "Update task details, expected output or deadline" : "Add a specific task with output and deadline"}
        icon={<Target size={24} />}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTaskId(null);
        }}
      >
        <form onSubmit={handleSaveTask} className="grid gap-4 pt-2">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <label className="field">
              Task ID
              <input
                placeholder="e.g. 1.1"
                value={taskFormData.id}
                onChange={(e) => setTaskFormData({ ...taskFormData, id: e.target.value })}
              />
            </label>
            <label className="field">
              Task Title
              <input
                required
                placeholder="e.g. Wireframe & Layout Architecture"
                value={taskFormData.task}
                onChange={(e) => setTaskFormData({ ...taskFormData, task: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            Subtask / Expected Output
            <textarea
              rows={2}
              placeholder="e.g. Information architecture and client approved flows"
              value={taskFormData.subtask}
              onChange={(e) => setTaskFormData({ ...taskFormData, subtask: e.target.value })}
            />
          </label>
          <label className="field">
            Deadline Date
            <input
              type="date"
              value={taskFormData.deadline}
              onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
            />
          </label>

          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setTaskModalOpen(false);
                setEditingTaskId(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingTaskId ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }
}
