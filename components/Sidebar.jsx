"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, FolderKanban, Calendar, FileText, SquareCheckBig, StickyNote, Users } from "lucide-react";
import { useApp } from "@/components/AppProvider";

const sectionLabel = "px-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink/70";
const rowBase = "relative flex items-center gap-3.5 rounded-lg px-3.5 text-[16px] transition";

export default function Sidebar() {
  const app = useApp();
  const pathname = usePathname();

  // Projects live on their own page (/projects) instead of being listed here, so the sidebar stays short.
  const nav = [
    { label: "Overview", icon: LayoutGrid, href: "/" },
    { label: app.isMember ? "My Tasks" : "All Tasks", icon: ShieldCheck, href: "/tasks", badge: app.isMember ? app.myTasks.filter((t) => t.status !== "done").length : app.tasks.length - app.completed },
    { label: "Projects", icon: FolderKanban, href: "/projects", badge: app.isMember ? app.myProjects.length : app.projects.length },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
    { label: "Notes", icon: FileText, href: "/notes", badge: app.notes.length },
    { label: "Daily To-Do", icon: SquareCheckBig, href: "/daily-todo", badge: app.openTodosToday },
    { label: "Team", icon: Users, href: "/team", badge: app.users.filter((user) => user.active).length },
    { label: "Sticky Notes", icon: StickyNote, href: "/sticky-notes", solidWhenActive: true },
  ];
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {app.sidebarOpen && <div className="fixed inset-0 z-[36] bg-ink/30 lg:hidden" onClick={() => app.setSidebarOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] shrink-0 flex-col overflow-y-auto border-r border-line bg-gradient-to-b from-[#f5fbf6] via-[#eef8f0] to-[#e7f4ea] px-[17px] pb-4 pt-[18px] transition-transform [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          app.sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 px-1.5">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-white shadow-sm ring-1 ring-black/10 p-1.5">
            <Image
              src="/logo.png"
              alt="Nexa PMS Logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="text-[25px] font-bold tracking-tight">Nexa PMS</span>
        </Link>

        <p className={`mt-8 ${sectionLabel}`}>Workspace</p>
        <nav className="mt-3 space-y-[5px]">
          {nav.map(({ label, icon: Icon, href, badge, solidWhenActive }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={href}
                className={`${rowBase} h-[44px] ${
                  active
                    ? "bg-[#cdeed4] font-semibold text-ink before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-lg before:bg-brand-500"
                    : "text-ink/85 hover:bg-white/60"
                }`}
              >
                <Icon size={22} strokeWidth={1.6} {...(active && solidWhenActive ? { fill: "#2e9e4f", stroke: "#14632f" } : {})} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-[#cdeed4] px-1.5 text-[14px] font-semibold text-brand-800">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
