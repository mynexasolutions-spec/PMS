"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { request } from "@/lib/api";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState({
    status: "loading", // "loading" | "success" | "error"
    message: "",
    user: null,
  });

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "No verification token provided. Please check the link in your email.",
        user: null,
      });
      return;
    }

    let isMounted = true;

    async function verify() {
      const { ok, data } = await request("/api/auth/verify", "POST", { token });
      if (!isMounted) return;

      if (ok && data?.success) {
        setState({
          status: "success",
          message: "Your email has been verified successfully!",
          user: data.user,
        });

        // Automatically take them into the app
        setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 2500);
      } else {
        setState({
          status: "error",
          message: data?.error || "This verification link is invalid or has already been used.",
          user: null,
        });
        if (data?.email) {
          setResendEmail(data.email);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  async function handleResend(e) {
    e?.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) return;

    setResending(true);
    setResendMsg("");

    const { ok, data } = await request("/api/auth/resend-verification", "POST", { email: resendEmail });
    setResending(false);

    if (ok) {
      setResendMsg("A new verification link has been sent to your email!");
    } else {
      setResendMsg(data?.error || "Failed to resend link. Please try again.");
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#070d18] px-4 py-12">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a]/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        
        {/* Brand header */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Nexa PMS</span>
        </div>

        {/* Loading State */}
        {state.status === "loading" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white">Verifying your email...</h2>
            <p className="mt-2 text-sm text-slate-400">
              Please wait while we confirm your verification link with Nexa PMS.
            </p>
          </div>
        )}

        {/* Success State */}
        {state.status === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-semibold text-white">Email Verified!</h2>
            <p className="mt-2 text-sm text-slate-300">
              Welcome aboard, <strong className="text-white">{state.user?.name || "Member"}</strong>!
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your account is active. Taking you to your dashboard in a moment...
            </p>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                Go to Dashboard Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ring-8 ring-rose-500/10">
              <XCircle className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-semibold text-white">Verification Failed</h2>
            <p className="mt-2 text-sm text-slate-300">{state.message}</p>

            {/* Resend section */}
            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
              <p className="text-xs font-medium text-slate-400">
                Need a new verification link? Enter your email:
              </p>
              <form onSubmit={handleResend} className="mt-3 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Resend
                </button>
              </form>
              {resendMsg && (
                <p className="mt-2.5 text-xs text-emerald-400">
                  {resendMsg}
                </p>
              )}
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-xs font-medium text-slate-400 hover:text-white"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070d18] text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
