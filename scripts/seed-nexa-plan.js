import { getDb } from "../lib/db/index.js";
import {
  createProjectActionPlan,
  getProjectActionPlanByMonth,
  getProjects,
  updateProjectActionPlan,
} from "../lib/db/repo.js";

const PLAN_DATA = {
  monthYear: "2026-11",
  title: "Monthly Targets & Action Plan | November 2026",
  prepDeadline: "2026-10-31",
  execStart: "2026-11-01",
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
    {
      id: "sec-1",
      name: "1. Google Ads Campaign – Meagle360 HRMS",
      tasks: [
        { id: "1.1", task: "Create Google Ads campaign", subtask: "Campaign structure and objective", deadline: "2026-10-31", status: "not_started" },
        { id: "1.2", task: "Finalize audience and targeting", subtask: "Define target segments, locations and audience", deadline: "2026-10-31", status: "not_started" },
        { id: "1.3", task: "Prepare keywords and ad groups", subtask: "Keyword research; organize ad groups", deadline: "2026-10-31", status: "not_started" },
        { id: "1.4", task: "Create ad copies and creatives", subtask: "Write headlines, descriptions and prepare creatives", deadline: "2026-10-31", status: "not_started" },
        { id: "1.5", task: "Configure tracking and landing page", subtask: "Set up conversion tracking; review landing page", deadline: "2026-10-31", status: "not_started" },
        { id: "1.6", task: "Review and launch campaign", subtask: "Final QA and campaign activation", deadline: "2026-11-01", status: "not_started" },
      ],
    },
    {
      id: "sec-2",
      name: "2. Nexa Solutions – Marketing Video Scripts",
      tasks: [
        { id: "2.1", task: "Create 2 Aligarh-specific scripts", subtask: "Local audience, business pain points and CTA", deadline: "2026-11-30", status: "not_started" },
        { id: "2.2", task: "Create 3 general ad scripts", subtask: "Broad audience-focused scripts for paid campaigns", deadline: "2026-11-30", status: "not_started" },
        { id: "2.3", task: "Finalize scripts", subtask: "Review hooks, messaging and CTAs; prepare for production", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-3",
      name: "3. Meagle360 HRMS – Advertising Scripts",
      tasks: [
        { id: "3.1", task: "Create advertising script 1", subtask: "Highlight HRMS problem-solution and key benefits", deadline: "2026-11-30", status: "not_started" },
        { id: "3.2", task: "Create advertising script 2", subtask: "Different campaign angle and audience hook", deadline: "2026-11-30", status: "not_started" },
        { id: "3.3", task: "Finalize scripts for production", subtask: "Add CTA for demo/inquiry and approve final drafts", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-4",
      name: "4. Project Onboarding & Delivery",
      tasks: [
        { id: "4.1", task: "Onboard 30 new projects", subtask: "Lead conversion and project onboarding", deadline: "2026-11-30", status: "not_started" },
        { id: "4.2", task: "Deliver 20+ projects", subtask: "Complete development, QA and client handover", deadline: "2026-11-30", status: "not_started" },
        { id: "4.3", task: "Track project progress", subtask: "Monitor owners, deadlines, blockers and approvals", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-5",
      name: "5. Meagle360 HRMS – Customer Acquisition",
      tasks: [
        { id: "5.1", task: "Acquire 10 clients", subtask: "Convert qualified prospects into customers", deadline: "2026-11-30", status: "not_started" },
        { id: "5.2", task: "Generate and qualify leads", subtask: "Use Google Ads and other lead-generation channels", deadline: "2026-11-30", status: "not_started" },
        { id: "5.3", task: "Conduct product demos", subtask: "Schedule and deliver demos to interested prospects", deadline: "2026-11-30", status: "not_started" },
        { id: "5.4", task: "Follow up and close prospects", subtask: "Track follow-ups, objections and conversions", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-6",
      name: "6. Hiring & Team Expansion",
      tasks: [
        { id: "6.1", task: "Hire 4 sales interns", subtask: "Publish role, source candidates and shortlist", deadline: "2026-11-30", status: "not_started" },
        { id: "6.2", task: "Finalize 1 full-time candidate", subtask: "Interview, evaluate and select one candidate", deadline: "2026-11-30", status: "not_started" },
        { id: "6.3", task: "Complete onboarding", subtask: "Documentation, role clarity and initial training", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-7",
      name: "7. Pending Project Completion & Payment Recovery",
      tasks: [
        { id: "7.1", task: "Sidra Store", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.2", task: "TRS Fitness", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.3", task: "Home Care AC", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.4", task: "Al Qirat", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.5", task: "West Camp Jaisalmer", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.6", task: "Bhoomindar", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.7", task: "HS Agro Food", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.8", task: "Z&M BUILDCON LLP", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.9", task: "SK AC Repair", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.10", task: "Paramedical New", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.11", task: "AR Garments", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.12", task: "Huda", subtask: "Complete pending work, obtain approval, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
        { id: "7.13", task: "Naye Leithe", subtask: "Confirm exact project/client name; complete, deliver and collect payment", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-8",
      name: "8. Nexa Solutions – Social Media Content",
      tasks: [
        { id: "8.1", task: "Prepare 30-day content calendar", subtask: "Plan topics, formats and publishing dates", deadline: "2026-11-30", status: "not_started" },
        { id: "8.2", task: "Produce at least 25 videos", subtask: "Create, edit and approve short-form marketing videos", deadline: "2026-11-30", status: "not_started" },
        { id: "8.3", task: "Create 5–6 carousel posts", subtask: "Educational, informative and brand-building content", deadline: "2026-11-30", status: "not_started" },
        { id: "8.4", task: "Prepare captions and CTAs", subtask: "Write platform-ready captions, hooks and calls to action", deadline: "2026-11-30", status: "not_started" },
        { id: "8.5", task: "Schedule and publish content", subtask: "Maintain consistent publishing across selected platforms", deadline: "2026-11-30", status: "not_started" },
      ],
    },
    {
      id: "sec-9",
      name: "9. Meagle360 HRMS – Social Media Content Strategy",
      tasks: [
        { id: "9.1", task: "Define content strategy", subtask: "Set goals, audience and positioning for the page", deadline: "2026-11-30", status: "not_started" },
        { id: "9.2", task: "Define content pillars", subtask: "Feature education, HR tips, pain points and customer value", deadline: "2026-11-30", status: "not_started" },
        { id: "9.3", task: "Prepare monthly content calendar", subtask: "Map topics, formats and publishing schedule", deadline: "2026-11-30", status: "not_started" },
        { id: "9.4", task: "Plan lead-generation content", subtask: "Create demo-focused posts and clear CTAs", deadline: "2026-11-30", status: "not_started" },
      ],
    },
  ],
};

async function seed() {
  getDb(); // Ensure database tables are created & migrated
  const projects = getProjects();

  const targetArg = process.argv[2];
  let targetProject = null;

  if (targetArg) {
    const idNum = Number(targetArg);
    if (!isNaN(idNum)) {
      targetProject = projects.find((p) => p.id === idNum);
    } else {
      targetProject = projects.find(
        (p) => p.name.toLowerCase() === targetArg.toLowerCase()
      );
    }
  }

  if (!targetProject) {
    // Auto-detect project: match Nexa Solutions or Nexa Internal or any Nexa project
    targetProject =
      projects.find((p) => p.name.toLowerCase() === "nexa solutions") ||
      projects.find((p) => p.name.toLowerCase() === "nexa internal") ||
      projects.find((p) => p.name.toLowerCase().includes("nexa")) ||
      projects[0];
  }

  if (!targetProject) {
    console.error("❌ No projects found in database.");
    process.exit(1);
  }

  console.log(`\n📌 Seeding November 2026 Action Plan for Project:`);
  console.log(`   ID: ${targetProject.id}`);
  console.log(`   Name: ${targetProject.name}\n`);

  const existing = getProjectActionPlanByMonth(targetProject.id, PLAN_DATA.monthYear);

  let plan;
  if (existing) {
    console.log(`🔄 Updating existing plan (ID: ${existing.id})...`);
    plan = updateProjectActionPlan(existing.id, {
      title: PLAN_DATA.title,
      prepDeadline: PLAN_DATA.prepDeadline,
      execStart: PLAN_DATA.execStart,
      kpis: PLAN_DATA.kpis,
      sections: PLAN_DATA.sections,
    });
  } else {
    console.log(`✨ Creating new monthly plan...`);
    plan = createProjectActionPlan({
      projectId: targetProject.id,
      monthYear: PLAN_DATA.monthYear,
      title: PLAN_DATA.title,
      prepDeadline: PLAN_DATA.prepDeadline,
      execStart: PLAN_DATA.execStart,
      kpis: PLAN_DATA.kpis,
      sections: PLAN_DATA.sections,
    });
  }

  let totalTasks = 0;
  plan.sections.forEach((sec) => {
    totalTasks += sec.tasks.length;
  });

  console.log(`\n✅ Successfully seeded November 2026 Plan!`);
  console.log(`   Plan ID: ${plan.id}`);
  console.log(`   Month: ${plan.monthYear}`);
  console.log(`   KPI Targets: ${plan.kpis.length} metrics`);
  console.log(`   Sections: ${plan.sections.length} pillars`);
  console.log(`   Total Action Tasks: ${totalTasks} tasks`);
  console.log(`\n🎉 View it at: /projects/${targetProject.id}?tab=plan\n`);
}

seed().catch((err) => {
  console.error("Error during seed:", err);
  process.exit(1);
});
