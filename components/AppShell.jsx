"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import IssueModal from "@/components/modals/IssueModal";
import ProjectModal from "@/components/modals/ProjectModal";
import StickyModal from "@/components/modals/StickyModal";
import { useApp } from "@/components/AppProvider";

export default function AppShell({ children }) {
  const { issueModal, projectModalOpen, stickyModalOpen, toast } = useApp();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* overflow-x-clip (not hidden) so an over-wide child can never add a page-level horizontal scrollbar. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <Topbar />
        <main className="relative flex-1 pb-[76px] lg:pb-0">{children}</main>
        <BottomNav />
      </div>

      {issueModal && <IssueModal />}
      {projectModalOpen && <ProjectModal />}
      {stickyModalOpen && <StickyModal />}
      {toast && (
        <div role="status" className="fixed bottom-20 lg:bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-[14px] font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
