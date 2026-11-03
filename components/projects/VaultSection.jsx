"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import CopyButton from "@/components/ui/CopyButton";
import Modal from "@/components/ui/Modal";
import { request } from "@/lib/api";
import { stamp } from "@/lib/datetime";
import { countVariables, parseEnv } from "@/lib/env-parse";

const COPY = {
  env: {
    eyebrow: "Environments",
    title: ".env Configuration",
    add: "Add .env",
    blank: "No .env files saved yet. Add one per environment, like Production, Staging, or Development.",
    labelHint: "Production .env",
    icon: FileCode2,
  },
  credential: {
    eyebrow: "Credentials",
    title: "Account Login",
    add: "Add Login",
    blank: "No logins saved yet. Add hosting panel, database credentials, API keys, domain registrar...",
    labelHint: "AWS Production / Hostinger Panel",
    icon: KeyRound,
  },
};

const HIDE_AFTER_MS = 60_000; // an opened secret closes itself again after a minute
const MASK = "••••••••••";

function Locked() {
  return (
    <section className="panel grid place-items-center gap-2 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f3f6f4] text-ink/55">
        <Lock size={26} />
      </span>
      <h2 className="text-[19px] font-bold tracking-tight">Project Storage Vault is for project members</h2>
      <p className="max-w-[420px] text-[14.5px] text-muted">
        Passwords, API keys, and .env configurations are accessible to all team members and admins of this project. Ask a Project Admin to add you to the project team.
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
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white/10"
          onClick={() => setShow((value) => !value)}
        >
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

function SecretCard({ secret, onEdit, onDelete, onViewed }) {
  const { notify } = useApp();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const kind = secret.kind;
  const copy = COPY[kind] || COPY.credential;
  const Icon = copy.icon;
  const isEnv = kind === "env";
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
    const filename =
      !trimmed || lower === "production" || lower === "prod" || lower === "default" || lower === "env"
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
    <article className="panel p-5 transition hover:shadow-xs">
      <div className="flex flex-wrap items-start gap-3.5">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            isEnv ? "bg-[#e8f7ec] text-brand-700" : "bg-[#eef4ff] text-[#2b5fd6]"
          }`}
        >
          <Icon size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-bold leading-tight wrap-anywhere">{secret.label}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                isEnv
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              {isEnv ? ".env File" : "Account Login"}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            <span title={updated.full}>
              Updated {updated.label} by {secret.updatedByName ?? "team member"}
            </span>
            {viewed && (
              <span title={viewed.full}>
                {" · "}Opened {viewed.label} by {secret.lastViewedBy ?? "team member"}
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
          {isEnv && <CopyButton label="Copy .env" text={async () => (data ?? (await open()))?.text} />}
          {isEnv && (
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
            <button
              type="button"
              className="btn-compact inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[13.5px] font-semibold text-white hover:bg-red-700"
              onClick={() => onDelete(secret)}
            >
              <Trash2 size={15} /> Delete for good?
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn h-9 w-9 text-red-600"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${secret.label}`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      {data && (isEnv ? <EnvView text={data.text} /> : <CredentialView data={data} />)}
      {data && <p className="mt-2 text-[12px] text-muted">This closes by itself after a minute.</p>}
    </article>
  );
}

const BLANK_CREDENTIAL = { service: "", url: "", username: "", password: "", notes: "" };

/** Add or edit a project secret. `secret` is null when adding; `initial` is its decrypted content when editing. */
function SecretModal({ initialKind = "env", projectId, projectName, secret, initial, onClose, onSaved }) {
  const { notify } = useApp();
  const [kind, setKind] = useState(secret?.kind ?? initialKind);
  const copy = COPY[kind] || COPY.env;
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
          if (fname.includes("prod")) guessed = "Production .env";
          else if (fname.includes("stag")) guessed = "Staging .env";
          else if (fname.includes("dev") || fname.includes("local")) guessed = "Development .env";
          else if (fname.includes("test")) guessed = "Testing .env";
          else if (fname.startsWith(".env.") && fname.length > 5) {
            const suffix = file.name.slice(5);
            guessed = `${suffix.charAt(0).toUpperCase() + suffix.slice(1)} .env`;
          } else if (fname === ".env") {
            guessed = "Production .env";
          } else {
            const clean = file.name.replace(/^\./, "").replace(/\.env$/, "").replace(/^env\./, "");
            guessed = clean ? `${clean.charAt(0).toUpperCase() + clean.slice(1)} .env` : "Production .env";
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
    notify(secret ? "Secret updated." : "Saved to Project Storage Vault.");
    onSaved();
    onClose();
  }

  const Icon = copy.icon;
  return (
    <Modal
      size="wide"
      icon={<Icon size={28} />}
      eyebrow={`Project Storage Vault · ${projectName}`}
      title={secret ? `Edit ${secret.label}` : kind === "env" ? "Add a .env Configuration" : "Add Account Login / Credential"}
      subtitle="Encrypted with AES-256 before saving. Accessible to project members and admins."
      onClose={onClose}
    >
      <form onSubmit={submit} autoComplete="off" className="grid gap-4">
        {!secret && (
          <div className="flex rounded-xl border border-line bg-[#f0f5f2] p-1 text-[13.5px] font-semibold w-fit">
            <button
              type="button"
              onClick={() => setKind("env")}
              className={`rounded-lg px-3.5 py-1.5 transition inline-flex items-center gap-1.5 ${
                kind === "env" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
              }`}
            >
              <FileCode2 size={15} /> .env Configuration File
            </button>
            <button
              type="button"
              onClick={() => setKind("credential")}
              className={`rounded-lg px-3.5 py-1.5 transition inline-flex items-center gap-1.5 ${
                kind === "credential" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
              }`}
            >
              <KeyRound size={15} /> Account Login / Credential
            </button>
          </div>
        )}

        <label className="field">
          Name / Label
          <input
            required
            autoFocus
            maxLength={80}
            placeholder={`e.g. ${copy.labelHint}`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
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
                Service / Platform
                <input maxLength={80} placeholder="Hostinger, AWS, GoDaddy, cPanel..." value={fields.service} onChange={setField("service")} />
              </label>
              <label className="field">
                Login URL / Link
                <input type="url" maxLength={200} placeholder="https://..." value={fields.url} onChange={setField("url")} />
              </label>
              <label className="field">
                Username or email
                <input maxLength={200} autoComplete="off" value={fields.username} onChange={setField("username")} />
              </label>
              <label className="field">
                Password / Secret Key
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
              Notes / Extra Details
              <textarea rows={3} maxLength={1000} placeholder="2FA details, SSH port, server IP, renewal info..." value={fields.notes} onChange={setField("notes")} />
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
            {busy ? "Saving..." : secret ? "Update Secret" : "Save to Project Vault"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectStorageVaultList({ project, defaultKind = "all" }) {
  const { notify } = useApp();
  const [secrets, setSecrets] = useState(null);
  const [kindFilter, setKindFilter] = useState(defaultKind); // "all" | "env" | "credential"
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // { kind, secret, initial }

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

  const allSecrets = secrets ?? [];
  const envCount = allSecrets.filter((s) => s.kind === "env").length;
  const credCount = allSecrets.filter((s) => s.kind === "credential").length;

  const filtered = useMemo(() => {
    return allSecrets.filter((s) => {
      if (kindFilter !== "all" && s.kind !== kindFilter) return false;
      if (query.trim()) {
        const needle = query.toLowerCase();
        if (!s.label.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [allSecrets, kindFilter, query]);

  return (
    <div className="space-y-[14px]">
      {/* Header Banner */}
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="eyebrow flex items-center gap-1.5 text-brand-700">
            <ShieldCheck size={15} /> Project Storage Vault
          </p>
          <h2 className="mt-0.5 text-[21px] font-bold tracking-tight text-ink">
            {project.name} — .env &amp; Credentials Vault
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Unlimited encrypted storage for this project&apos;s .env files, logins, and API keys. Accessible directly to all project members and admins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="btn-secondary h-10 px-4 text-[13.5px]"
            onClick={() => setModal({ kind: "env", secret: null, initial: null })}
          >
            <FileCode2 size={16} className="text-brand-700" /> Add .env File
          </button>
          <button
            type="button"
            className="btn-primary h-10 px-4 text-[13.5px]"
            onClick={() => setModal({ kind: "credential", secret: null, initial: null })}
          >
            <Plus size={16} /> Add Login / Credential
          </button>
        </div>
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-xs">
        <div className="flex rounded-xl border border-line bg-[#f0f5f2] p-1 text-[13.5px] font-semibold">
          <button
            type="button"
            onClick={() => setKindFilter("all")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              kindFilter === "all" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            }`}
          >
            All Items ({allSecrets.length})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter("env")}
            className={`rounded-lg px-3.5 py-1.5 transition inline-flex items-center gap-1.5 ${
              kindFilter === "env" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            }`}
          >
            <FileCode2 size={15} /> .env Files ({envCount})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter("credential")}
            className={`rounded-lg px-3.5 py-1.5 transition inline-flex items-center gap-1.5 ${
              kindFilter === "credential" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            }`}
          >
            <KeyRound size={15} /> Account Logins ({credCount})
          </button>
        </div>

        <div className="flex h-[38px] w-full sm:w-[240px] items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-xs focus-within:border-brand-500">
          <Search size={15} className="text-ink/45 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project vault..."
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink/40"
          />
        </div>
      </div>

      {/* Secrets List */}
      {secrets === null ? (
        <div className="empty-view">Loading project vault...</div>
      ) : filtered.length === 0 ? (
        <div className="panel py-14 px-6 text-center text-muted">
          <KeyRound size={32} className="mx-auto text-ink/30 mb-2" />
          <p className="text-[16px] font-bold text-ink">
            {allSecrets.length === 0
              ? `No .env files or credentials stored for ${project.name} yet.`
              : "No matching items found in this filter."}
          </p>
          <p className="mt-1 text-[13.5px] max-w-md mx-auto">
            Project members and admins can store unlimited .env configurations (Development, Staging, Production) and service logins here.
          </p>
          {allSecrets.length === 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModal({ kind: "env", secret: null, initial: null })}
              >
                <FileCode2 size={16} /> Store First .env File
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setModal({ kind: "credential", secret: null, initial: null })}
              >
                <Plus size={16} /> Store First Credential
              </button>
            </div>
          )}
        </div>
      ) : (
        filtered.map((secret) => (
          <SecretCard
            key={`${secret.id}-${secret.updatedAt}`}
            secret={secret}
            onEdit={(item, initial) => setModal({ kind: item.kind, secret: item, initial })}
            onDelete={remove}
            onViewed={load}
          />
        ))
      )}

      {modal && (
        <SecretModal
          initialKind={modal.kind}
          projectId={project.id}
          projectName={project.name}
          secret={modal.secret}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

/** The unified Project Storage Vault (.env files and account logins) for a project. Accessible to project members and admins. */
export default function VaultSection({ project, kind = "all", canOpen }) {
  return canOpen ? <ProjectStorageVaultList project={project} defaultKind={kind} /> : <Locked />;
}
