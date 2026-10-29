"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Info, Loader2, LockKeyhole, Mail, TriangleAlert } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";
import { roleLabel } from "@/lib/permissions";

const box =
  "flex h-[52px] items-center gap-3 rounded-xl border border-line bg-white px-4 shadow-[0_1px_2px_rgba(16,60,35,0.05)] transition focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-100";
const input = "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40 disabled:opacity-60";

/**
 * The sign-in form. `demo` (local development only) lists the demo accounts with their password,
 * so each role can be tried with one click.
 */
export default function LoginForm({ noAccounts, demo }) {
  const router = useRouter();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(emailValue, passwordValue) {
    setBusy(true);
    setError("");
    const { ok, data } = await request("/api/auth/login", "POST", { email: emailValue, password: passwordValue });
    if (!ok) {
      setBusy(false);
      setError(data?.error ?? "Could not sign in. Check your connection and try again.");
      // Leave the e-mail as typed and put the cursor back in the password, ready for another try.
      requestAnimationFrame(() => passwordRef.current?.select());
      return;
    }
    router.replace("/");
    router.refresh();
  }

  function submit(event) {
    event.preventDefault();
    signIn(email, password);
  }

  function signInAs(account) {
    setEmail(account.email);
    setPassword(demo.password);
    signIn(account.email, demo.password);
  }

  const checkCaps = (event) => setCapsLock(Boolean(event.getModifierState?.("CapsLock")));

  return (
    <div className="w-full">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f7ec] text-brand-700 ring-1 ring-brand-100">
        <LockKeyhole size={22} />
      </span>
      <h1 className="mt-5 text-[30px] font-extrabold leading-tight tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">Sign in to the Nexa Solution workspace with the account your admin created for you.</p>

      {noAccounts && (
        <p className="mt-5 rounded-xl bg-[#fdf0c4] px-4 py-3 text-[13.5px] leading-relaxed text-[#6f5200]">
          There are no accounts yet. On the server run <code className="font-mono">npm run create-admin -- you@company.com &quot;Your Name&quot; password</code> to create
          the first admin.
        </p>
      )}

      <form onSubmit={submit} className="mt-7">
        <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="login-email">
          Work e-mail
        </label>
        <div className={`mt-1.5 ${box}`}>
          <Mail size={18} className="shrink-0 text-ink/50" />
          <input
            id="login-email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            disabled={busy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@nexasolution.in"
            className={input}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="login-password">
            Password
          </label>
          <button type="button" className="text-[13px] font-semibold text-brand-700 hover:underline" onClick={() => setForgot((open) => !open)} aria-expanded={forgot}>
            Forgot password?
          </button>
        </div>
        <div className={`mt-1.5 ${box}`}>
          <LockKeyhole size={18} className="shrink-0 text-ink/50" />
          <input
            ref={passwordRef}
            id="login-password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={busy}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={checkCaps}
            onKeyUp={checkCaps}
            onBlur={() => setCapsLock(false)}
            placeholder="Your password"
            className={input}
          />
          <button
            type="button"
            className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/55 transition hover:bg-black/5 hover:text-ink"
            onClick={() => setShow((on) => !on)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {capsLock && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#8a6508]">
            <TriangleAlert size={14} /> Caps Lock is on.
          </p>
        )}
        {forgot && (
          <p className="mt-3 flex gap-2 rounded-xl bg-[#eef6f0] px-4 py-3 text-[13.5px] leading-relaxed text-ink/80">
            <Info size={16} className="mt-0.5 shrink-0 text-brand-700" />
            Ask an admin to reset it from the Team page. You can change it to your own once you are signed in.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-[#fde4e4] px-4 py-3 text-[13.5px] font-medium leading-relaxed text-[#b42323]">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button className="btn-primary mt-6 h-[52px] w-full rounded-xl text-[15.5px]" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={18} />
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[12.5px] text-muted">You stay signed in on this device for 14 days.</p>
      </form>

      {demo && (
        <div className="mt-8 rounded-2xl border border-dashed border-[#cfdcd3] bg-white/60 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/60">Demo accounts · this computer only</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {demo.accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                onClick={() => signInAs(account)}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-[#f6faf7] disabled:opacity-60"
              >
                <Avatar name={account.name} id={account.id} size={30} />
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13.5px] font-semibold">{account.name}</span>
                  <span className="block text-[12px] text-muted">{roleLabel[account.role]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
