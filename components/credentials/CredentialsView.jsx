"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  Filter,
  FolderLock,
  FolderPlus,
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
import ProjectColorPicker, { DEFAULT_PROJECT_COLOR } from "@/components/modals/ProjectColorPicker";
import { request } from "@/lib/api";
import { stamp } from "@/lib/datetime";
import { countVariables, parseEnv } from "@/lib/env-parse";

const MASK = "••••••••••••";

function formatAuditDate(value) {
  if (!value) return "";
  try {
    return stamp(value).label;
  } catch {
    return String(value);
  }
}

function DownloadEnvButton({ filename, text }) {
  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || ".env";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="btn-secondary h-8 px-2.5 text-[12.5px] inline-flex items-center gap-1.5"
      title="Download .env file"
    >
      <Download size={13} /> Download
    </button>
  );
}

// ----------------- MODAL: VIEW / DECRYPT SECRET -----------------
function ViewSecretModal({ secret, onClose, onEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const res = await request(`/api/secrets/${secret.id}`);
      if (ignore) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.data?.error ?? "Could not decrypt secret.");
      } else {
        setData(res.data.secret.data);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [secret.id]);

  const isEnv = secret.kind === "env";

  return (
    <Modal
      size={isEnv ? "wide" : "normal"}
      icon={isEnv ? <FileCode2 size={26} /> : <KeyRound size={26} />}
      eyebrow={`${secret.projectName} · ${isEnv ? ".env Configuration" : "Account Login"}`}
      title={secret.label}
      subtitle="Decrypted securely with AES-256-GCM. Keep these details confidential."
      onClose={onClose}
    >
      {loading && (
        <div className="py-12 text-center text-muted">
          <p className="animate-pulse">Decrypting secret from secure vault...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[14px] text-red-700">
          {error}
        </div>
      )}

      {data && isEnv && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <span className="text-[13.5px] font-semibold text-ink/75">
              {countVariables(data.text)} variables detected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowValues((v) => !v)}
                className="btn-secondary h-8 px-2.5 text-[12.5px] inline-flex items-center gap-1.5"
              >
                {showValues ? <EyeOff size={13} /> : <Eye size={13} />}
                {showValues ? "Hide values" : "Show values"}
              </button>
              <DownloadEnvButton filename={`${secret.label.toLowerCase().replace(/\s+/g, "-")}.env`} text={data.text} />
              <CopyButton text={data.text} className="btn-secondary h-8 px-2.5 text-[12.5px]" />
            </div>
          </div>

          <div className="max-h-[380px] overflow-auto rounded-xl bg-[#0f1f17] p-3 font-mono text-[13px] leading-relaxed">
            {parseEnv(data.text).map((row, idx) =>
              row.type === "var" ? (
                <div key={idx} className="flex items-start gap-2 py-0.5 hover:bg-white/5 px-2 rounded">
                  <span className="text-emerald-400 font-semibold shrink-0">{row.key}</span>
                  <span className="text-white/40">=</span>
                  <span className="flex-1 text-white break-all">{showValues ? row.value : MASK}</span>
                  <CopyButton text={row.value} className="text-white/60 hover:text-white" />
                </div>
              ) : row.type === "comment" ? (
                <div key={idx} className="text-white/40 py-0.5 px-2">
                  {row.text}
                </div>
              ) : (
                <div key={idx} className="h-2" />
              ),
            )}
          </div>
        </div>
      )}

      {data && !isEnv && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-[#f9fbf9] p-4 divide-y divide-line">
            {data.service && (
              <div className="pb-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Service / Platform</span>
                <p className="font-semibold text-ink mt-0.5">{data.service}</p>
              </div>
            )}

            {data.username && (
              <div className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Username / Email</span>
                  <p className="font-semibold text-ink mt-0.5 font-mono text-[14.5px]">{data.username}</p>
                </div>
                <CopyButton text={data.username} className="btn-secondary h-8 px-2.5 text-[12px]" />
              </div>
            )}

            {data.password && (
              <div className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Password</span>
                  <p className="font-semibold text-ink mt-0.5 font-mono text-[14.5px]">
                    {showValues ? data.password : MASK}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowValues((v) => !v)}
                    className="icon-btn h-8 w-8"
                    title={showValues ? "Hide password" : "Show password"}
                  >
                    {showValues ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <CopyButton text={data.password} className="btn-secondary h-8 px-2.5 text-[12px]" />
                </div>
              </div>
            )}

            {data.url && (
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Login URL</span>
                  <p className="font-medium text-brand-700 mt-0.5 truncate text-[14px]">
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                      {data.url} <ExternalLink size={12} />
                    </a>
                  </p>
                </div>
                <CopyButton text={data.url} className="btn-secondary h-8 px-2.5 text-[12px]" />
              </div>
            )}

            {data.notes && (
              <div className="pt-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted">Notes / Extra Info</span>
                <p className="text-[13.5px] text-ink/80 mt-1 whitespace-pre-wrap leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-line mt-5">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
        {onEdit && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onClose();
              onEdit(secret);
            }}
          >
            <Pencil size={15} /> Edit Secret
          </button>
        )}
      </div>
    </Modal>
  );
}

// ----------------- MODAL: CREATE VAULT-ONLY PROJECT -----------------
function NewVaultProjectModal({ onClose, onCreated }) {
  const { notify } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2e9e4f");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);

    const { ok, data } = await request("/api/projects", "POST", {
      name: name.trim(),
      color,
      description: description.trim() || "Vault & credentials container",
      isVaultOnly: true,
    });

    setBusy(false);
    if (!ok) {
      notify(data?.error ?? "Could not create vault project.");
      return;
    }

    notify(`Vault project "${data.project.name}" created.`);
    onCreated(data.project);
    onClose();
  }

  return (
    <Modal
      icon={<FolderLock size={26} className="text-brand-600" />}
      eyebrow="Credentials Storage"
      title="New Vault Project"
      subtitle="Creates a standalone project folder solely for credentials and .env files. It will NOT appear on your main Projects board."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="field">
          Project or Container name
          <input
            required
            autoFocus
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AWS Production Infrastructure, Client X Servers"
          />
        </label>

        <label className="field">
          Description <span className="font-normal text-muted">(optional)</span>
          <input
            maxLength={80}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Root logins, database credentials, server keys"
          />
        </label>

        <div>
          <p className="mb-2 text-[14px] font-bold text-ink">Project color</p>
          <ProjectColorPicker value={color} onChange={setColor} />
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[13px] text-amber-800 leading-relaxed">
          <strong>Vault-Only Project:</strong> This project will be visible exclusively here in Credentials Storage. Your main Projects page and task boards will stay completely clean.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !name.trim()}>
            {busy ? "Creating..." : "Create Vault Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- MODAL: ADD / EDIT SECRET -----------------
function SecretFormModal({ secretToEdit, allProjects, initialProjectId, onClose, onSaved, onOpenNewVaultProject }) {
  const { notify } = useApp();
  const [projectId, setProjectId] = useState(
    secretToEdit?.projectId || initialProjectId || allProjects[0]?.id || "",
  );
  const [kind, setKind] = useState(secretToEdit?.kind || "env");
  const [label, setLabel] = useState(secretToEdit?.label || "");
  const [envText, setEnvText] = useState("");
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(secretToEdit));

  useEffect(() => {
    if (!secretToEdit) return;
    async function load() {
      const res = await request(`/api/secrets/${secretToEdit.id}`);
      setLoadingInitial(false);
      if (res.ok && res.data.secret.data) {
        const d = res.data.secret.data;
        if (secretToEdit.kind === "env") {
          setEnvText(d.text || "");
        } else {
          setService(d.service || "");
          setUsername(d.username || "");
          setPassword(d.password || "");
          setUrl(d.url || "");
          setNotes(d.notes || "");
        }
      }
    }
    load();
  }, [secretToEdit]);

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEnvText(String(event.target?.result ?? ""));
      if (!label) setLabel(file.name.replace(/^\.env\.?/, "").trim() || "Production .env");
    };
    reader.readAsText(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);

    const payloadData =
      kind === "env"
        ? { text: envText }
        : { service: service.trim(), username: username.trim(), password: password.trim(), url: url.trim(), notes: notes.trim() };

    let res;
    if (secretToEdit) {
      res = await request(`/api/secrets/${secretToEdit.id}`, "PATCH", {
        label: label.trim(),
        data: payloadData,
      });
    } else {
      res = await request("/api/vault", "POST", {
        projectId: Number(projectId),
        kind,
        label: label.trim(),
        data: payloadData,
      });
    }

    setBusy(false);
    if (!res.ok) {
      notify(res.data?.error ?? "Could not save secret.");
      return;
    }

    notify(secretToEdit ? "Secret updated successfully." : "Secret added to vault.");
    onSaved();
    onClose();
  }

  const vaultOnlyProjs = allProjects.filter((p) => p.isVaultOnly);
  const normalProjs = allProjects.filter((p) => !p.isVaultOnly);

  return (
    <Modal
      size="wide"
      icon={kind === "env" ? <FileCode2 size={26} /> : <KeyRound size={26} />}
      eyebrow={secretToEdit ? "Edit Secret" : "Project Credentials Storage"}
      title={secretToEdit ? `Edit ${secretToEdit.label}` : "Store credentials or .env"}
      subtitle="Encrypted with AES-256 before saving to the database."
      onClose={onClose}
    >
      {loadingInitial ? (
        <div className="py-10 text-center text-muted">Loading existing secret...</div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          {!secretToEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Select Project
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                >
                  {vaultOnlyProjs.length > 0 && (
                    <optgroup label="Vault-Only Projects">
                      {vaultOnlyProjs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Vault Only)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {normalProjs.length > 0 && (
                    <optgroup label="Workspace Projects">
                      {normalProjs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  type="button"
                  onClick={onOpenNewVaultProject}
                  className="mt-1 text-left text-[12px] font-semibold text-brand-700 hover:underline"
                >
                  + Create new vault-only project
                </button>
              </label>

              <label className="field">
                What are you storing?
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="env">.env Configuration File</option>
                  <option value="credential">Account Login / Password / API Key</option>
                </select>
              </label>
            </div>
          )}

          <label className="field">
            Name / Label
            <input
              required
              autoFocus
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={kind === "env" ? "e.g. Production .env, Staging Config" : "e.g. AWS Root Account, Stripe API Keys, CPanel"}
            />
          </label>

          {kind === "env" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-ink">.env Content</span>
                <label className="btn-secondary h-7 cursor-pointer text-[12px] inline-flex items-center gap-1.5 px-2.5">
                  <Upload size={13} /> Upload .env file
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                required
                rows={10}
                value={envText}
                onChange={(e) => setEnvText(e.target.value)}
                placeholder={"# Paste your environment variables here\nDATABASE_URL=postgres://...\nJWT_SECRET=super-secret\nAPI_KEY=..."}
                className="w-full rounded-xl border border-line p-3 font-mono text-[13px] outline-none focus:border-brand-500 bg-[#fafcfb]"
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Service / Platform
                <input
                  maxLength={80}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g. AWS, Hostinger, GitHub"
                />
              </label>
              <label className="field">
                Username / Email
                <input
                  maxLength={200}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@company.com"
                />
              </label>
              <label className="field">
                Password / Secret Key
                <input
                  type="text"
                  maxLength={300}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </label>
              <label className="field">
                Login / Website URL
                <input
                  type="url"
                  maxLength={200}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://console.aws.amazon.com"
                />
              </label>
              <label className="field sm:col-span-2">
                Notes / Extra Details
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Recovery codes, 2FA backup instructions, IP whitelist"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Encrypting & Saving..." : secretToEdit ? "Update Secret" : "Store Secret"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ----------------- MAIN VIEW COMPONENT -----------------
export default function CredentialsView() {
  const { projects: appProjects = [], setProjects, notify } = useApp();
  const [localProjects, setLocalProjects] = useState(appProjects);
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState("all"); // "all" | "env" | "credential"
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [query, setQuery] = useState("");
  const [viewingSecret, setViewingSecret] = useState(null);
  const [editingSecret, setEditingSecret] = useState(null);
  const [addingSecret, setAddingSecret] = useState(false);
  const [preselectedProjectId, setPreselectedProjectId] = useState(null);
  const [creatingVaultProject, setCreatingVaultProject] = useState(false);

  // Fetch secrets and fresh projects (including vault-only)
  async function loadData() {
    setLoading(true);
    const [secretsRes, projectsRes] = await Promise.all([
      request("/api/vault"),
      request("/api/projects?includeVault=true"),
    ]);
    setLoading(false);

    if (secretsRes.ok && secretsRes.data.secrets) {
      setSecrets(secretsRes.data.secrets);
    }
    if (projectsRes.ok && projectsRes.data.projects) {
      setLocalProjects(projectsRes.data.projects);
      if (typeof setProjects === "function") {
        setProjects(projectsRes.data.projects);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const vaultOnlyProjects = useMemo(() => {
    return localProjects.filter((p) => p.isVaultOnly);
  }, [localProjects]);

  const selectedProjectObj = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return localProjects.find((p) => p.id === Number(selectedProjectId));
  }, [localProjects, selectedProjectId]);

  // Filter secrets
  const filteredSecrets = useMemo(() => {
    return secrets.filter((s) => {
      if (kindFilter !== "all" && s.kind !== kindFilter) return false;
      if (selectedProjectId !== "all" && s.projectId !== Number(selectedProjectId)) return false;
      if (query.trim()) {
        const needle = query.toLowerCase();
        const matchLabel = s.label.toLowerCase().includes(needle);
        const matchProject = s.projectName.toLowerCase().includes(needle);
        if (!matchLabel && !matchProject) return false;
      }
      return true;
    });
  }, [secrets, kindFilter, selectedProjectId, query]);

  async function handleDelete(secret) {
    if (!confirm(`Are you sure you want to delete "${secret.label}"? This cannot be undone.`)) return;
    const res = await request(`/api/secrets/${secret.id}`, "DELETE");
    if (!res.ok) {
      notify("Could not delete secret.");
      return;
    }
    notify("Secret deleted from vault.");
    setSecrets((cur) => cur.filter((item) => item.id !== secret.id));
  }

  async function handleDeleteVaultProject(project, e) {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete vault project "${project.name}"? Any credentials stored inside it will also be deleted.`)) return;
    const res = await request(`/api/projects/${project.id}`, "DELETE");
    if (!res.ok) {
      notify(res.data?.error ?? "Could not delete vault project.");
      return;
    }
    notify(`Vault project "${project.name}" deleted.`);
    setLocalProjects((cur) => cur.filter((p) => p.id !== project.id));
    if (typeof setProjects === "function") {
      setProjects((cur) => cur.filter((p) => p.id !== project.id));
    }
    if (selectedProjectId === String(project.id)) {
      setSelectedProjectId("all");
    }
    setSecrets((cur) => cur.filter((s) => s.projectId !== project.id));
  }

  const envCount = secrets.filter((s) => s.kind === "env").length;
  const credCount = secrets.filter((s) => s.kind === "credential").length;

  return (
    <div className="space-y-6 px-5 pb-8 pt-6 md:px-[34px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-brand-700">
            <ShieldCheck size={16} /> Secure Encrypted Storage
          </span>
          <h1 className="mt-1 text-[38px] font-extrabold leading-tight tracking-tight text-brand-900 md:text-[46px]">
            Project Credentials
          </h1>
          <p className="mt-2 text-[15.5px] text-muted max-w-2xl">
            Store and manage .env configurations and login credentials for all your projects. Create standalone vault projects that never clutter your main task boards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="btn-secondary h-[46px] px-4 text-[14.5px]"
            onClick={() => setCreatingVaultProject(true)}
          >
            <FolderPlus size={17} /> New Vault Project
          </button>
          <button
            className="btn-primary h-[46px] px-5 text-[14.5px]"
            onClick={() => {
              setPreselectedProjectId(selectedProjectId !== "all" ? Number(selectedProjectId) : null);
              setAddingSecret(true);
            }}
          >
            <Plus size={18} /> Store Secret
          </button>
        </div>
      </header>

      {/* ---------------- SECTION 1: VAULT-ONLY PROJECTS DISPLAY ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-ink flex items-center gap-2">
            <FolderLock size={19} className="text-brand-700" /> Standalone Vault Projects ({vaultOnlyProjects.length})
          </h2>
          <span className="text-[13px] text-muted hidden sm:inline">
            Credentials-only projects (excluded from main Projects list)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vaultOnlyProjects.map((p) => {
            const count = secrets.filter((s) => s.projectId === p.id).length;
            const isSelected = selectedProjectId === String(p.id);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(isSelected ? "all" : String(p.id))}
                className={`panel p-4 cursor-pointer transition border relative group hover:shadow-md ${
                  isSelected ? "border-brand-500 ring-2 ring-brand-200 bg-[#f7fbf8]" : "hover:border-brand-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: p.color || "#2e9e4f" }}
                    >
                      <FolderLock size={19} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[15px] text-ink truncate leading-snug">{p.name}</h3>
                      <p className="text-[12.5px] text-muted">
                        {count === 0 ? "0 credentials saved" : `${count} secret${count === 1 ? "" : "s"} stored`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreselectedProjectId(p.id);
                        setAddingSecret(true);
                      }}
                      className="btn-secondary h-8 px-2.5 text-[12px] inline-flex items-center gap-1"
                      title="Add credential or .env to this project"
                    >
                      <Plus size={13} /> Add
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVaultProject(p, e)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete this vault project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-brand-200/60 flex items-center justify-between text-[11.5px] font-semibold text-brand-700">
                    <span>Filtering secrets for this project</span>
                    <span className="underline">Click to view all</span>
                  </div>
                )}
              </div>
            );
          })}

          {vaultOnlyProjects.length === 0 && (
            <div className="panel p-6 text-center text-muted sm:col-span-2 lg:col-span-3 border-dashed">
              <FolderLock size={28} className="mx-auto text-ink/30 mb-1.5" />
              <p className="text-[14.5px] font-semibold text-ink/75">No Vault-Only Projects Created Yet</p>
              <p className="text-[13px] mt-0.5">Click &quot;New Vault Project&quot; above to create a dedicated container for .env and logins.</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- SECTION 2: SECRETS FILTER & LIST VIEW ---------------- */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-ink flex items-center gap-2">
            <KeyRound size={18} className="text-brand-700" /> Stored Credentials &amp; .env Files ({filteredSecrets.length})
          </h2>
          {selectedProjectObj && (
            <button
              onClick={() => setSelectedProjectId("all")}
              className="text-[13px] font-semibold text-brand-700 hover:underline"
            >
              Clear filter ({selectedProjectObj.name})
            </button>
          )}
        </div>

        {/* Filter and search bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-xs">
          {/* Kind Tabs */}
          <div className="flex rounded-xl border border-line bg-[#f0f5f2] p-1 text-[13.5px] font-semibold">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                kindFilter === "all" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
              }`}
            >
              All Items ({secrets.length})
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
              <KeyRound size={15} /> Logins ({credCount})
            </button>
          </div>

          {/* Project Picker & Search Input */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-[40px] rounded-xl border border-line bg-white px-3 text-[13.5px] font-medium outline-none text-ink/80 focus:border-brand-500"
            >
              <option value="all">All Projects ({localProjects.length})</option>
              {vaultOnlyProjects.length > 0 && (
                <optgroup label="Vault-Only Projects">
                  {vaultOnlyProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Vault Only)
                    </option>
                  ))}
                </optgroup>
              )}
              {localProjects.filter((p) => !p.isVaultOnly).length > 0 && (
                <optgroup label="Workspace Projects">
                  {localProjects
                    .filter((p) => !p.isVaultOnly)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            <div className="flex h-[40px] w-[220px] items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-xs focus-within:border-brand-500">
              <Search size={16} className="text-ink/45 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search credentials..."
                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink/40"
              />
            </div>
          </div>
        </div>

        {/* Secret List View */}
        <section className="panel divide-y divide-line overflow-visible shadow-card">
          {loading && (
            <div className="py-16 text-center text-muted">
              <p className="animate-pulse">Loading credentials from encrypted storage...</p>
            </div>
          )}

          {!loading &&
            filteredSecrets.map((secret) => {
              const isEnv = secret.kind === "env";
              return (
                <div
                  key={secret.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfb]"
                >
                  {/* Kind Icon */}
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      isEnv ? "bg-[#e8f7ec] text-brand-700" : "bg-[#eef4ff] text-[#2b5fd6]"
                    }`}
                  >
                    {isEnv ? <FileCode2 size={21} /> : <KeyRound size={21} />}
                  </span>

                  {/* Label and Project Badge */}
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingSecret(secret)}
                        className="font-bold text-[16px] text-ink hover:text-brand-700 text-left transition"
                      >
                        {secret.label}
                      </button>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold border"
                        style={{
                          backgroundColor: `${secret.projectColor}15`,
                          borderColor: `${secret.projectColor}40`,
                          color: secret.projectColor,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: secret.projectColor }} />
                        {secret.projectName}
                      </span>
                      {secret.isVaultOnly && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                          Vault-only
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-muted mt-0.5">
                      Updated {formatAuditDate(secret.updatedAt)}
                      {secret.lastViewedAt ? ` · Last opened ${formatAuditDate(secret.lastViewedAt)}` : ""}
                    </p>
                  </div>

                  {/* Kind Tag */}
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                      isEnv ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {isEnv ? ".env Configuration" : "Account Login"}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingSecret(secret)}
                      className="btn-primary h-9 px-3.5 text-[13px] inline-flex items-center gap-1.5"
                    >
                      <Eye size={14} /> View &amp; Decrypt
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSecret(secret)}
                      className="icon-btn h-9 w-9 text-ink/65 hover:text-ink"
                      title="Edit secret"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(secret)}
                      className="icon-btn h-9 w-9 text-ink/40 hover:text-red-600 hover:bg-red-50"
                      title="Delete secret"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

          {!loading && filteredSecrets.length === 0 && (
            <div className="py-16 text-center text-muted">
              {selectedProjectObj ? (
                <div>
                  <FolderLock size={34} className="mx-auto text-ink/35 mb-2" />
                  <p className="text-[16px] font-bold text-ink">
                    &quot;{selectedProjectObj.name}&quot; has no credentials stored yet.
                  </p>
                  <p className="mt-1 text-[13.5px]">
                    Click below to store your first .env configuration or login credentials for this project.
                  </p>
                  <button
                    onClick={() => {
                      setPreselectedProjectId(selectedProjectObj.id);
                      setAddingSecret(true);
                    }}
                    className="btn-primary mt-4 mx-auto"
                  >
                    <Plus size={16} /> Add First Secret to {selectedProjectObj.name}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[16px] font-semibold text-ink/70">No credentials or .env files found.</p>
                  <p className="mt-1 text-[13.5px]">Click &quot;Store Secret&quot; above to store your first configuration or login.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </section>

      {/* Modal: View & Decrypt Secret */}
      {viewingSecret && (
        <ViewSecretModal
          secret={viewingSecret}
          onClose={() => setViewingSecret(null)}
          onEdit={(s) => setEditingSecret(s)}
        />
      )}

      {/* Modal: Add Secret */}
      {addingSecret && (
        <SecretFormModal
          allProjects={localProjects}
          initialProjectId={preselectedProjectId}
          onClose={() => {
            setAddingSecret(false);
            setPreselectedProjectId(null);
          }}
          onSaved={loadData}
          onOpenNewVaultProject={() => {
            setAddingSecret(false);
            setCreatingVaultProject(true);
          }}
        />
      )}

      {/* Modal: Edit Secret */}
      {editingSecret && (
        <SecretFormModal
          secretToEdit={editingSecret}
          allProjects={localProjects}
          onClose={() => setEditingSecret(null)}
          onSaved={loadData}
          onOpenNewVaultProject={() => {
            setEditingSecret(false);
            setCreatingVaultProject(true);
          }}
        />
      )}

      {/* Modal: Create Vault Project */}
      {creatingVaultProject && (
        <NewVaultProjectModal
          onClose={() => setCreatingVaultProject(false)}
          onCreated={(newProj) => {
            setLocalProjects((cur) => [...cur, newProj]);
            if (typeof setProjects === "function") {
              setProjects((cur) => [...cur, newProj]);
            }
            setSelectedProjectId(String(newProj.id));
            setPreselectedProjectId(newProj.id);
            setAddingSecret(true);
          }}
        />
      )}
    </div>
  );
}
