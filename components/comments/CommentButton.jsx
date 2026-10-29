"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Modal from "@/components/ui/Modal";
import CommentThread from "./CommentThread";

/** A small "💬 3" button for a task or to-do card; it opens that item's discussion. */
export default function CommentButton({ scope, refId, title }) {
  const { commentCounts } = useApp();
  const [open, setOpen] = useState(false);
  const count = commentCounts[`${scope}:${refId}`] ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={`${count} comment${count === 1 ? "" : "s"}. Open discussion`}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] font-medium transition hover:bg-[#e8f3ec] ${count ? "text-brand-700" : "text-ink/50"}`}
      >
        <MessageSquare size={15} fill={count ? "currentColor" : "none"} fillOpacity={0.15} />
        {count > 0 && count}
      </button>
      {open && (
        <Modal icon={<MessageSquare size={26} />} eyebrow={scope === "todo" ? "To-do discussion" : "Task discussion"} title={title} onClose={() => setOpen(false)}>
          <CommentThread scope={scope} refId={refId} />
        </Modal>
      )}
    </>
  );
}
