"use client";

import { useState } from "react";
import { Check, Ellipsis, FolderKanban, KeyRound, Plus, ShieldCheck, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { longDate } from "@/lib/datetime";

const lastSeen = (value) => {
  if (!value) return "Never signed in";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return `Last sign-in ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date)}`;
};

function AddAccountModal({ onClose }) {
  const { addUser } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
    <Modal
      icon={<UserPlus size={28} />}
      eyebrow="Accounts"
      title="Create account"
      subtitle="Add a new registered account to the workspace."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Full name
          <input
            required
            autoFocus
            maxLength={60}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Rohan Gupta"
          />
        </label>
        <label className="field">
          Work e-mail
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="rohan@company.com"
          />
        </label>
        <label className="field">
          Password
          <input
            type="text"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="off"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
            placeholder={`${MIN_PASSWORD_LENGTH}+ characters`}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </button>
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
    <Modal
      size="narrow"
      icon={<KeyRound size={28} />}
      eyebrow="Accounts"
      title="Reset password"
      subtitle={`${user.name} will be signed out everywhere.`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          New password
          <input
            type="text"
            required
            autoFocus
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`${MIN_PASSWORD_LENGTH}+ characters`}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MemberMenu({ member, onReset }) {
  const { editUser, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));
  const self = member.id === currentUser?.id;

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
        <div className="menu-popover min-w-[200px]">
          <button
            onClick={() => {
              setOpen(false);
              onReset(member);
            }}
          >
            <KeyRound size={16} /> Reset password
          </button>
          {!self && (
            <button
              className={member.active ? "danger" : ""}
              onClick={() => {
                setOpen(false);
                void editUser(member.id, { active: !member.active });
              }}
            >
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
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(null);

  const openTasks = (id) => tasks.filter((task) => task.assigneeId === id && task.status !== "done").length;
  const todayTodos = (id) => todos.filter((todo) => todo.assigneeId === id && todo.todoDate === todayDate && !todo.done).length;

  return (
    <div className="space-y-5 px-5 pb-8 pt-6 md:px-[34px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink/70">{longDate(todayDate, true)}</p>
          <h1 className="mt-2 text-[44px] font-extrabold leading-none tracking-tight text-brand-900 md:text-[50px]">Accounts</h1>
          <p className="mt-3 text-[16px] text-muted">
            All registered accounts in this workspace. Roles and permissions are managed per-project.
          </p>
        </div>
        <button className="btn-primary h-[50px] px-6 text-[15.5px]" onClick={() => setAdding(true)}>
          <Plus size={19} /> Add account
        </button>
      </header>

      {/* Account List */}
      <section className="panel divide-y divide-line overflow-visible">
        {users.map((member) => (
          <div key={member.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 ${member.active ? "" : "opacity-60"}`}>
            <Avatar user={member} size={46} />
            <div className="min-w-[200px] flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[16.5px] font-semibold leading-tight">
                {member.name}
                {member.id === currentUser?.id && (
                  <span className="rounded-full bg-[#e8f6ec] px-2 py-0.5 text-[11.5px] font-semibold text-brand-800">You</span>
                )}
                {!member.active && (
                  <span className="rounded-full bg-[#fde4e4] px-2 py-0.5 text-[11.5px] font-semibold text-[#b42323]">Disabled</span>
                )}
              </p>
              <p className="mt-0.5 break-all text-[13.5px] text-muted">{member.email}</p>
            </div>

            <div className="flex gap-1.5 text-[12.5px] font-semibold">
              <span className="rounded-md bg-[#e4efff] px-2.5 py-1 text-[#2b5fd6]">{openTasks(member.id)} open tasks</span>
              <span className="rounded-md bg-[#fdf0c4] px-2.5 py-1 text-[#8a6508]">{todayTodos(member.id)} to-dos today</span>
            </div>

            <p className="hidden w-[190px] text-[13px] text-muted xl:block">{lastSeen(member.lastLoginAt)}</p>
            <MemberMenu member={member} onReset={setResetting} />
          </div>
        ))}
        {!users.length && <p className="px-5 py-8 text-center text-muted">No accounts yet.</p>}
      </section>

      {/* How Roles Work Now */}
      <section className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-[44px] w-[44px] place-items-center rounded-xl bg-[#e8f7ec] text-brand-700">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight">Project-Level Administration</h2>
            <p className="text-[13.5px] text-muted">
              Global roles are replaced with project-level ownership (WhatsApp style).
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-[#fafcfb] p-4">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <FolderKanban size={17} className="text-brand-600" /> Project Creator = Admin
            </h3>
            <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
              Anyone can create a project. The creator becomes the default Project Admin with full control over settings, members, and secrets.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-[#fafcfb] p-4">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <Users size={17} className="text-brand-600" /> Multi-Admin Support
            </h3>
            <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
              Project Admins can invite any registered account to their project and promote members to Project Admin at any time.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-[#fafcfb] p-4">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <Check size={17} className="text-brand-600" /> Personal Workspaces
            </h3>
            <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
              Sidebar Notes, Daily To-Dos, and Sticky Notes are 100% personal to your account. Project-specific To-Dos live inside each project.
            </p>
          </div>
        </div>
      </section>

      {adding && <AddAccountModal onClose={() => setAdding(false)} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
