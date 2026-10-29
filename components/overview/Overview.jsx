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

  return (
    <div className="space-y-[14px] px-5 pb-6 pt-4 md:px-[30px]">
      <Greeting />
      <StatCards />
      <div className={twoCols}>
        <TodoBoard title="Today's To-Do Board" date={todayDate} todos={todayTodos.filter((todo) => todo.assigneeId === currentUser.id)} />
        <StickyBoard compact />
      </div>
      <div className={twoCols}>
        <div className="min-w-0 space-y-[14px]">
          <ProjectProgress />
          <IssueBoard
            tasks={filterTasks(tasks)}
            eyebrow="All projects"
            title="Task board"
            subtitle={`${tasks.length} tasks · ${tasks.filter((task) => task.parentId).length} sub-tasks linked to a parent`}
          />
        </div>
        <div className="min-w-0 space-y-[10px]">
          <DeadlineCard />
          <WeekChart />
        </div>
      </div>
    </div>
  );
}
