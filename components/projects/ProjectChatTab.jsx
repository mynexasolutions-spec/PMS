"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Send,
  Smile,
  Shield,
  Trash2,
  CheckCheck,
  RotateCcw,
  Users,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";

const QUICK_EMOJIS = ["👍", "🚀", "✅", "🔥", "👀", "🙌", "🎉"];

function formatTime(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(`${dateString.replace(" ", "T")}Z`);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateLabel(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(`${dateString.replace(" ", "T")}Z`);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", year: "numeric" }).format(d);
  } catch {
    return "";
  }
}

export default function ProjectChatTab({ project, onMessagesRead }) {
  const { currentUser, notify } = useApp();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [deletingMsg, setDeletingMsg] = useState(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewIncoming, setHasNewIncoming] = useState(false);

  const chatContainerRef = useRef(null);
  const isInitialLoadedRef = useRef(false);
  const isNearBottomRef = useRef(true);

  const isProjAdmin =
    project?.isProjectAdmin ||
    project?.createdBy === currentUser?.id ||
    (project?.members || []).some((m) => m.userId === currentUser?.id && m.role === "admin");

  // Pure container-only scroll to bottom (NEVER scrolls the window or page!)
  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (behavior === "smooth") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setHasNewIncoming(false);
  }, []);

  // Handle user scroll detection
  function handleScroll() {
    const el = chatContainerRef.current;
    if (!el) return;
    // User is near bottom if within 90px of bottom
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceToBottom < 90;
    isNearBottomRef.current = near;
    setIsNearBottom(near);
    if (near) {
      setHasNewIncoming(false);
    }
  }

  // Load chat messages with smart change detection (Prevents scroll flickering)
  async function fetchMessages(showLoader = false) {
    if (showLoader && !isInitialLoadedRef.current) setLoading(true);
    const { ok, data } = await request(`/api/projects/${project.id}/chat?markRead=1`);
    if (showLoader) setLoading(false);

    if (ok) {
      onMessagesRead?.();
    }

    if (ok && Array.isArray(data?.messages)) {
      setMessages((prev) => {
        // Compare previous vs new to avoid unnecessary re-renders & scroll jumps
        if (prev.length === data.messages.length) {
          const lastPrev = prev[prev.length - 1];
          const lastNew = data.messages[data.messages.length - 1];
          if (lastPrev?.id === lastNew?.id && lastPrev?.message === lastNew?.message) {
            return prev; // Same messages, keep reference intact
          }
        }

        // Initial first load: scroll to bottom instantly once
        if (!isInitialLoadedRef.current) {
          isInitialLoadedRef.current = true;
          setTimeout(() => scrollToBottom("auto"), 30);
          return data.messages;
        }

        // Subsequent updates: only scroll down if user is ALREADY at the bottom!
        // If user scrolled up to read past messages, DO NOT force scroll down.
        if (isNearBottomRef.current) {
          setTimeout(() => scrollToBottom("smooth"), 30);
        } else {
          setHasNewIncoming(true);
        }

        return data.messages;
      });
    }
  }

  // Initial load + 3s live polling interval
  useEffect(() => {
    isInitialLoadedRef.current = false;
    fetchMessages(true);
    const timer = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [project.id]);

  // Send message
  async function handleSend(e) {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Optimistic message
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: isProjAdmin ? "admin" : "member",
      message: trimmed,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setShowEmojis(false);
    setSending(true);

    // Scroll to bottom immediately on own sent message
    setTimeout(() => scrollToBottom("smooth"), 30);

    const { ok, data } = await request(`/api/projects/${project.id}/chat`, "POST", {
      message: trimmed,
    });
    setSending(false);

    if (!ok) {
      notify(data?.error ?? "Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    // Replace optimistic message with saved one
    setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
    setTimeout(() => scrollToBottom("smooth"), 30);
  }

  // Delete message handler (Delete for me vs Delete for everyone)
  async function confirmDeleteMessage(msgId, mode) {
    setDeletingMsg(null);
    // Optimistic UI update: remove from local state immediately
    setMessages((prev) => prev.filter((m) => m.id !== msgId));

    const { ok, data } = await request(
      `/api/projects/${project.id}/chat?messageId=${msgId}&mode=${mode}`,
      "DELETE"
    );

    if (!ok) {
      notify(data?.error ?? "Could not delete message.");
      fetchMessages(false);
      return;
    }

    if (mode === "me") {
      notify("Message deleted for you.");
    } else {
      notify("Message deleted for everyone.");
    }
  }

  // Group messages by Date for WhatsApp style dividers
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groups.push({ type: "divider", label: dateLabel });
      }
      groups.push({ type: "message", data: msg });
    });

    return groups;
  }, [messages]);

  const acceptedMembersCount = (project.members || []).filter((m) => m.status !== "pending").length || 1;

  return (
    <div className="panel overflow-hidden border border-line shadow-card flex flex-col h-[650px] max-h-[82vh] bg-[#f2f5f3] relative">
      {/* ---------------- 1. CHAT HEADER (WhatsApp Style) ---------------- */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-line/80 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white font-bold shadow-xs text-[15px]"
            style={{ backgroundColor: project.color || "#2e9e4f" }}
          >
            {project.name.charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[15.5px] text-ink truncate leading-tight">
                {project.name} Team Chat
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-[12.5px] text-muted flex items-center gap-1.5 mt-0.5 truncate">
              <Users size={12} className="shrink-0" /> {acceptedMembersCount} member{acceptedMembersCount === 1 ? "" : "s"} in room
              <span className="text-black/20">·</span>
              <span className="text-brand-700 inline-flex items-center gap-0.5">
                <Shield size={11} /> Project member private
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-black/5 hover:text-ink transition"
          title="Refresh chat"
        >
          <RotateCcw size={15} />
        </button>
      </header>

      {/* ---------------- 2. MESSAGES CONTAINER ---------------- */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar overscroll-contain relative"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage: `radial-gradient(#0000000a 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="py-20 text-center text-muted text-[13.5px]">
            <p className="animate-pulse">Loading project chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-muted max-w-sm mx-auto">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-xs text-brand-700 mb-2.5">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold text-[15px] text-ink">Welcome to {project.name} Chat!</h4>
            <p className="text-[13px] mt-1 text-muted">
              This is the dedicated live chat room for all team members. Say hello to get started!
            </p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === "divider") {
              return (
                <div key={`divider-${idx}`} className="flex justify-center my-2">
                  <span className="rounded-lg bg-white/90 border border-black/5 px-3 py-0.5 text-[11px] font-bold text-ink/65 shadow-2xs uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              );
            }

            const msg = item.data;
            const isMe = msg.userId === currentUser?.id;
            // Admin can delete any message; Team member can ONLY delete their own messages
            const canDelete = isMe || isProjAdmin;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 group ${isMe ? "justify-end" : "justify-start"}`}
              >
                {/* Author Avatar on incoming messages */}
                {!isMe && (
                  <Avatar name={msg.userName} id={msg.userId} size={28} className="shrink-0 mb-0.5" />
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-[14px] shadow-xs leading-relaxed transition ${
                    isMe
                      ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-[#c1eec0]/60"
                      : "bg-white text-[#111b21] rounded-tl-xs border border-line/60"
                  }`}
                >
                  {/* Sender Name on incoming messages */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-0.5 font-bold text-[12px] text-brand-800">
                      <span>{msg.userName}</span>
                      {msg.userRole === "admin" && (
                        <span className="rounded bg-amber-100 text-amber-800 px-1 py-0.2 text-[9.5px] font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                  {/* Time + Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-0.5 text-[10.5px] text-ink/45 select-none">
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <CheckCheck size={14} className="text-brand-600 stroke-[2.2]" />
                    )}
                  </div>

                  {/* WhatsApp Style Delete Icon on hover */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeletingMsg(msg)}
                      className={`absolute -top-2 ${
                        isMe ? "-left-2" : "-right-2"
                      } hidden group-hover:grid h-5 w-5 place-items-center rounded-full bg-white border border-line shadow-xs text-muted hover:text-red-600 hover:bg-red-50 transition`}
                      title={isMe ? "Delete message" : "Delete message (Admin)"}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating scroll to bottom pill */}
      {(!isNearBottom || hasNewIncoming) && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-20 right-6 flex items-center gap-1.5 rounded-full bg-white/95 border border-line shadow-lg text-ink/80 hover:text-ink px-3 py-1.5 hover:bg-white transition z-20 text-[12px] font-semibold backdrop-blur-xs"
          title="Scroll to bottom"
        >
          <ChevronDown size={15} />
          {hasNewIncoming ? (
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              New messages
            </span>
          ) : (
            <span>Bottom</span>
          )}
        </button>
      )}

      {/* ---------------- 3. INPUT BAR (WhatsApp Style) ---------------- */}
      <footer className="p-2.5 sm:p-3 bg-white border-t border-line/80 shrink-0 z-10 relative">
        {/* Quick Emoji Bar Toggle */}
        {showEmojis && (
          <div className="absolute bottom-full left-4 mb-2 flex items-center gap-1 rounded-xl bg-white p-1.5 border border-line shadow-lg">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setText((cur) => cur + emoji)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[18px] hover:bg-black/5 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojis((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink/50 hover:text-ink hover:bg-black/5 transition"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>

          {/* Input text */}
          <input
            type="text"
            required
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${project.name} team... (Press Enter to send)`}
            className="flex-1 h-[42px] rounded-xl border border-line bg-[#f8faf9] px-3.5 text-[14px] text-ink outline-none focus:border-brand-500 focus:bg-white transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-brand-700 text-white shadow-xs hover:bg-brand-800 disabled:opacity-40 disabled:pointer-events-none transition"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>

      {/* ---------------- 4. WHATSAPP STYLE DELETE MODAL ---------------- */}
      {deletingMsg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          onClick={() => setDeletingMsg(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={18} />
              </div>
              <div>
                <h4 className="font-bold text-[16px] text-ink leading-tight">Delete message?</h4>
                {deletingMsg.userId !== currentUser?.id && isProjAdmin && (
                  <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                    🛡️ Admin moderation action
                  </p>
                )}
              </div>
            </div>

            {/* Snippet preview */}
            <div className="my-3 rounded-xl bg-[#f7f9f8] p-3 text-[13px] text-ink/75 italic line-clamp-3 border border-line/60">
              "{deletingMsg.message}"
            </div>

            <p className="text-[12.5px] text-muted mb-4">
              {deletingMsg.userId === currentUser?.id
                ? "You can delete this message for everyone in this project or just remove it from your own view."
                : "As a Project Admin, you can remove this member's message for all project participants or remove it just for yourself."}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmDeleteMessage(deletingMsg.id, "everyone")}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-red-700 transition"
              >
                Delete for everyone
              </button>

              <button
                type="button"
                onClick={() => confirmDeleteMessage(deletingMsg.id, "me")}
                className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-[13.5px] font-semibold text-ink hover:bg-zinc-200 transition"
              >
                Delete for me
              </button>

              <button
                type="button"
                onClick={() => setDeletingMsg(null)}
                className="w-full rounded-xl px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
