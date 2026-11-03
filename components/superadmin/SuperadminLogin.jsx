"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { request } from "@/lib/api";

const box =
  "flex h-[50px] items-center gap-3 rounded-xl border border-line bg-white px-4 shadow-[0_1px_2px_rgba(16,60,35,0.05)] transition focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-100";
const input = "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40 disabled:opacity-60";

export default function SuperadminLogin() {
  const router = useRouter();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { ok, data } = await request("/api/superadmin/login", "POST", {
      email,
      password,
    });

    if (!ok) {
      setBusy(false);
      setError(data?.error || "Invalid credentials. Access denied.");
      requestAnimationFrame(() => passwordRef.current?.select());
      return;
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13.5px] font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to Workspace
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-800 ring-1 ring-brand-200">
            <ShieldCheck size={14} /> Protected Portal
          </span>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f7ec] p-2 ring-1 ring-brand-200">
              <Image
                src="/logo.png"
                alt="Nexa PMS"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Superadmin Portal</h1>
              <p className="text-[13.5px] text-muted">Nexa PMS System Overview & Audit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="sa-email">
              Superadmin Username
            </label>
            <div className={`mt-1.5 ${box}`}>
              <Mail size={18} className="shrink-0 text-ink/50" />
              <input
                id="sa-email"
                type="email"
                required
                autoFocus
                autoComplete="username"
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter superadmin username"
                className={input}
              />
            </div>

            <label className="mt-4 block text-[13.5px] font-semibold text-ink/85" htmlFor="sa-password">
              Password
            </label>
            <div className={`mt-1.5 ${box}`}>
              <LockKeyhole size={18} className="shrink-0 text-ink/50" />
              <input
                ref={passwordRef}
                id="sa-password"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                disabled={busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter superadmin password"
                className={input}
              />
              <button
                type="button"
                className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/55 transition hover:bg-black/5 hover:text-ink"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl bg-[#fde4e4] px-4 py-3 text-[13.5px] font-medium text-[#b42323]"
              >
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button className="btn-primary mt-6 h-[50px] w-full rounded-xl text-[15px]" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying access...
                </>
              ) : (
                <>
                  Sign in to Superadmin <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12.5px] text-muted">
          Restricted to authorized system administrators only.
        </p>
      </div>
    </main>
  );
}
