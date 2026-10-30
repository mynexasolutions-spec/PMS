"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Eye, EyeOff, FileCode2, KeyRound, Lock, Pencil, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CopyButton from "@/components/ui/CopyButton";
import Modal from "@/components/ui/Modal";
import { request } from "@/lib/api";
import { stamp } from "@/lib/datetime";
import { countVariables, parseEnv } from "@/lib/env-parse";

const COPY = {
  env: {
    eyebrow: "Environments",
    title: ".env files",
    add: "Add .env",
    blank: "No .env files saved yet. Add one per environment, like Production or Staging.",
    labelHint: "Production",
    icon: FileCode2,
  },
  credential: {
    eyebrow: "Credentials",
    title: "Account logins",
    add: "Add login",
    blank: "No logins saved yet. Add the hosting panel, domain registrar, admin panel, email...",
    labelHint: "Hostinger panel",
    icon: KeyRound,
  },
};

const HIDE_AFTER_MS = 60_000; // an opened secret closes itself again after a minute
const MASK = "••••••••••";

function Locked({ copy }) {
  return (
    <section className="panel grid place-items-center gap-2 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f3f6f4] text-ink/55">
        <Lock size={26} />
      </span>
      <h2 className="text-[19px] font-bold tracking-tight">{copy.title} are for managers</h2>
      <p className="max-w-[420px] text-[14.5px] text-muted">
        Passwords and .env files are only visible to managers, admins, and the team member assigned to this project. If you need access, ask an admin or manager to assign you.
      </p>
    </section>
  );
}

/** A saved .env file shown as KEY = value, values hidden until asked for. */
function EnvView({ text }) {
  const [show, setShow] = useState(false);
  const rows = parseEnv(text);

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-[#10241a] text-[13.5px]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-white/70">
        <span>{countVariables(text)} variables</span>
        <button type="button" className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white/10" onClick={() => setShow((value) => !value)}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />} {show ? "Hide values" : "Show values"}
        </button>
      </div>
      <div className="max-h-[360px] overflow-auto p-2 font-mono">
        {rows.map((row, index) =>
          row.type === "var" ? (
            <div key={index} className="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-white/5">
              <span className="shrink-0 text-[#7ee2a8]">{row.key}</span>
              <span className="text-white/40">=</span>
              <span className="min-w-0 flex-1 text-white wrap-anywhere">{show ? row.value : MASK}</span>
              <CopyButton text={row.value} className="text-white/70 hover:bg-white/10 hover:text-white" />
            </div>
          ) : row.type === "comment" ? (
            <div key={index} className="px-2 py-1 text-white/40 wrap-anywhere">
              {row.text}
            </div>
          ) : (
            <div key={index} className="h-2" />
          ),
        )}
      </div>
    </div>
  );
}

function CredentialField({ label, children, copy }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[130px_1fr] sm:items-center sm:gap-3">
      <dt className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink/60">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 text-[15px]">
        <span className="min-w-0 wrap-anywhere">{children}</span>
        {copy != null && <CopyButton text={copy} />}
      </dd>
    </div>
  );
}

function CredentialView({ data }) {
  const [show, setShow] = useState(false);

  return (
    <dl className="mt-4 grid gap-3 rounded-xl bg-[#f4f8f5] p-4">
      {data.service && <CredentialField label="Service">{data.service}</CredentialField>}
      {data.url && (
        <CredentialField label="Link" copy={data.url}>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
            {data.url} <ExternalLink size={13} />
          </a>
        </CredentialField>
      )}
      {data.username && (
        <CredentialField label="Username" copy={data.username}>
          {data.username}
        </CredentialField>
      )}
      {data.password && (
        <CredentialField label="Password" copy={data.password}>
          <span className="inline-flex items-center gap-2">
            <span className="font-mono">{show ? data.password : MASK}</span>
            <button type="button" className="dots-btn" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
        </CredentialField>
      )}
      {data.notes && (
        <CredentialField label="Notes">
          <span className="whitespace-pre-wrap">{data.notes}</span>
        </CredentialField>
      )}
    </dl>
  );
}

function SecretCard({ secret, kind, copy, onEdit, onDelete, onViewed }) {
  const { notify } = useApp();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const Icon = copy.icon;
  const updated = stamp(secret.updatedAt);
  const viewed = secret.lastViewedAt ? stamp(secret.lastViewedAt) : null;

  useEffect(() => {
    if (!data) return undefined;
    const timer = setTimeout(() => setData(null), HIDE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  /** Fetches and decrypts the secret (the server notes who opened it). */
  async function open() {
    setBusy(true);
    const { ok, data: body } = await request(`/api/secrets/${secret.id}`);
    setBusy(false);
    if (!ok) {
      notify(body?.error ?? "That could not be opened.");
      return null;
    }
    onViewed();
    return body.secret.data;
  }

  async function reveal() {
    const opened = await open();
    if (opened) setData(opened);
  }

  async function edit() {
    const opened = data ?? (await open());
    if (opened) onEdit(secret, opened);
  }

  async function downloadEnv() {
    const secretData = data ?? (await open());
    if (!secretData?.text) return;
    const blob = new Blob([secretData.text], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const trimmed = (secret.label || "").trim();
    const lower = trimmed.toLowerCase();
    const filename = !trimmed || lower === "production" || lower === "prod" || lower === "default" || lower === "env"
      ? ".env"
      : trimmed.startsWith(".env")
        ? trimmed
        : `.env.${lower.replace(/[^a-z0-9_.-]/g, "-")}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Downloaded ${filename}`);
  }

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f7ec] text-brand-700">
          <Icon size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-bold leading-tight wrap-anywhere">{secret.label}</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            <span title={updated.full}>
              Updated {updated.label} by {secret.updatedByName ?? "someone"}
            </span>
            {viewed && (
              <span title={viewed.full}>
                {" · "}Opened {viewed.label} by {secret.lastViewedBy ?? "someone"}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data ? (
            <button type="button" className="btn-secondary btn-compact" onClick={() => setData(null)}>
              <EyeOff size={15} /> Hide
            </button>
          ) : (
            <button type="button" className="btn-primary btn-compact" disabled={busy} onClick={reveal}>
              <Eye size={15} /> {busy ? "Opening..." : "Reveal"}
            </button>
          )}
          {kind === "env" && <CopyButton label="Copy .env" text={async () => (data ?? (await open()))?.text} />}
          {kind === "env" && (
            <button
              type="button"
              className="btn-secondary btn-compact inline-flex items-center gap-1.5"
              onClick={downloadEnv}
              disabled={busy}
              title="Download as .env file"
            >
              <Download size={15} /> Download .env
            </button>
          )}
          <button type="button" className="icon-btn h-9 w-9" onClick={edit} aria-label={`Edit ${secret.label}`} disabled={busy}>
            <Pencil size={15} />
          </button>
          {confirming ? (
            <button type="button" className="btn-compact inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[13.5px] font-semibold text-white hover:bg-red-700" onClick={() => onDelete(secret)}>
              <Trash2 size={15} /> Delete for good?
            </button>
          ) : (
            <button type="button" className="icon-btn h-9 w-9 text-red-600" onClick={() => setConfirming(true)} aria-label={`Delete ${secret.label}`}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      {data && (kind === "env" ? <EnvView text={data.text} /> : <CredentialView data={data} />)}
      {data && <p className="mt-2 text-[12px] text-muted">This closes by itself after a minute.</p>}
    </article>
  );
}

const BLANK_CREDENTIAL = { service: "", url: "", username: "", password: "", notes: "" };

/** Add or edit a secret. `secret` is null when adding; `initial` is its decrypted content when editing. */
function SecretModal({ kind, copy, projectId, secret, initial, onClose, onSaved }) {
  const { notify } = useApp();
  const [label, setLabel] = useState(secret?.label ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const [fields, setFields] = useState({ ...BLANK_CREDENTIAL, ...(kind === "credential" ? initial : null) });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        setText(content);
        if (!label.trim()) {
          const fname = file.name.toLowerCase();
          let guessed = "";
          if (fname.includes("prod")) guessed = "Production";
          else if (fname.includes("stag")) guessed = "Staging";
          else if (fname.includes("dev") || fname.includes("local")) guessed = "Development";
          else if (fname.includes("test")) guessed = "Testing";
          else if (fname.startsWith(".env.") && fname.length > 5) {
            const suffix = file.name.slice(5);
            guessed = suffix.charAt(0).toUpperCase() + suffix.slice(1);
          } else if (fname === ".env") {
            guessed = "Production";
          } else {
            const clean = file.name.replace(/^\./, "").replace(/\.env$/, "").replace(/^env\./, "");
            guessed = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Production";
          }
          if (guessed) setLabel(guessed);
        }
        notify(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
  }
  const setField = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = kind === "env" ? { text } : fields;
    const { ok, data: body } = secret
      ? await request(`/api/secrets/${secret.id}`, "PATCH", { label, data })
      : await request(`/api/projects/${projectId}/secrets`, "POST", { kind, label, data });
    setBusy(false);
    if (!ok) return setError(body?.error ?? "That could not be saved.");
    notify(secret ? "Saved." : "Saved and encrypted.");
    onSaved();
    onClose();
  }

  const Icon = copy.icon;
  return (
    <Modal
      icon={<Icon size={28} />}
      eyebrow={copy.eyebrow}
      title={secret ? `Edit ${secret.label}` : kind === "env" ? "Add a .env file" : "Add a login"}
      subtitle="Encrypted before it is saved."
      onClose={onClose}
    >
      <form onSubmit={submit} autoComplete="off" className="grid gap-4">
        <label className="field">
          Name
          <input required autoFocus maxLength={80} placeholder={`e.g. ${copy.labelHint}`} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>

        {kind === "env" ? (
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="env-contents" className="text-[13.5px] font-medium text-ink/80">
                File contents
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-[#f4fbf6] px-2.5 py-1 text-[12.5px] font-semibold text-brand-700 transition hover:bg-[#e6f6eb] hover:border-brand-400"
              >
                <Upload size={13} strokeWidth={2.2} /> Upload .env file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".env*,.txt,text/*,*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={`relative rounded-lg transition ${dragging ? "ring-2 ring-brand-500 bg-brand-50/50" : ""}`}
            >
              <textarea
                id="env-contents"
                required
                rows={10}
                maxLength={20000}
                spellCheck={false}
                placeholder={"DATABASE_URL=postgres://...\nSECRET_KEY=...\n\n(Tip: Click 'Upload .env file' above or drop your .env file here)"}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Service
                <input maxLength={80} placeholder="Hostinger, GoDaddy, cPanel..." value={fields.service} onChange={setField("service")} />
              </label>
              <label className="field">
                Link
                <input type="url" maxLength={200} placeholder="https://..." value={fields.url} onChange={setField("url")} />
              </label>
              <label className="field">
                Username or email
                <input maxLength={200} autoComplete="off" value={fields.username} onChange={setField("username")} />
              </label>
              <label className="field">
                Password
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    maxLength={300}
                    autoComplete="new-password"
                    className="pr-10"
                    value={fields.password}
                    onChange={setField("password")}
                  />
                  <button
                    type="button"
                    className="dots-btn absolute right-1.5 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </span>
              </label>
            </div>
            <label className="field">
              Notes
              <textarea rows={3} maxLength={1000} placeholder="2FA on Harsh's phone, renewal in March..." value={fields.notes} onChange={setField("notes")} />
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-[#fde4e4] px-4 py-2.5 text-[13.5px] font-medium text-[#b42323]">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function VaultList({ project, kind, copy }) {
  const { notify } = useApp();
  const [secrets, setSecrets] = useState(null);
  const [modal, setModal] = useState(null); // { secret, initial }; secret is null when adding

  const load = useCallback(async () => {
    const { ok, data } = await request(`/api/projects/${project.id}/secrets`);
    if (!ok) notify(data?.error ?? "The saved items could not be loaded.");
    setSecrets((current) => (ok ? data.secrets : (current ?? [])));
  }, [project.id, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(secret) {
    const { ok, data } = await request(`/api/secrets/${secret.id}`, "DELETE");
    if (!ok) return notify(data?.error ?? "That could not be deleted.");
    setSecrets((current) => current.filter((item) => item.id !== secret.id));
    notify(`${secret.label} deleted.`);
  }

  const mine = (secrets ?? []).filter((secret) => secret.kind === kind);

  return (
    <div className="space-y-[14px]">
      <section className="panel flex flex-wrap items-center gap-4 p-5">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="text-[19px] font-bold tracking-tight">{copy.title} for {project.name}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-[13.5px] text-muted">
            <ShieldCheck size={16} className="mt-px shrink-0 text-brand-600" />
            Stored encrypted. Only managers and admins can open them, and every time one is opened it is noted here.
          </p>
        </div>
        <button type="button" className="btn-primary ml-auto" onClick={() => setModal({ secret: null, initial: null })}>
          <Plus size={17} /> {copy.add}
        </button>
      </section>

      {secrets === null ? (
        <div className="empty-view">Loading...</div>
      ) : mine.length === 0 ? (
        <div className="empty-view">{copy.blank}</div>
      ) : (
        mine.map((secret) => (
          <SecretCard
            key={`${secret.id}-${secret.updatedAt}`} // an edit starts the card afresh, so it never shows the old contents
            secret={secret}
            kind={kind}
            copy={copy}
            onEdit={(item, initial) => setModal({ secret: item, initial })}
            onDelete={remove}
            onViewed={load}
          />
        ))
      )}

      {modal && (
        <SecretModal
          kind={kind}
          copy={copy}
          projectId={project.id}
          secret={modal.secret}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

/** The .env files or the account logins saved for a project. Managers and admins only. */
export default function VaultSection({ project, kind, canOpen }) {
  const copy = COPY[kind];
  return canOpen ? <VaultList project={project} kind={kind} copy={copy} /> : <Locked copy={copy} />;
}
