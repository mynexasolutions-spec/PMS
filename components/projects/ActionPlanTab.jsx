"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Search,
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
  not_started: {
    label: "Not started",
    badge: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200/80 hover:border-slate-400",
    dot: "bg-slate-500",
    pill: "bg-slate-100 text-slate-800",
  },
  in_progress: {
    label: "In progress",
    badge: "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80 hover:border-amber-400",
    dot: "bg-amber-500 animate-pulse",
    pill: "bg-amber-50 text-amber-900",
  },
  done: {
    label: "Done",
    badge: "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400 font-bold",
    dot: "bg-emerald-600",
    pill: "bg-emerald-50 text-emerald-900",
  },
};

function formatTaskDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// FLOATING PORTAL: Renders popups directly into document.body to prevent ANY clipping from tables or overflow containers!
function FloatingPortal({ open, anchorRef, children, popupWidth = 260, popupHeight = 300, align = "left" }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setCoords(null);
      return;
    }

    function compute() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Decide whether to open above or below based on available screen space
      const openAbove = spaceBelow < popupHeight + 10 && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(10, rect.top - popupHeight - 6)
        : Math.min(window.innerHeight - popupHeight - 10, rect.bottom + 6);

      let left;
      if (align === "right") {
        left = rect.right - popupWidth;
      } else {
        left = rect.left;
      }

      // Constrain inside viewport horizontally
      left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, left));

      setCoords({ top, left });
    }

    compute();

    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open, anchorRef, popupWidth, popupHeight, align]);

  if (!open || !coords || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

// 1. 100% CUSTOM STATUS DROPDOWN (Rendered via Portal, zero clipping!)
function CustomStatusDropdown({ status, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const current = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const options = [
    {
      value: "not_started",
      label: "Not started",
      dot: "bg-slate-400",
      pill: "bg-slate-100 text-slate-800",
    },
    {
      value: "in_progress",
      label: "In progress",
      dot: "bg-amber-500 animate-pulse",
      pill: "bg-amber-50 text-amber-900",
    },
    {
      value: "done",
      label: "Done",
      dot: "bg-emerald-600",
      pill: "bg-emerald-50 text-emerald-900",
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold shadow-2xs transition ${current.badge}`}
      >
        <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown size={12} className={`opacity-60 ml-0.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <FloatingPortal open={open} anchorRef={buttonRef} popupWidth={176} popupHeight={150} align="right">
        <div
          ref={popupRef}
          className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
            Select Status
          </div>
          {options.map((opt) => {
            const isSelected = opt.value === status;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold transition ${
                  isSelected
                    ? `${opt.pill} font-bold`
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </FloatingPortal>
    </>
  );
}

// 2. 100% CUSTOM CALENDAR DATE PICKER (Rendered via Portal, zero clipping!)
function CustomDatePicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  // Parse existing date or default to November 2026
  const parsed = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: 2026, month: 10, day: null }; // Nov 2026
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  useEffect(() => {
    if (open) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [open, parsed.year, parsed.month]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayLabel = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatTaskDate(value)
    : "Set deadline";

  const hasDate = Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

  function handleSelectDay(day) {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    onChange(`${yStr}-${mStr}-${dStr}`);
    setOpen(false);
  }

  function handlePrevMonth(e) {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth(e) {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition shadow-2xs ${
          hasDate
            ? "border-slate-300 bg-white text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/40"
            : "border-dashed border-slate-300 bg-slate-50/70 text-slate-500 hover:border-slate-400 hover:text-slate-800"
        }`}
        title="Click to select deadline date"
      >
        <Calendar
          size={13}
          className={hasDate ? "text-emerald-700 group-hover:scale-110 transition" : "text-slate-400"}
        />
        <span className="whitespace-nowrap">{displayLabel}</span>
      </button>

      <FloatingPortal open={open} anchorRef={buttonRef} popupWidth={256} popupHeight={290} align="left">
        <div
          ref={popupRef}
          className="w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Month / Year & Chevrons */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-extrabold text-slate-900">{monthLabel}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 pt-2 text-center text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1.5">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`blank-${i}`} className="h-7 w-7" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsed.year === viewYear &&
                parsed.month === viewMonth &&
                parsed.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-[12px] font-bold transition flex items-center justify-center ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-slate-400 hover:text-red-600 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, "0");
                const d = String(now.getDate()).padStart(2, "0");
                onChange(`${y}-${m}-${d}`);
                setOpen(false);
              }}
              className="text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      </FloatingPortal>
    </>
  );
}

// 3. 100% CUSTOM MONTH & YEAR PICKER (Rendered via Portal, zero clipping!)
function CustomMonthPicker({ currentMonth, onSelectMonth, savedMonths = [] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const [yearStr, monthStr] = (currentMonth || "2026-11").split("-");
  const selectedYear = parseInt(yearStr, 10) || 2026;
  const selectedMonthNum = parseInt(monthStr, 10) || 11; // 1-12

  const [viewYear, setViewYear] = useState(selectedYear);

  useEffect(() => {
    if (open) {
      setViewYear(selectedYear);
    }
  }, [open, selectedYear]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const MONTHS = [
    { num: 1, short: "Jan", full: "January" },
    { num: 2, short: "Feb", full: "February" },
    { num: 3, short: "Mar", full: "March" },
    { num: 4, short: "Apr", full: "April" },
    { num: 5, short: "May", full: "May" },
    { num: 6, short: "Jun", full: "June" },
    { num: 7, short: "Jul", full: "July" },
    { num: 8, short: "Aug", full: "August" },
    { num: 9, short: "Sep", full: "September" },
    { num: 10, short: "Oct", full: "October" },
    { num: 11, short: "Nov", full: "November" },
    { num: 12, short: "Dec", full: "December" },
  ];

  function handleChooseMonth(monthNum) {
    const formatted = `${viewYear}-${String(monthNum).padStart(2, "0")}`;
    onSelectMonth(formatted);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-left shadow-2xs hover:border-emerald-600 hover:bg-white transition group"
        title="Click to switch month & year"
      >
        <Calendar size={16} className="text-emerald-700 shrink-0 group-hover:scale-110 transition" />
        <span className="text-[16px] font-extrabold tracking-tight text-slate-950">
          {formatMonthName(currentMonth)}
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <FloatingPortal open={open} anchorRef={buttonRef} popupWidth={288} popupHeight={265} align="left">
        <div
          ref={popupRef}
          className="w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition"
              title="Previous Year"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[16px] font-black text-slate-900">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition"
              title="Next Year"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {MONTHS.map((m) => {
              const monthKey = `${viewYear}-${String(m.num).padStart(2, "0")}`;
              const isSelected = viewYear === selectedYear && m.num === selectedMonthNum;
              const hasSavedPlan = savedMonths.includes(monthKey);

              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => handleChooseMonth(m.num)}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-2.5 text-[13px] font-bold transition ${
                    isSelected
                      ? "bg-emerald-700 text-white shadow-xs font-black"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span>{m.short}</span>
                  {hasSavedPlan && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-emerald-600"
                      }`}
                      title="Has saved plan"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Shortcut */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[12px] font-bold">
            <button
              type="button"
              onClick={() => {
                onSelectMonth("2026-11");
                setOpen(false);
              }}
              className="text-slate-500 hover:text-slate-900 transition"
            >
              Go to Nov 2026
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, "0");
                onSelectMonth(`${y}-${m}`);
                setOpen(false);
              }}
              className="text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Current Month
            </button>
          </div>
        </div>
      </FloatingPortal>
    </>
  );
}

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
      <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs border border-slate-200 bg-white">
        {/* Left: Previous / Current Month / Next Navigator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 shadow-2xs transition"
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <CustomMonthPicker
            currentMonth={currentMonth}
            onSelectMonth={setCurrentMonth}
            savedMonths={plans.map((p) => p.monthYear)}
          />

          <button
            type="button"
            onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 shadow-2xs transition"
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>

          {currentMonth !== "2026-11" && (
            <button
              type="button"
              onClick={() => setCurrentMonth("2026-11")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 shadow-2xs transition"
            >
              Go to Nov 2026
            </button>
          )}
        </div>

        {/* Middle: Badges for All Months that have saved plans */}
        {plans.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-600 mr-1">Saved:</span>
            {plans.map((p) => {
              const isSelected = p.monthYear === currentMonth;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentMonth(p.monthYear)}
                  className={`rounded-lg px-3 py-1 text-[12px] font-bold transition shadow-2xs ${
                    isSelected
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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
                className="btn-primary btn-compact shadow-2xs"
              >
                <Plus size={15} /> Create {formatMonthName(currentMonth)} Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCreatePlanModal()}
                className="btn-secondary btn-compact shadow-2xs"
              >
                <Plus size={14} /> New Month
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. IF NO PLAN EXISTS FOR THE SELECTED MONTH */}
      {!activePlan ? (
        <div className="panel p-10 text-center border border-slate-200 bg-white shadow-2xs">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <Calendar size={28} />
          </div>
          <h3 className="mt-4 text-[20px] font-extrabold text-slate-950">No Action Plan for {formatMonthName(currentMonth)}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[14px] text-slate-700 leading-relaxed font-medium">
            There is no targets roadmap set for {formatMonthName(currentMonth)} yet. Pick a template below to start this month with clean sections and KPIs.
          </p>

          {canManage && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "coding")}
                className="btn-primary bg-[#1f4a8a] hover:bg-[#16386b] shadow-2xs"
              >
                <Code2 size={16} /> Coding Roadmap (Clean Sections)
              </button>
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "nexa")}
                className="btn-primary shadow-2xs"
              >
                <Sparkles size={16} /> Nexa Agency Template
              </button>
              <button
                type="button"
                onClick={() => openCreatePlanModal(currentMonth, "blank")}
                className="btn-secondary shadow-2xs"
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
          <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white shadow-2xs">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[13px] font-bold text-emerald-800">
                  <Target size={14} />
                  {formatMonthName(activePlan.monthYear)}
                </span>
                {activePlan.prepDeadline && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-700">
                    <Clock size={12} className="text-slate-500" />
                    Prep: {formatTaskDate(activePlan.prepDeadline)}
                  </span>
                )}
                {activePlan.execStart && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-700">
                    <Calendar size={12} className="text-slate-500" />
                    Starts: {formatTaskDate(activePlan.execStart)}
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 text-[22px] font-extrabold tracking-tight text-slate-950">{activePlan.title}</h2>
              <p className="mt-1 text-[13.5px] font-medium text-slate-700">
                <span className="font-bold text-slate-900">{stats.doneTasks} of {stats.totalTasks}</span> action items completed (
                <span className="font-bold text-emerald-700">{stats.progress}%</span>)
              </p>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  className="icon-btn text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200"
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
                <TrendingUp size={18} className="text-emerald-700" />
                <h3 className="text-[17px] font-extrabold tracking-tight text-slate-900">Monthly Target Summary (KPIs)</h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-800 border border-emerald-200/80">
                  {activePlan.kpis.length} Targets
                </span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenAddKpi}
                  className="btn-secondary btn-compact shadow-2xs"
                >
                  <Plus size={14} /> Add Target KPI
                </button>
              )}
            </div>

            {activePlan.kpis.length === 0 ? (
              <div className="panel p-6 text-center text-[13.5px] text-slate-600 font-medium border border-slate-200 bg-white">
                No KPI targets added yet. Click &quot;Add Target KPI&quot; to define quantitative monthly goals.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activePlan.kpis.map((kpi) => {
                  const numericTarget = parseInt(kpi.target, 10);
                  const progressPct = !isNaN(numericTarget) && numericTarget > 0 ? Math.min(100, Math.round((kpi.current / numericTarget) * 100)) : 0;
                  return (
                    <div key={kpi.id} className="panel relative flex flex-col justify-between p-4 transition hover:shadow-md border border-slate-200 bg-white shadow-2xs">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13.5px] font-bold text-slate-800 leading-snug">{kpi.label}</p>
                          {canManage && (
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditKpi(kpi)}
                                className="dots-btn text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Edit target metric"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKpi(kpi.id)}
                                className="dots-btn text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Remove target"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-[28px] font-black leading-none text-slate-950">{kpi.current}</span>
                          <span className="text-[15px] font-bold text-slate-600">/ {kpi.target}</span>
                          {kpi.unit && <span className="text-[12.5px] font-semibold text-slate-600">({kpi.unit})</span>}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {canManage && (
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => adjustKpi(kpi.id, -1)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
                              title="Decrease progress"
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustKpi(kpi.id, 1)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-emerald-300 bg-emerald-50 font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs"
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
                <Layers size={18} className="text-emerald-700" />
                <h3 className="text-[17px] font-extrabold tracking-tight text-slate-900">Action Plan & Milestones</h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-800 border border-emerald-200/80">
                  {activePlan.sections.length} Sections
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-bold text-slate-800 shadow-2xs hover:border-slate-400 cursor-pointer outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">All statuses</option>
                  <option value="not_started">⚪ Not started</option>
                  <option value="in_progress">🟡 In progress</option>
                  <option value="done">🟢 Done</option>
                </select>
                {canManage && (
                  <button
                    type="button"
                    onClick={handleOpenAddSection}
                    className="btn-primary btn-compact shadow-2xs"
                  >
                    <Plus size={15} /> Add Section
                  </button>
                )}
              </div>
            </div>

            {activePlan.sections.length === 0 ? (
              <div className="panel p-8 text-center text-slate-600 font-medium border border-slate-200 bg-white">
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
                    <div key={section.id} className="panel border border-slate-200 shadow-2xs bg-white">
                      {/* Section Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 rounded-t-2xl">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-[16px] font-extrabold text-slate-900 tracking-tight">{section.name}</h4>
                          <span className="rounded-md bg-white px-2.5 py-0.5 text-[12px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                            {doneCount} / {section.tasks.length} done
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAddTask(section.id)}
                                className="btn-secondary btn-compact text-[12.5px] h-8 px-2.5 shadow-2xs"
                              >
                                <Plus size={13} /> Add Task
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditSection(section)}
                                className="dots-btn text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Rename section"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section.id)}
                                className="dots-btn text-slate-400 hover:text-red-600 hover:bg-red-50"
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
                          <div className="p-5 text-center text-[13.5px] text-slate-600 font-medium bg-[#fdfefd]">
                            No tasks in this section yet.
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddTask(section.id)}
                                className="ml-2 font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                              >
                                <Plus size={13} /> Add first task
                              </button>
                            )}
                          </div>
                        ) : matchingTasks.length === 0 ? (
                          <div className="p-4 text-center text-[13px] text-slate-600 font-medium">
                            No tasks match your filter.
                          </div>
                        ) : (
                          <table className="w-full text-left text-[13.5px]">
                            <thead>
                              <tr className="border-b-2 border-slate-200 bg-slate-100/95 text-[12px] font-extrabold uppercase tracking-wider text-slate-800">
                                <th className="px-4 py-3 w-16">ID</th>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Subtask / Expected Output</th>
                                <th className="px-4 py-3 w-44">Deadline</th>
                                <th className="px-4 py-3 w-40">Status</th>
                                {canManage && <th className="px-4 py-3 w-20 text-right"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {matchingTasks.map((task, taskIdx) => {
                                const isNearBottom = matchingTasks.length > 1 && taskIdx >= matchingTasks.length - 2;
                                return (
                                  <tr key={task.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 font-semibold">
                                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[12px] font-extrabold text-emerald-800 border border-emerald-200/90">
                                        {task.id}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-950 text-[14px] leading-snug">
                                      {task.task}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-700 text-[13px] leading-relaxed">
                                      {task.subtask || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <CustomDatePicker
                                        value={task.deadline}
                                        disabled={!canManage}
                                        isNearBottom={isNearBottom}
                                        onChange={(val) => handleTaskDeadlineChange(section.id, task.id, val)}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <CustomStatusDropdown
                                        status={task.status}
                                        disabled={false}
                                        isNearBottom={isNearBottom}
                                        onChange={(val) => handleTaskStatusChange(section.id, task.id, val)}
                                      />
                                    </td>
                                  {canManage && (
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditTask(section.id, task)}
                                          className="dots-btn inline-grid text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                                          title="Edit task"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTask(section.id, task.id)}
                                          className="dots-btn inline-grid text-slate-400 hover:text-red-600 hover:bg-red-50"
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
