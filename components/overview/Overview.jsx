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
  const { tasks, todayTodos, todayDate, filterTasks, currentUser, isMember, myTasks } = useApp();
  const visibleTasks = isMember ? myTasks : tasks;

  return (
    <div className="space-y-[14px] px-3.5 pb-6 pt-3.5 sm:px-5 md:px-[30px]">
      <Greeting />
      <StatCards />
      
      {/* Row 1: Today's To-Do & Sticky Notes */}
      <div className={twoCols}>
        <TodoBoard title="Today's To-Do Board" date={todayDate} todos={todayTodos.filter((todo) => todo.assigneeId === currentUser.id)} />
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

      {/* Row 3: Full-width Task Board */}
      <IssueBoard
        tasks={filterTasks(visibleTasks)}
        eyebrow={isMember ? "Assigned to me" : "All projects"}
        title={isMember ? "My task board" : "Task board"}
        subtitle={
          isMember
            ? `${visibleTasks.length} tasks assigned to you`
            : `${tasks.length} tasks · ${tasks.filter((task) => task.parentId).length} sub-tasks linked to a parent`
        }
      />
    </div>
  );
}
