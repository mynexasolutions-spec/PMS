"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Ellipsis,
  FolderKanban,
  Mail,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { longDate } from "@/lib/datetime";

function AddCollaboratorModal({ onClose }) {
  const { inviteCollaborator, notify } = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setBusy(true);
    const result = await inviteCollaborator(cleanEmail);
    setBusy(false);

    if (result.ok) {
      onClose();
    } else {
      setError(result.error || "Could not send invitation.");
    }
  }

  return (
    <Modal
      icon={<UserPlus size={28} className="text-brand-700" />}
      eyebrow="Collaborators"
      title="Invite collaborator"
      subtitle="Send a collaboration request by entering their registered email address."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Colleague's email address
          <div className="relative mt-1">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="name@company.com"
              className="w-full pl-10 pr-3"
            />
            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          </div>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 leading-snug">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-[#f2f8f4] p-3 text-[12.5px] text-brand-900/80 leading-relaxed">
          <p className="font-semibold text-brand-900 flex items-center gap-1.5 mb-0.5">
            <Sparkles size={14} className="text-brand-600" /> How collaborator requests work:
          </p>
          The system will verify if this account exists. Once found, an invitation is sent. When they accept, you will both appear in each other's Collaborators list.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !email.trim()}>
            {busy ? (
              <span className="flex items-center gap-2">
                <Clock size={16} className="animate-spin" /> Checking...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send size={15} /> Send invitation
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CollaboratorMenu({ collaborator, onRemove }) {
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  return (
    <div className="relative">
      <button
        type="button"
        className="dots-btn"
        aria-label={`Actions for ${collaborator.name}`}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <Ellipsis size={20} />
      </button>

      {open && (
        <div
          className="menu-popover min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="danger"
            onClick={() => {
              setOpen(false);
              onRemove(collaborator);
            }}
          >
            <Trash2 size={16} /> Remove collaborator
          </button>
        </div>
      )}
    </div>
  );
}

export default function CollaboratorsView() {
  const {
    collaborators,
    collaboratorRequests,
    respondCollaboratorRequest,
    removeCollaborator,
    projects,
    tasks,
    currentUser,
    todayDate,
    notify,
  } = useApp();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "requests"
  const [searchQuery, setSearchQuery] = useState("");
  const [addingModal, setAddingModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  const incomingRequests = collaboratorRequests?.incoming || [];
  const outgoingRequests = collaboratorRequests?.outgoing || [];
  const pendingRequestsCount = incomingRequests.length + outgoingRequests.length;

  // Filter collaborators
  const filteredCollaborators = collaborators.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  // Count shared projects with this collaborator
  const sharedProjectsCount = (userId) => {
    return projects.filter((p) => {
      const isUserIn = p.members?.some((m) => m.userId === userId && m.status !== "pending");
      const isCreator = p.createdBy === userId;
      return isUserIn || isCreator;
    }).length;
  };

  async function handleRespond(connectionId, action) {
    setActionBusy(connectionId);
    await respondCollaboratorRequest(connectionId, action);
    setActionBusy(null);
  }

  async function handleRemove(collaborator) {
    if (confirm(`Remove ${collaborator.name} from your collaborators?`)) {
      await removeCollaborator(collaborator.id);
    }
  }

  return (
    <div className="space-y-6 px-5 pb-12 pt-6 md:px-[34px]">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">
            {longDate(todayDate, true)}
          </p>
          <h1 className="mt-2 text-[42px] font-extrabold leading-none tracking-tight text-brand-900 md:text-[48px]">
            Collaborators
          </h1>
          <p className="mt-2.5 text-[15.5px] text-muted max-w-2xl leading-relaxed">
            Your connected network of colleagues and teammates. Collaborators can be quickly invited into projects with one click.
          </p>
        </div>

        <button
          className="btn-primary h-[48px] px-5 text-[15px] shadow-sm flex items-center gap-2"
          onClick={() => setAddingModal(true)}
        >
          <Plus size={19} /> Add collaborator
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`relative pb-3 pt-2 text-[15px] font-semibold transition-colors flex items-center gap-2 px-1 ${
            activeTab === "all" ? "text-brand-900" : "text-ink/60 hover:text-ink"
          }`}
        >
          <Users size={18} />
          My Collaborators
          <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[12px] font-bold text-brand-800">
            {collaborators.length}
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`relative pb-3 pt-2 text-[15px] font-semibold transition-colors flex items-center gap-2 px-3 ${
            activeTab === "requests" ? "text-brand-900" : "text-ink/60 hover:text-ink"
          }`}
        >
          <Mail size={18} />
          Pending Requests
          {pendingRequestsCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${
                incomingRequests.length > 0
                  ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {incomingRequests.length > 0 ? `${incomingRequests.length} new` : pendingRequestsCount}
            </span>
          )}
          {activeTab === "requests" && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: My Collaborators */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {collaborators.length > 0 && (
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search collaborators by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-[42px] text-[14.5px] rounded-xl border border-line bg-white shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {filteredCollaborators.length > 0 ? (
            <section className="panel divide-y divide-line overflow-visible shadow-xs">
              {filteredCollaborators.map((collaborator) => {
                const sharedCount = sharedProjectsCount(collaborator.id);
                return (
                  <div
                    key={collaborator.id}
                    className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-4 transition hover:bg-[#fafdfb]"
                  >
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <Avatar user={collaborator} size={46} />
                      <div>
                        <p className="flex items-center gap-2 text-[16px] font-semibold text-ink leading-tight">
                          {collaborator.name}
                        </p>
                        <p className="mt-0.5 text-[13.5px] text-muted break-all">{collaborator.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf4ed] px-3 py-1.5 text-[12.5px] font-semibold text-brand-900">
                        <FolderKanban size={14} className="text-brand-700" />
                        {sharedCount} {sharedCount === 1 ? "shared project" : "shared projects"}
                      </span>

                      {collaborator.connectedAt && (
                        <span className="hidden sm:inline-block text-[12.5px] text-muted">
                          Connected {new Date(collaborator.connectedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}

                      <CollaboratorMenu collaborator={collaborator} onRemove={handleRemove} />
                    </div>
                  </div>
                );
              })}
            </section>
          ) : (
            <div className="panel p-10 text-center flex flex-col items-center justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700 mb-3 shadow-xs ring-1 ring-brand-200">
                <Users size={30} />
              </div>
              <h3 className="text-[19px] font-bold text-ink">
                {searchQuery ? "No matching collaborators" : "No collaborators added yet"}
              </h3>
              <p className="mt-1 text-[14.5px] text-muted max-w-md">
                {searchQuery
                  ? "Try searching with a different name or email address."
                  : "Invite colleagues using their registered email. Once they accept, they will appear here and in your project invite shortcuts."}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  className="btn-primary mt-5 h-[44px] px-5 text-[14.5px]"
                  onClick={() => setAddingModal(true)}
                >
                  <Plus size={17} /> Add your first collaborator
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pending Requests */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Incoming requests */}
          <div className="space-y-3">
            <h3 className="text-[17px] font-bold text-ink flex items-center gap-2">
              <UserPlus size={19} className="text-brand-700" />
              Received Requests
              {incomingRequests.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[12px] font-bold">
                  {incomingRequests.length}
                </span>
              )}
            </h3>

            {incomingRequests.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.connectionId}
                    className="panel p-4 flex flex-col justify-between gap-4 border-l-4 border-l-brand-600 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={{ name: req.name, email: req.email }} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-ink truncate">{req.name}</p>
                        <p className="text-[13px] text-muted truncate">{req.email}</p>
                        <p className="text-[11.5px] text-ink/50 mt-0.5">
                          Sent invitation on {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                      <button
                        type="button"
                        disabled={actionBusy === req.connectionId}
                        onClick={() => handleRespond(req.connectionId, "accept")}
                        className="btn-primary flex-1 h-[38px] text-[13px] font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Check size={15} strokeWidth={2.4} /> Accept
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy === req.connectionId}
                        onClick={() => handleRespond(req.connectionId, "decline")}
                        className="btn-secondary h-[38px] px-3 text-[13px] text-ink/75 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                      >
                        <X size={15} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel p-6 text-center text-muted text-[14px]">
                No received collaborator requests.
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div className="space-y-3 pt-3">
            <h3 className="text-[17px] font-bold text-ink flex items-center gap-2">
              <Clock size={19} className="text-muted" />
              Sent Requests (Waiting for response)
              {outgoingRequests.length > 0 && (
                <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-[12px] font-bold">
                  {outgoingRequests.length}
                </span>
              )}
            </h3>

            {outgoingRequests.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.connectionId}
                    className="panel p-4 flex flex-col justify-between gap-3 shadow-xs opacity-90"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={{ name: req.name, email: req.email }} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-ink truncate">{req.name}</p>
                        <p className="text-[13px] text-muted truncate">{req.email}</p>
                        <p className="text-[11.5px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                          <Clock size={12} /> Pending acceptance
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-line/60">
                      <button
                        type="button"
                        disabled={actionBusy === req.connectionId}
                        onClick={() => handleRespond(req.connectionId, "cancel")}
                        className="btn-secondary h-[34px] px-3 text-[12.5px] text-muted hover:text-red-700 hover:bg-red-50"
                      >
                        Cancel invitation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel p-6 text-center text-muted text-[14px]">
                No sent requests waiting for response.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {addingModal && <AddCollaboratorModal onClose={() => setAddingModal(false)} />}
    </div>
  );
}
