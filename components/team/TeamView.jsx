"use client";

import { useState } from "react";
import { Check, Ellipsis, KeyRound, Minus, Plus, ShieldCheck, UserCheck, UserPlus, UserX } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { ROLES, can, roleLabel } from "@/lib/permissions";
import { longDate } from "@/lib/datetime";

const roleChip = {
  admin: "bg-[#efe7fc] text-[#5b2bb0]",
  manager: "bg-[#e4efff] text-[#2b5fd6]",
  member: "bg-[#eef3ef] text-ink/80",
};

// What each role can do (mirrors lib/permissions.js, which the server enforces).
const permissionRows = [
  ["Create, assign and update tasks; comment; plan the day", true, true, true],
  ["Create projects and move them between stages", true, true, false],
  ["Open, upload and edit .env files & credentials", true, true, "assigned"],
  ["Delete tasks created by someone else", true, true, false],
  ["Add people, change roles, reset passwords", true, false, false],
];

const lastSeen = (value) => {
  if (!value) return "Never signed in";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return `Last sign-in ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date)}`;
};

function AddUserModal({ onClose }) {
  const { addUser } = useApp();
  const [form, setForm] = useState({ name: "", email: "", role: "member", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const ok = await addUser(form);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal icon={<UserPlus size={28} />} eyebrow="Team" title="Add a team member" subtitle="They sign in with this e-mail and password, and can change it later." onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Full name
          <input required autoFocus maxLength={60} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Rohan Gupta" />
        </label>
        <label className="field">
          E-mail
          <input type="email" required value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="rohan@nexasolution.in" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="field">
            Role
            <select value={form.role} onChange={(e) => set({ role: e.target.value })}>
              {ROLES.map((role) => (
                <option key={role} value={role}>{roleLabel[role]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Temporary password
            <input type="text" required minLength={MIN_PASSWORD_LENGTH} autoComplete="off" value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder={`${MIN_PASSWORD_LENGTH}+ characters`} />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Adding..." : "Add member"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const { editUser, notify } = useApp();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const ok = await editUser(user.id, { password });
    setBusy(false);
    if (ok) {
      notify(`Password reset for ${user.name}. They were signed out everywhere.`);
      onClose();
    }
  }

  return (
    <Modal size="narrow" icon={<KeyRound size={28} />} eyebrow="Team" title={`Reset password`} subtitle={`${user.name} will be signed out everywhere.`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          New password
          <input type="text" required autoFocus minLength={MIN_PASSWORD_LENGTH} autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`${MIN_PASSWORD_LENGTH}+ characters`} />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Reset password"}</button>
        </div>
      </form>
    </Modal>
  );
}

function MemberMenu({ member, onReset }) {
  const { editUser, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));
  const self = member.id === currentUser.id;

  return (
    <div className="relative">
      <button
        className="dots-btn"
        aria-label={`Actions for ${member.name}`}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
      >
        <Ellipsis size={20} />
      </button>
      {open && (
        <div className="menu-popover min-w-[230px]">
          <p className="px-3 pb-1 pt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">Role</p>
          {ROLES.map((role) => (
            <button key={role} onClick={() => { setOpen(false); void editUser(member.id, { role }); }}>
              {roleLabel[role]}
              {member.role === role && <Check size={16} className="ml-auto" />}
            </button>
          ))}
          <hr />
          <button onClick={() => { setOpen(false); onReset(member); }}>
            <KeyRound size={16} /> Reset password
          </button>
          {!self && (
            <button className={member.active ? "danger" : ""} onClick={() => { setOpen(false); void editUser(member.id, { active: !member.active }); }}>
              {member.active ? <UserX size={16} /> : <UserCheck size={16} />}
              {member.active ? "Disable account" : "Enable account"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamView() {
  const { users, tasks, todos, currentUser, todayDate } = useApp();
  const admin = can.manageUsers(currentUser);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(null);

  const openTasks = (id) => tasks.filter((task) => task.assigneeId === id && task.status !== "done").length;
  const todayTodos = (id) => todos.filter((todo) => todo.assigneeId === id && todo.todoDate === todayDate && !todo.done).length;

  return (
    <div className="space-y-5 px-5 pb-8 pt-6 md:px-[34px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">{longDate(todayDate, true)}</p>
          <h1 className="mt-2 text-[44px] font-extrabold leading-none tracking-tight text-brand-900 md:text-[50px]">Team</h1>
          <p className="mt-3 text-[16px] text-muted">Everyone at Nexa Solution who works in this workspace. Anyone can assign work to anyone.</p>
        </div>
        {admin && (
          <button className="btn-primary h-[52px] px-6 text-[16px]" onClick={() => setAdding(true)}>
            <Plus size={20} /> Add member
          </button>
        )}
      </header>

      <section className="panel divide-y divide-line overflow-visible">
        {users.map((member) => (
          <div key={member.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 ${member.active ? "" : "opacity-60"}`}>
            <Avatar user={member} size={46} />
            <div className="min-w-[200px] flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[16.5px] font-semibold leading-tight">
                {member.name}
                {member.id === currentUser.id && <span className="rounded-full bg-[#e8f6ec] px-2 py-0.5 text-[11.5px] font-semibold text-brand-800">You</span>}
                {!member.active && <span className="rounded-full bg-[#fde4e4] px-2 py-0.5 text-[11.5px] font-semibold text-[#b42323]">Disabled</span>}
              </p>
              <p className="mt-0.5 break-all text-[13.5px] text-muted">{member.email}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${roleChip[member.role]}`}>{roleLabel[member.role]}</span>
            {(!currentUser || currentUser.role !== "member" || member.id === currentUser.id) && (
              <div className="flex gap-1.5 text-[12.5px] font-semibold">
                <span className="rounded-md bg-[#e4efff] px-2 py-1 text-[#2b5fd6]">{openTasks(member.id)} open tasks</span>
                <span className="rounded-md bg-[#fdf0c4] px-2 py-1 text-[#8a6508]">{todayTodos(member.id)} to-dos today</span>
              </div>
            )}
            <p className="hidden w-[190px] text-[13px] text-muted xl:block">{lastSeen(member.lastLoginAt)}</p>
            {admin ? <MemberMenu member={member} onReset={setResetting} /> : <span className="w-7" />}
          </div>
        ))}
        {!users.length && <p className="px-5 py-8 text-center text-muted">No one yet.</p>}
      </section>

      <section className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-[44px] w-[44px] place-items-center rounded-xl bg-[#e8f7ec] text-brand-700">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight">Who can do what</h2>
            <p className="text-[13.5px] text-muted">Roles are enforced on the server, not just hidden in the screens.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-[14.5px]">
            <thead className="bg-[#f6f9f7] text-left text-[12.5px] uppercase tracking-wider text-ink/65">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                {ROLES.map((role) => (
                  <th key={role} className="w-[120px] px-4 py-3 text-center font-medium">{roleLabel[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionRows.map(([action, ...allowed]) => (
                <tr key={action} className="border-t border-line">
                  <td className="px-4 py-3">{action}</td>
                  {allowed.map((yes, index) => (
                    <td key={ROLES[index]} className="px-4 py-3 text-center">
                      {yes === "assigned" ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 bg-[#e8f7ec] px-2 py-0.5 rounded-full" title="Only for projects assigned to this member">
                          <Check size={13} strokeWidth={3} /> Assigned only
                        </span>
                      ) : yes ? (
                        <Check size={18} className="mx-auto text-brand-600" strokeWidth={3} />
                      ) : (
                        <Minus size={18} className="mx-auto text-ink/30" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adding && <AddUserModal onClose={() => setAdding(false)} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
