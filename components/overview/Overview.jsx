"use client";

import { useApp } from "@/components/AppProvider";
import Greeting from "./Greeting";
import StatCards from "./StatCards";
import TodoBoard from "./TodoBoard";
import ProjectProgress from "./ProjectProgress";
import DeadlineCard from "./DeadlineCard";
import WeekChart from "./WeekChart";
import StickyBoard from "@/components/sticky/StickyBoard";
import IssueBoard from "@/components/issues/IssueBoard";

const twoCols = "grid gap-[17px] xl:grid-cols-[minmax(0,1.58fr)_minmax(0,1fr)]";

export default function Overview() {
  const { tasks, todayTodos, todayDate, filterTasks, currentUser } = useApp();

  // Personal todos for the logged-in user on today's board
  const personalTodayTodos = todayTodos.filter(
    (todo) => todo.assigneeId === currentUser?.id || todo.createdBy === currentUser?.id,
  );

  // Personal tasks assigned to the logged-in user
  const personalTasks = tasks.filter((task) => task.assigneeId === currentUser?.id);

  return (
    <div className="space-y-[14px] px-3.5 pb-6 pt-3.5 sm:px-5 md:px-[30px]">
      <Greeting />
      <StatCards />

      {/* Row 1: Today's Personal To-Do & Sticky Notes */}
      <div className={twoCols}>
        <TodoBoard title="Personal To-Do Board" date={todayDate} todos={personalTodayTodos} />
        <StickyBoard compact />
      </div>

      {/* Row 2: Project Progress & Deadlines */}
      <div className={twoCols}>
        <div className="min-w-0 flex flex-col">
          <ProjectProgress />
        </div>
        <div className="min-w-0 flex flex-col justify-between gap-[14px]">
          <DeadlineCard />
          <WeekChart />
        </div>
      </div>

      {/* Row 3: Personal Kanban Board */}
      <IssueBoard
        tasks={filterTasks(personalTasks)}
        eyebrow="Personal Workspace"
        title="Personal Kanban Board"
        subtitle={`${personalTasks.length} task${personalTasks.length === 1 ? "" : "s"} assigned to you across projects`}
      />
    </div>
  );
}
