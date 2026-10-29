import { Check } from "lucide-react";
import { PROJECT_STAGES } from "@/lib/constants";

// Colour of each stage (the dot/ring and the label chip).
export const STAGE_STYLES = {
  account_setup: { dot: "#f0a020", chip: "bg-[#fdf0c4] text-[#8a6508]" },
  working: { dot: "#2b6fd6", chip: "bg-[#e4efff] text-[#2b5fd6]" },
  in_progress: { dot: "#7c3aed", chip: "bg-[#efe7fc] text-[#5b2bb0]" },
  complete: { dot: "#1f9d55", chip: "bg-[#dcf3e1] text-[#2d7a45]" },
};

export const stageIndex = (stage) => Math.max(0, PROJECT_STAGES.findIndex((item) => item.id === stage));
export const stageLabel = (stage) => PROJECT_STAGES[stageIndex(stage)].label;

/** Small coloured label with the project's current stage. */
export function StageChip({ stage, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${STAGE_STYLES[stage]?.chip ?? ""} ${className}`}>
      <i className="h-[7px] w-[7px] rounded-full" style={{ background: STAGE_STYLES[stage]?.dot }} />
      {stageLabel(stage)}
    </span>
  );
}

/** Four thin segments (done / current / upcoming) with the current stage written beside them. For cards and rows. */
export function StageBar({ stage }) {
  const current = stageIndex(stage);
  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label={`Stage ${current + 1} of ${PROJECT_STAGES.length}: ${stageLabel(stage)}`}>
        {PROJECT_STAGES.map((item, index) => (
          <span
            key={item.id}
            className="h-[6px] flex-1 rounded-full"
            style={{ background: index < current ? "#1f9d55" : index === current ? STAGE_STYLES[stage].dot : "#e3e8e5" }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[12.5px] text-ink/70">
        Stage {current + 1}/{PROJECT_STAGES.length} · <b className="font-semibold text-ink">{stageLabel(stage)}</b>
      </p>
    </div>
  );
}

/** Full-width stepper. With `onChange` each step is a button, so the team can move the project forward (or back). */
export function StageStepper({ stage, onChange }) {
  const current = stageIndex(stage);

  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {PROJECT_STAGES.map((item, index) => {
        const done = index < current;
        const active = index === current;
        const style = STAGE_STYLES[item.id];
        return (
          <li key={item.id} className="flex min-w-[150px] flex-1 items-center">
            <button
              type="button"
              disabled={!onChange}
              aria-current={active ? "step" : undefined}
              onClick={() => onChange?.(item.id)}
              className="group flex items-center gap-3 rounded-xl text-left transition enabled:hover:opacity-90 disabled:cursor-default"
            >
              <span
                className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 text-[14px] font-bold transition ${
                  done ? "border-brand-600 bg-brand-600 text-white" : active ? "bg-white" : "border-line bg-[#f3f6f4] text-ink/45"
                }`}
                style={active ? { borderColor: style.dot, color: style.dot, boxShadow: `0 0 0 4px ${style.dot}22` } : undefined}
              >
                {done ? <Check size={18} strokeWidth={3} /> : index + 1}
              </span>
              <span className="leading-tight">
                <span className={`block text-[14.5px] ${active ? "font-bold text-ink" : done ? "font-semibold text-ink/80" : "font-medium text-ink/55"}`}>{item.label}</span>
                <span className="block text-[12px] text-muted">{done ? "Done" : active ? "Current stage" : "Upcoming"}</span>
              </span>
            </button>
            {index < PROJECT_STAGES.length - 1 && <span className={`mx-3 hidden h-[3px] min-w-[24px] flex-1 rounded-full sm:block ${done ? "bg-brand-500" : "bg-[#e3e8e5]"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
