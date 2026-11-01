"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  TriangleAlert,
  User,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { request } from "@/lib/api";

const box =
  "flex h-[50px] items-center gap-3 rounded-xl border border-line bg-white px-4 shadow-[0_1px_2px_rgba(16,60,35,0.05)] transition focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-100";
const input = "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/40 disabled:opacity-60";

/**
 * Sign-in and Sign-up form with account switcher and email verification support.
 */
export default function LoginForm({ noAccounts, demo }) {
  const router = useRouter();
  const passwordRef = useRef(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Email verification state
  const [verificationSent, setVerificationSent] = useState(null); // { email, message }
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  async function handleSignIn(emailValue, passwordValue) {
    setBusy(true);
    setError("");
    setUnverifiedEmail("");
    setResendNotice("");

    const { ok, data } = await request("/api/auth/login", "POST", { email: emailValue, password: passwordValue });
    if (!ok) {
      setBusy(false);
      setError(data?.error ?? "Could not sign in. Please check your credentials.");
      if (data?.unverified) {
        setUnverifiedEmail(data.email || emailValue);
      }
      requestAnimationFrame(() => passwordRef.current?.select());
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function handleSignUp(nameValue, emailValue, passwordValue) {
    setBusy(true);
    setError("");
    setResendNotice("");

    const { ok, data } = await request("/api/auth/register", "POST", {
      name: nameValue,
      email: emailValue,
      password: passwordValue,
    });

    setBusy(false);

    if (!ok) {
      setError(data?.error ?? "Could not create account. Please try again.");
      return;
    }

    if (data?.pendingVerification) {
      setVerificationSent({
        email: data.email || emailValue,
        message: data.message || "We have sent a verification link to your email address.",
      });
      return;
    }

    // Fallback if verification was bypassed
    router.replace("/");
    router.refresh();
  }

  async function handleResend(targetEmail) {
    const toSend = targetEmail || email || unverifiedEmail;
    if (!toSend) return;

    setResending(true);
    setResendNotice("");

    const { ok, data } = await request("/api/auth/resend-verification", "POST", { email: toSend });
    setResending(false);

    if (ok) {
      setResendNotice("Verification link resent! Please check your inbox.");
    } else {
      setResendNotice(data?.error || "Failed to resend link. Please try again.");
    }
  }

  function submit(event) {
    event.preventDefault();
    if (mode === "signin") {
      handleSignIn(email, password);
    } else {
      handleSignUp(name, email, password);
    }
  }

  function signInAs(account) {
    setEmail(account.email);
    setPassword(demo.password);
    setMode("signin");
    setVerificationSent(null);
    handleSignIn(account.email, demo.password);
  }

  const checkCaps = (event) => setCapsLock(Boolean(event.getModifierState?.("CapsLock")));

  // If verification email was just sent after signup
  if (verificationSent) {
    return (
      <div className="w-full">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <Mail size={24} />
        </span>

        <div className="mt-5">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink">Check your inbox</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            We sent a verification link to <strong className="font-semibold text-ink">{verificationSent.email}</strong>.
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            Please click the button inside the email to activate your account and start using Nexa PMS.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-[#f8faf9] p-4 text-center">
          <p className="text-[13px] text-ink/75">Didn’t receive the email? Check your spam folder or resend it.</p>
          <button
            type="button"
            disabled={resending}
            onClick={() => handleResend(verificationSent.email)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-brand-700 shadow-xs ring-1 ring-line hover:bg-gray-50 disabled:opacity-50"
          >
            {resending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Resend verification email
          </button>
          {resendNotice && <p className="mt-2.5 text-[12.5px] font-medium text-brand-700">{resendNotice}</p>}
        </div>

        <button
          type="button"
          onClick={() => {
            setVerificationSent(null);
            setMode("signin");
            setError("");
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-[14px] font-semibold text-ink shadow-xs hover:bg-gray-50"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f7ec] text-brand-700 ring-1 ring-brand-100">
        <LockKeyhole size={22} />
      </span>

      <div className="mt-5">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
          {mode === "signin"
            ? "Sign in to access your projects and workspace."
            : "Register your account. We will send a secure activation link to your email."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mt-6 flex rounded-xl border border-line bg-[#f0f4f1] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError("");
            setUnverifiedEmail("");
            setResendNotice("");
          }}
          className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition ${
            mode === "signin" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setUnverifiedEmail("");
            setResendNotice("");
          }}
          className={`flex-1 rounded-lg py-2 text-[14px] font-semibold transition ${
            mode === "signup" ? "bg-white text-ink shadow-xs" : "text-ink/65 hover:text-ink"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={submit} className="mt-6">
        {mode === "signup" && (
          <div className="mb-4">
            <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="register-name">
              Full name
            </label>
            <div className={`mt-1.5 ${box}`}>
              <User size={18} className="shrink-0 text-ink/50" />
              <input
                id="register-name"
                type="text"
                required
                autoFocus={mode === "signup"}
                disabled={busy}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                className={input}
              />
            </div>
          </div>
        )}

        <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="login-email">
          Work e-mail
        </label>
        <div className={`mt-1.5 ${box}`}>
          <Mail size={18} className="shrink-0 text-ink/50" />
          <input
            id="login-email"
            type="email"
            required
            autoFocus={mode === "signin"}
            autoComplete="username"
            disabled={busy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className={input}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="block text-[13.5px] font-semibold text-ink/85" htmlFor="login-password">
            Password
          </label>
        </div>
        <div className={`mt-1.5 ${box}`}>
          <LockKeyhole size={18} className="shrink-0 text-ink/50" />
          <input
            ref={passwordRef}
            id="login-password"
            type={show ? "text" : "password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            disabled={busy}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={checkCaps}
            onKeyUp={checkCaps}
            onBlur={() => setCapsLock(false)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
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

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-[#fde4e4] px-4 py-3 text-[13.5px] font-medium leading-relaxed text-[#b42323]">
            <div className="flex gap-2">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
            {unverifiedEmail && (
              <div className="mt-2.5 border-t border-[#f5b8b8] pt-2">
                <button
                  type="button"
                  disabled={resending}
                  onClick={() => handleResend(unverifiedEmail)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8a1818] underline hover:text-black disabled:opacity-50"
                >
                  {resending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Resend verification email to {unverifiedEmail}
                </button>
                {resendNotice && <p className="mt-1 text-[12px] font-medium text-brand-800">{resendNotice}</p>}
              </div>
            )}
          </div>
        )}

        <button className="btn-primary mt-6 h-[50px] w-full rounded-xl text-[15px]" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> {mode === "signin" ? "Signing in..." : "Sending verification..."}
            </>
          ) : (
            <>
              {mode === "signin" ? "Sign in" : "Create account & verify"} <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="mt-4 text-center">
          {mode === "signin" ? (
            <p className="text-[13.5px] text-muted">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setUnverifiedEmail("");
                  setResendNotice("");
                }}
                className="font-semibold text-brand-700 hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-[13.5px] text-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setUnverifiedEmail("");
                  setResendNotice("");
                }}
                className="font-semibold text-brand-700 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>

      {/* Available accounts / Demo sign-in */}
      {demo && (
        <div className="mt-8 rounded-2xl border border-dashed border-[#cfdcd3] bg-white/60 p-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink/60">
            Registered Accounts · Quick Sign-In
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {demo.accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                onClick={() => signInAs(account)}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-[#f6faf7] disabled:opacity-60"
              >
                <Avatar name={account.name} id={account.id} size={32} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[13.5px] font-semibold">{account.name}</span>
                  <span className="block truncate text-[11.5px] text-muted">{account.email}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
