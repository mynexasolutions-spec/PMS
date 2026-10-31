"use client";

import { useState } from "react";
import { Check, Clock, Crown, Ellipsis, Plus, Shield, ShieldAlert, Trash2, UserCheck, UserPlus, Users, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { request } from "@/lib/api";

function InviteMemberModal({ project, existingUserIds, onClose, onAdded }) {
  const { users, notify } = useApp();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);

  // Available users to invite (active users not already in project)
  const availableUsers = users.filter((u) => u.active && !existingUserIds.has(u.id));

  async function submit(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setBusy(true);

    const { ok, data } = await request(`/api/projects/${project.id}/members`, "POST", {
      userId: Number(selectedUserId),
      role,
    });

    setBusy(false);
    if (!ok) {
      notify(data?.error ?? "Could not send invitation.");
      return;
    }

    notify("Invitation sent. Status is waiting for approval.");
    onAdded(data.members);
    onClose();
  }

  return (
    <Modal
      icon={<UserPlus size={26} className="text-brand-700" />}
      eyebrow={project.name}
      title="Invite team member"
      subtitle="Send an invitation to a registered account. The user can accept or decline from their notifications."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Select account to invite
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            autoFocus
          >
            <option value="">-- Choose an account --</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Project role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Team Member</option>
            <option value="admin">Project Admin</option>
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !selectedUserId || availableUsers.length === 0}>
            {busy ? "Sending invite..." : "Send invitation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MemberItemMenu({ project, member, isOnlyAdmin, onUpdated, onRemoved }) {
  const { notify } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  const isPending = member.status === "pending";

  async function toggleAdminRole() {
    setOpen(false);
    const newRole = member.role === "admin" ? "member" : "admin";
    if (member.role === "admin" && isOnlyAdmin) {
      notify("Cannot demote the only Project Admin.");
      return;
    }

    setBusy(true);
    const { ok, data } = await request(`/api/projects/${project.id}/members`, "PATCH", {
      userId: member.userId,
      role: newRole,
    });
    setBusy(false);

    if (!ok) {
      notify(data?.error ?? "Could not update project role.");
      return;
    }
    notify(`Role changed to ${newRole === "admin" ? "Project Admin" : "Team Member"}.`);
    onUpdated(data.members);
  }

  async function removeMember() {
    setOpen(false);
    if (member.role === "admin" && isOnlyAdmin) {
      notify("Cannot remove the only Project Admin.");
      return;
    }

    setBusy(true);
    const { ok, data } = await request(`/api/projects/${project.id}/members?userId=${member.userId}`, "DELETE");
    setBusy(false);

    if (!ok) {
      notify(data?.error ?? (isPending ? "Could not cancel invitation." : "Could not remove member."));
      return;
    }
    notify(isPending ? "Invitation cancelled." : "Member removed from project.");
    onRemoved(data.members);
  }

  return (
    <div className="relative">
      <button
        className="dots-btn"
        aria-label="Member options"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Ellipsis size={18} />
      </button>

      {open && (
        <div className="menu-popover min-w-[210px] right-0">
          {!isPending && (
            <>
              <button onClick={toggleAdminRole}>
                {member.role === "admin" ? (
                  <>
                    <ShieldAlert size={15} className="text-[#a45300]" /> Demote to Member
                  </>
                ) : (
                  <>
                    <Crown size={15} className="text-amber-600" /> Make Project Admin
                  </>
                )}
              </button>
              <hr />
            </>
          )}
          <button className="danger" onClick={removeMember}>
            <Trash2 size={15} /> {isPending ? "Cancel invitation" : "Remove from project"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectTeamTab({ project, canManage }) {
  const { currentUser } = useApp();
  const [members, setMembers] = useState(project.members || []);
  const [showInvite, setShowInvite] = useState(false);

  const existingUserIds = new Set(members.map((m) => m.userId));
  const adminCount = members.filter((m) => m.role === "admin" && m.status !== "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-bold tracking-tight">Project Team</h3>
          <p className="text-[13.5px] text-muted">
            Collaborators who can view and work on this project. Admins can invite members and manage roles.
          </p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowInvite(true)}>
            <UserPlus size={17} /> Invite member
          </button>
        )}
      </div>

      <div className="panel divide-y divide-line overflow-visible">
        {members.map((member) => {
          const isMe = member.userId === currentUser?.id;
          const isAdmin = member.role === "admin";
          const isCreator = project.createdBy === member.userId;
          const isPending = member.status === "pending";

          return (
            <div
              key={member.id || member.userId}
              className={`flex flex-wrap items-center gap-4 px-5 py-3.5 transition ${
                isPending ? "bg-amber-50/30" : ""
              }`}
            >
              <Avatar name={member.name} id={member.userId} size={42} />
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[15.5px] text-ink">{member.name}</p>
                  {isMe && (
                    <span className="rounded-full bg-[#e8f6ec] px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                      You
                    </span>
                  )}
                  {isCreator && (
                    <span className="rounded-full bg-[#f4effc] px-2 py-0.5 text-[11px] font-semibold text-[#5b2bb0]">
                      Creator
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-muted">{member.email}</p>
              </div>

              {/* Status / Role Badge */}
              <div className="flex items-center gap-2">
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-[12px] font-bold text-amber-800 shadow-xs">
                    <Clock size={13} className="text-amber-600 animate-pulse shrink-0" /> Waiting for approval
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[12px] font-bold text-amber-800">
                    <Crown size={13} className="text-amber-600 fill-amber-500/20" /> Project Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
                    <Users size={13} className="text-slate-500" /> Member
                  </span>
                )}
              </div>

              {/* Admin Actions */}
              {canManage && (
                <MemberItemMenu
                  project={project}
                  member={member}
                  isOnlyAdmin={isAdmin && adminCount <= 1}
                  onUpdated={(newList) => setMembers(newList)}
                  onRemoved={(newList) => setMembers(newList)}
                />
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="p-8 text-center text-muted">
            No team members in this project yet. Click &quot;Invite member&quot; above to invite colleagues.
          </div>
        )}
      </div>

      {showInvite && (
        <InviteMemberModal
          project={project}
          existingUserIds={existingUserIds}
          onClose={() => setShowInvite(false)}
          onAdded={(newList) => setMembers(newList)}
        />
      )}
    </div>
  );
}
