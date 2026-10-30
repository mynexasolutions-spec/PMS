"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, FolderKanban, Calendar, Menu } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { tasks, completed, projects, setSidebarOpen } = useApp();

  const nav = [
    { label: "Overview", icon: LayoutGrid, href: "/" },
    { label: "Tasks", icon: ShieldCheck, href: "/tasks", badge: tasks.length - completed },
    { label: "Projects", icon: FolderKanban, href: "/projects", badge: projects.length },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
  ];

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-30 flex h-[62px] items-center justify-around border-t border-line bg-white/95 px-2 backdrop-blur-lg lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      {nav.map(({ label, icon: Icon, href, badge }) => {
        const active = isActive(href);
        return (
          <Link
            key={label}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              active ? "text-brand-800 font-semibold" : "text-ink/60 hover:text-ink"
            }`}
          >
            <div className="relative">
              <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -right-2 -top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[11px] leading-tight">{label}</span>
          </Link>
        );
      })}

      <button
        onClick={() => setSidebarOpen(true)}
        className="flex flex-1 flex-col items-center justify-center py-1 text-ink/60 hover:text-ink transition-colors"
        aria-label="More menu"
      >
        <Menu size={21} strokeWidth={1.7} />
        <span className="mt-1 text-[11px] leading-tight">More</span>
      </button>
    </nav>
  );
}
