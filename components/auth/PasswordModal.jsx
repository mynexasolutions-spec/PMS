"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useApp } from "@/components/AppProvider";
import { request } from "@/lib/api";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export default function PasswordModal({ onClose }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ current: "", next: "", again: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.next.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (form.next !== form.again) return setError("The two new passwords don't match.");
    setBusy(true);
    const { ok, data } = await request("/api/auth/password", "POST", { current: form.current, next: form.next });
    setBusy(false);
    if (!ok) return setError(data?.error ?? "The password could not be changed.");
    notify("Password changed. Other devices were signed out.");
    onClose();
  }

  return (
    <Modal size="narrow" icon={<KeyRound size={28} />} eyebrow="Account" title="Change password" subtitle="Other devices will be signed out." onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Current password
          <input type="password" required autoFocus autoComplete="current-password" value={form.current} onChange={(e) => set({ current: e.target.value })} />
        </label>
        <label className="field">
          New password
          <input type="password" required autoComplete="new-password" value={form.next} onChange={(e) => set({ next: e.target.value })} />
        </label>
        <label className="field">
          Repeat new password
          <input type="password" required autoComplete="new-password" value={form.again} onChange={(e) => set({ again: e.target.value })} />
        </label>
        {error && <p role="alert" className="rounded-xl bg-[#fde4e4] px-4 py-2.5 text-[13.5px] font-medium text-[#b42323]">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
