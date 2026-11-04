"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, FolderKanban, Calendar, Menu } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { myPendingActionsCount, projects, setSidebarOpen } = useApp();

  const normalProjectsCount = projects.filter((p) => !p.isVaultOnly).length;

  const nav = [
    { label: "Overview", icon: LayoutGrid, href: "/" },
    { label: "Tasks", icon: ShieldCheck, href: "/tasks", badge: myPendingActionsCount },
    { label: "Projects", icon: FolderKanban, href: "/projects", badge: normalProjectsCount },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
  ];

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-30 flex h-[64px] items-center justify-around border-t border-line bg-white/95 px-1.5 backdrop-blur-lg lg:hidden shadow-[0_-4px_16px_rgba(16,60,35,0.06)]"
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
            <div
              className={`relative flex h-[28px] w-[48px] items-center justify-center rounded-full transition-colors ${
                active ? "bg-[#d8f3df]" : ""
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
              {badge !== undefined && badge > 0 && (
                <span className="absolute right-0.5 -top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-2xs">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 text-[11px] leading-tight">{label}</span>
          </Link>
        );
      })}

      <button
        onClick={() => setSidebarOpen(true)}
        className="flex flex-1 flex-col items-center justify-center py-1 text-ink/60 hover:text-ink transition-colors"
        aria-label="More menu"
      >
        <div className="flex h-[28px] w-[48px] items-center justify-center rounded-full">
          <Menu size={20} strokeWidth={1.7} />
        </div>
        <span className="mt-0.5 text-[11px] leading-tight">More</span>
      </button>
    </nav>
  );
}
