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

const twoCols = "grid grid-cols-[minmax(0,1fr)] gap-[14px] sm:gap-[17px] md:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.58fr)_minmax(0,1fr)] items-start";

export default function Overview() {
  const { tasks, todayTodos, todayDate, filterTasks, currentUser } = useApp();

  // Personal todos for the logged-in user on today's board
  const personalTodayTodos = todayTodos.filter(
    (todo) => todo.assigneeId === currentUser?.id || todo.createdBy === currentUser?.id,
  );

  // Personal tasks (standalone, not tied to any project) for the logged-in user
  const personalTasks = tasks.filter(
    (task) => !task.projectId && (task.assigneeId === currentUser?.id || task.createdBy === currentUser?.id),
  );

  return (
    <div className="space-y-[14px] px-3.5 pb-6 pt-3.5 sm:px-5 md:px-[30px]">
      <Greeting />
      <StatCards />

      {/* Row 1: Today's Personal To-Do & Sticky Notes */}
      <div className={twoCols}>
        <div className="min-w-0">
          <TodoBoard title="Personal To-Do Board" date={todayDate} todos={personalTodayTodos} />
        </div>
        <div className="min-w-0">
          <StickyBoard compact />
        </div>
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
        projectId={null}
        isPersonal={true}
        eyebrow="Personal Workspace"
        title="Personal Kanban Board"
        subtitle={`${personalTasks.length} personal task${personalTasks.length === 1 ? "" : "s"}`}
      />
    </div>
  );
}
