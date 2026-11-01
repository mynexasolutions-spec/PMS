import { getDb } from "../lib/db/index.js";
import { getProjects, createTask, getTasks } from "../lib/db/repo.js";

const SECTIONS = [
  {
    category: "Google Ads Campaign – Meagle360 HRMS",
    tasks: [
      {
        title: "Create Google Ads campaign",
        description: "Campaign structure and objective",
        dueAt: "2026-10-31",
        priority: "medium",
      },
      {
        title: "Finalize audience and targeting",
        description: "Define target segments, locations and audience",
        dueAt: "2026-10-31",
        priority: "medium",
      },
      {
        title: "Prepare keywords and ad groups",
        description: "Keyword research; organize ad groups",
        dueAt: "2026-10-31",
        priority: "medium",
      },
      {
        title: "Create ad copies and creatives",
        description: "Write headlines, descriptions and prepare creatives",
        dueAt: "2026-10-31",
        priority: "medium",
      },
      {
        title: "Configure tracking and landing page",
        description: "Set up conversion tracking; review landing page",
        dueAt: "2026-10-31",
        priority: "medium",
      },
      {
        title: "Review and launch campaign",
        description: "Final QA and campaign activation",
        dueAt: "2026-11-01",
        priority: "high",
      },
    ],
  },
  {
    category: "Nexa Solutions – Marketing Video Scripts",
    tasks: [
      {
        title: "Create 2 Aligarh-specific scripts",
        description: "Local audience, business pain points and CTA",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Create 3 general ad scripts",
        description: "Broad audience-focused scripts for paid campaigns",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Finalize scripts",
        description: "Review hooks, messaging and CTAs; prepare for production",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Meagle360 HRMS – Advertising Scripts",
    tasks: [
      {
        title: "Create advertising script 1",
        description: "Highlight HRMS problem-solution and key benefits",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Create advertising script 2",
        description: "Different campaign angle and audience hook",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Finalize scripts for production",
        description: "Add CTA for demo/inquiry and approve final drafts",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Project Onboarding & Delivery",
    tasks: [
      {
        title: "Onboard 30 new projects",
        description: "Lead conversion and project onboarding",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Deliver 20+ projects",
        description: "Complete development, QA and client handover",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Track project progress",
        description: "Monitor owners, deadlines, blockers and approvals",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Meagle360 HRMS – Customer Acquisition",
    tasks: [
      {
        title: "Acquire 10 clients",
        description: "Convert qualified prospects into customers",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Generate and qualify leads",
        description: "Use Google Ads and other lead-generation channels",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Conduct product demos",
        description: "Schedule and deliver demos to interested prospects",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Follow up and close prospects",
        description: "Track follow-ups, objections and conversions",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Hiring & Team Expansion",
    tasks: [
      {
        title: "Hire 4 sales interns",
        description: "Publish role, source candidates and shortlist",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Finalize 1 full-time candidate",
        description: "Interview, evaluate and select one candidate",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Complete onboarding",
        description: "Documentation, role clarity and initial training",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Pending Project Completion & Payment Recovery",
    tasks: [
      {
        title: "Sidra Store",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "TRS Fitness",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Home Care AC",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Al Qirat",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "West Camp Jaisalmer",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Bhoomindar",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "HS Agro Food",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Z&M BUILDCON LLP",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "SK AC Repair",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Paramedical New",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "AR Garments",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Huda",
        description: "Complete pending work, obtain approval, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Naye Leithe",
        description: "Confirm exact project/client name; complete, deliver and collect payment",
        dueAt: "2026-11-30",
        priority: "high",
      },
    ],
  },
  {
    category: "Nexa Solutions – Social Media Content",
    tasks: [
      {
        title: "Prepare 30-day content calendar",
        description: "Plan topics, formats and publishing dates",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Produce at least 25 videos",
        description: "Create, edit and approve short-form marketing videos",
        dueAt: "2026-11-30",
        priority: "high",
      },
      {
        title: "Create 5–6 carousel posts",
        description: "Educational, informative and brand-building content",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Prepare captions and CTAs",
        description: "Write platform-ready captions, hooks and calls to action",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Schedule and publish content",
        description: "Maintain consistent publishing across selected platforms",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
  {
    category: "Meagle360 HRMS – Social Media Content Strategy",
    tasks: [
      {
        title: "Define content strategy",
        description: "Set goals, audience and positioning for the page",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Define content pillars",
        description: "Feature education, HR tips, pain points and customer value",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Prepare monthly content calendar",
        description: "Map topics, formats and publishing schedule",
        dueAt: "2026-11-30",
        priority: "medium",
      },
      {
        title: "Plan lead-generation content",
        description: "Create demo-focused posts and clear CTAs",
        dueAt: "2026-11-30",
        priority: "medium",
      },
    ],
  },
];

async function seed() {
  getDb(); // Run any database migrations including category column
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
    // Auto-detect project preference: Nexa Internal -> Nexa Solutions -> any project with "nexa" -> first project
    targetProject =
      projects.find((p) => p.name.toLowerCase() === "nexa internal") ||
      projects.find((p) => p.name.toLowerCase() === "nexa solutions") ||
      projects.find((p) => p.name.toLowerCase().includes("nexa")) ||
      projects[0];
  }

  if (!targetProject) {
    console.error("❌ No target project found in database.");
    process.exit(1);
  }

  console.log(`\n📌 Seeding Project Tasks into "To do" column`);
  console.log(`   Target Project ID: ${targetProject.id}`);
  console.log(`   Target Project Name: ${targetProject.name}\n`);

  const existingTasks = getTasks().filter((t) => t.projectId === targetProject.id);

  let createdCount = 0;
  let skippedCount = 0;

  for (const sec of SECTIONS) {
    console.log(`📁 Category: ${sec.category}`);
    for (const t of sec.tasks) {
      // Check if task already exists in this project under same category and title
      const alreadyExists = existingTasks.some(
        (existing) =>
          existing.title.toLowerCase().trim() === t.title.toLowerCase().trim() &&
          (existing.category || "").toLowerCase().trim() === sec.category.toLowerCase().trim()
      );

      if (alreadyExists) {
        console.log(`   ⏭  Skipped (already exists): "${t.title}"`);
        skippedCount++;
        continue;
      }

      const created = createTask({
        title: t.title,
        description: t.description || "",
        category: sec.category,
        type: "Task",
        status: "todo",
        priority: t.priority || "medium",
        projectId: targetProject.id,
        dueAt: t.dueAt || null,
        estimateHours: 0,
        loggedHours: 0,
      });

      console.log(`   ✅ [${created.issueKey}] ${t.title}`);
      createdCount++;
    }
  }

  console.log(`\n🎉 Seed Completed!`);
  console.log(`   Created: ${createdCount} tasks in "To do"`);
  console.log(`   Skipped: ${skippedCount} existing tasks`);
  console.log(`   Project URL: /projects/${targetProject.id}\n`);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
