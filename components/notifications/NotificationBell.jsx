"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, FolderKanban, CheckSquare, Sparkles, Clock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString.replace(" ", "T")}Z`);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

export default function NotificationBell() {
  const router = useRouter();
  const { notifications = [], unreadNotificationsCount = 0, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  function handleItemClick(notification) {
    if (!notification.read && markNotificationAsRead) {
      markNotificationAsRead(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="icon-btn relative h-10 w-10 sm:h-[46px] sm:w-[46px] transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={19} strokeWidth={1.6} />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-[330px] sm:w-[380px] rounded-2xl border border-line bg-white shadow-[0_20px_50px_rgba(16,60,35,0.22)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 bg-[#fafcfb]">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-ink">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-[11.5px] font-semibold text-[#d63a3a]">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsAsRead?.()}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:text-brand-900 transition hover:underline"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-line/60">
            {notifications && notifications.length > 0 ? (
              <>
                {notifications.map((item) => {
                  const isProject = item.title?.toLowerCase().includes("project");
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex cursor-pointer w-full text-left items-start gap-3 p-3.5 transition hover:bg-[#f2f8f4] ${
                        !item.read ? "bg-[#f0f9f3]" : "bg-white"
                      }`}
                    >
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl mt-0.5 ${
                          isProject
                            ? !item.read
                              ? "bg-[#d8f2df] text-brand-800 shadow-xs"
                              : "bg-[#eef5f0] text-brand-700/80"
                            : !item.read
                            ? "bg-[#dce9ff] text-[#2054c2] shadow-xs"
                            : "bg-[#eef3fb] text-[#3363c4]/80"
                        }`}
                      >
                        {isProject ? <FolderKanban size={17} /> : <CheckSquare size={17} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[13.5px] leading-snug truncate ${!item.read ? "font-bold text-ink" : "font-semibold text-ink/70"}`}>
                            {item.title}
                          </p>
                          <span className={`shrink-0 text-[11px] ${!item.read ? "font-medium text-brand-800" : "text-muted"}`}>
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className={`mt-0.5 text-[12.5px] leading-snug line-clamp-2 ${!item.read ? "text-ink/85 font-medium" : "text-muted"}`}>
                          {item.message}
                        </p>
                      </div>

                      {!item.read && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600 ring-2 ring-brand-200 mt-2" title="Unread" />
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-center gap-1.5 py-2 bg-[#fafcfb] border-t border-line/60 text-[11px] text-muted">
                  <Clock size={12} />
                  <span>Read notifications are kept for 7 days</span>
                </div>
              </>
            ) : (
              <div className="py-10 px-4 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0f6f2] text-brand-700">
                  <Sparkles size={22} />
                </div>
                <p className="mt-3 text-[14px] font-bold text-ink">All caught up!</p>
                <p className="mt-1 text-[12px] text-muted max-w-[240px] mx-auto">
                  When a project or task is assigned to you, it will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
