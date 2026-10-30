"use client";

import { useEffect, useRef } from "react";
import { Search, Menu } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import ProfileMenu from "@/components/auth/ProfileMenu";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Topbar() {
  const { query, setQuery, setSidebarOpen } = useApp();
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-[35] flex h-[62px] sm:h-[73px] items-center gap-2 sm:gap-3 border-b border-line bg-white/90 px-3.5 backdrop-blur-md md:px-6">
      <button className="icon-btn lg:hidden h-10 w-10 shrink-0" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <label className="flex h-10 sm:h-[46px] min-w-0 flex-1 max-w-[633px] items-center gap-2 sm:gap-3 rounded-xl border border-line bg-white px-3 sm:px-4 shadow-[0_1px_3px_rgba(16,60,35,0.05)]">
        <Search size={19} strokeWidth={1.6} className="shrink-0 text-ink/80" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] sm:text-[15px] outline-none placeholder:text-muted"
          placeholder="Search tasks, projects, notes..."
        />
        <kbd className="hidden rounded-md border border-line bg-[#f6faf7] px-2.5 py-1 font-sans text-[13px] text-ink/70 sm:block">Ctrl K</kbd>
      </label>

      <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
