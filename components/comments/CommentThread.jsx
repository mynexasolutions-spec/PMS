"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";
import { stamp } from "@/lib/datetime";
import { isManager, roleLabel } from "@/lib/permissions";

const MAX = 1000;

/**
 * A timestamped discussion. `scope` is "task", "todo" or "day" and `refId` is that item's id (or the date for "day").
 * Everyone on the team can read and add; you can delete your own comments, managers can delete any.
 */
export default function CommentThread({ scope, refId, placeholder = "Write a comment...", empty = "No comments yet. Start the discussion.", compact = false }) {
  const { currentUser, setCommentCount, notify } = useApp();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setComments(null);
    request(`/api/comments?scope=${scope}&ref=${encodeURIComponent(refId)}`).then(({ ok, data }) => {
      if (cancelled) return;
      setComments(ok ? data.comments : []);
      if (!ok) notify(data?.error ?? "The comments could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [scope, refId, notify]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments?.length]);

  async function post(event) {
    event?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const { ok, data } = await request("/api/comments", "POST", { scope, ref: String(refId), body: text });
    setBusy(false);
    if (!ok) return notify(data?.error ?? "The comment could not be posted.");
    setComments((current) => [...(current ?? []), data.comment]);
    setCount(data.count);
    setText("");
  }

  const setCount = (count) => setCommentCount(scope, String(refId), count);

  async function remove(comment) {
    const { ok } = await request(`/api/comments/${comment.id}`, "DELETE");
    if (!ok) return notify("The comment could not be deleted.");
    setComments((current) => {
      const next = current.filter((item) => item.id !== comment.id);
      setCount(next.length);
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-col">
      <ul ref={listRef} className={`space-y-3.5 overflow-y-auto pr-1 ${compact ? "max-h-[300px]" : "max-h-[380px]"}`}>
        {comments === null && <li className="py-6 text-center text-[14px] text-muted">Loading...</li>}
        {comments?.length === 0 && <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[14px] text-muted">{empty}</li>}
        {comments?.map((comment) => {
          const when = stamp(comment.createdAt);
          const mine = comment.authorId === currentUser.id;
          return (
            <li key={comment.id} className="flex gap-3">
              <Avatar id={comment.authorId} name={comment.authorName ?? "Former member"} size={compact ? 32 : 36} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <b className="text-[14.5px]">{comment.authorName ?? "Former member"}</b>
                  {comment.authorRole && comment.authorRole !== "member" && (
                    <span className="rounded bg-[#eef3ef] px-1.5 py-px text-[11px] font-semibold text-ink/70">{roleLabel[comment.authorRole]}</span>
                  )}
                  <time className="text-[12.5px] text-muted" title={when.full}>
                    {when.label}
                  </time>
                  {(mine || isManager(currentUser)) && (
                    <button className="ml-auto rounded p-1 text-ink/40 hover:bg-red-50 hover:text-red-600" aria-label="Delete comment" onClick={() => remove(comment)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[14.5px] leading-snug text-ink/90">{comment.body}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Modern Full-Width Composer Box */}
      <form onSubmit={post} className="mt-3.5 rounded-xl border border-line/80 bg-white p-2.5 shadow-xs transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          value={text}
          maxLength={MAX}
          rows={3}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) post(event);
          }}
          placeholder={placeholder}
          className="block w-full resize-none bg-transparent text-[13.5px] outline-none placeholder:text-muted/80 leading-relaxed custom-scrollbar"
        />

        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2">
          <div className="flex items-center gap-2 text-[11.5px] text-muted">
            <Avatar user={currentUser} size={20} />
            <span>Ctrl + Enter</span>
          </div>

          <button
            type="submit"
            className="btn-primary !h-8 !px-3.5 !text-[12.5px] font-semibold gap-1.5 shadow-xs disabled:opacity-50"
            disabled={busy || !text.trim()}
            aria-label="Post comment"
          >
            <Send size={13} /> Post
          </button>
        </div>
      </form>
    </div>
  );
}
