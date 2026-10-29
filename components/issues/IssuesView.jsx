"use client";

import Greeting from "@/components/overview/Greeting";
import TasksPanel from "./TasksPanel";

/** The workflow board for every task across all projects. A single project has its own page (ProjectView). */
export default function IssuesView() {
  return (
    <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
      <Greeting showWave={false} showQuote={false} title="All tasks" subtitle="Plan, prioritize, and move work forward across every project." />
      <TasksPanel title="All project tasks" />
    </div>
  );
}
