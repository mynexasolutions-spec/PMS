"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Clock, KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react";
import { request } from "@/lib/api";

const MAX_ATTEMPTS = 5;
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes auto-lock
const COOLDOWN_KEY = "nexa_vault_cooldown_until";

export default function CredentialsLock({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [animState, setAnimState] = useState("idle"); // "idle" | "unlocking" | "error" | "cooldown"
  const [busy, setBusy] = useState(false);

  const inputRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // 1. Check existing cooldown on mount (both local storage & server)
  useEffect(() => {
    const localUntil = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const now = Date.now();
    if (localUntil > now) {
      setCooldownRemainingMs(localUntil - now);
      setAnimState("cooldown");
    }

    // Verify with server
    let ignore = false;
    async function checkServerStatus() {
      const res = await request("/api/vault/verify-pin");
      if (ignore) return;
      if (res.ok && res.data) {
        if (res.data.locked) {
          const ms = res.data.cooldownRemainingMs || 600000;
          setCooldownRemainingMs(ms);
          localStorage.setItem(COOLDOWN_KEY, String(Date.now() + ms));
          setAnimState("cooldown");
          setAttemptsLeft(0);
        } else if (typeof res.data.attemptsLeft === "number") {
          setAttemptsLeft(res.data.attemptsLeft);
        }
      }
    }
    checkServerStatus();

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Cooldown countdown ticker
  useEffect(() => {
    if (cooldownRemainingMs <= 0) return;

    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(cooldownTimerRef.current);
          localStorage.removeItem(COOLDOWN_KEY);
          setAnimState("idle");
          setAttemptsLeft(MAX_ATTEMPTS);
          setErrorMsg("");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownRemainingMs]);

  // 3. Keep keyboard input focused at all times
  useEffect(() => {
    if (!unlocked && animState !== "cooldown" && animState !== "unlocking") {
      inputRef.current?.focus();
    }
  }, [unlocked, animState]);

  // 4. Inactivity auto-lock (10 minutes) when unlocked
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      handleLock("Session timed out after 10 minutes of inactivity.");
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    resetInactivityTimer();

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    const handleUserActivity = () => resetInactivityTimer();

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [unlocked, resetInactivityTimer]);

  const handleLock = (msg = "") => {
    setUnlocked(false);
    setPin("");
    setAnimState("idle");
    setErrorMsg(msg);
  };

  // 5. Submit PIN verification
  const verifyPin = async (candidatePin) => {
    if (busy || animState === "unlocking" || cooldownRemainingMs > 0) return;
    setBusy(true);
    setErrorMsg("");

    try {
      const res = await request("/api/vault/verify-pin", "POST", { pin: candidatePin });

      if (res.ok) {
        // macOS/iOS snappy spring unlock animation (quick & buttery smooth)
        setAnimState("unlocking");
        setTimeout(() => {
          setUnlocked(true);
          setBusy(false);
          setPin("");
          setAnimState("idle");
        }, 420); // 420ms snappy response
      } else {
        // Wrong PIN
        const data = res.data || {};
        if (data.locked) {
          const ms = data.cooldownRemainingMs || 10 * 60 * 1000;
          setCooldownRemainingMs(ms);
          localStorage.setItem(COOLDOWN_KEY, String(Date.now() + ms));
          setAnimState("cooldown");
          setErrorMsg(data.error || "Maximum attempts reached. Locked for 10 minutes.");
        } else {
          setAnimState("error");
          setAttemptsLeft(data.attemptsLeft ?? 0);
          setErrorMsg(data.error || "Incorrect PIN.");
          setTimeout(() => {
            setPin("");
            setAnimState("idle");
            inputRef.current?.focus();
          }, 450);
        }
        setBusy(false);
      }
    } catch {
      setAnimState("error");
      setErrorMsg("Network error verifying PIN. Please try again.");
      setBusy(false);
      setTimeout(() => {
        setPin("");
        setAnimState("idle");
      }, 450);
    }
  };

  const handleDigit = (digit) => {
    if (pin.length >= 4 || animState === "unlocking" || cooldownRemainingMs > 0 || busy) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg("");
    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (animState === "unlocking" || cooldownRemainingMs > 0 || busy) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
    if (animState === "error") setAnimState("idle");
  };

  const handleKeyDown = (e) => {
    if (animState === "unlocking" || cooldownRemainingMs > 0) return;
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      handleDigit(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      handleBackspace();
    }
  };

  // Cooldown time formatting MM:SS
  const formatCooldown = (ms) => {
    const totalSecs = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // If successfully unlocked, render credentials view
  if (unlocked) {
    return (
      <div className="relative animate-[fadeIn_0.3s_ease-out]">
        {/* Floating Quick-Lock button */}
        <div className="fixed bottom-6 right-6 z-40 print:hidden">
          <button
            onClick={() => handleLock("Vault manually locked.")}
            className="group flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/95 px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-lg backdrop-blur-md transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-xl active:scale-95"
            title="Lock credentials storage immediately"
          >
            <Lock size={15} className="text-emerald-700 transition-colors group-hover:text-red-600" />
            <span>Lock Vault</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Otherwise, render Apple/macOS Minimalist Spring Lock Screen
  const isUnlocking = animState === "unlocking";
  const isError = animState === "error";
  const isCooldown = animState === "cooldown" || cooldownRemainingMs > 0;

  return (
    <div
      className="relative flex min-h-[68vh] w-full items-center justify-center p-4 select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden real input capturing desktop and mobile keyboard */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
          setPin(val);
          if (val.length === 4) verifyPin(val);
        }}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoFocus
        disabled={isCooldown || isUnlocking || busy}
        tabIndex={0}
      />

      {/* Main Glassmorphism Card */}
      <div
        className={`relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-emerald-950/10 bg-white/95 px-8 py-8 shadow-[0_20px_50px_-12px_rgba(20,80,45,0.1)] backdrop-blur-2xl transition-all duration-300 ${
          isError ? "animate-[lockShake_0.4s_cubic-bezier(0.36,0.07,0.19,0.97)]" : ""
        } ${isUnlocking ? "scale-[0.98] opacity-90 transition-transform duration-300" : ""}`}
      >
        {/* Apple/macOS Center Lock Badge with Spring Animation */}
        <div className="relative mb-5 flex flex-col items-center text-center">
          <div
            className={`relative flex h-18 w-18 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${
              isUnlocking
                ? "scale-110 bg-emerald-600 text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] ring-4 ring-emerald-200"
                : isError
                ? "bg-red-50 text-red-600 ring-2 ring-red-200"
                : isCooldown
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-900/10"
            }`}
          >
            {isUnlocking ? (
              <Unlock size={32} className="animate-[scalePop_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]" />
            ) : isCooldown ? (
              <Clock size={32} className="animate-pulse" />
            ) : (
              <Lock
                size={30}
                className={`transition-transform duration-200 ${pin.length > 0 ? "scale-105" : ""}`}
              />
            )}
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold tracking-tight text-slate-900">
            {isUnlocking ? "Vault Unlocked" : isCooldown ? "Security Lockout" : "Credentials Vault"}
          </h2>
          <p className="mt-1 text-[12.5px] text-slate-500">
            {isCooldown
              ? "Too many incorrect attempts. Please wait."
              : isUnlocking
              ? "Access verified. Opening..."
              : "Type your 4-digit security PIN"}
          </p>
        </div>

        {/* ---------------- 4 APPLE-STYLE PIN DOTS / PILLS ---------------- */}
        {!isCooldown ? (
          <div className="relative my-5 flex items-center justify-center gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-[18px] font-bold transition-all duration-150 ${
                    isError
                      ? "border-red-400 bg-red-50 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : isUnlocking
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)] scale-105"
                      : isFilled
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,138,76,0.3)] scale-105"
                      : "border-slate-200 bg-slate-50/80 text-slate-400"
                  }`}
                  onClick={() => inputRef.current?.focus()}
                >
                  {isUnlocking ? <Check size={18} strokeWidth={3} /> : isFilled ? "●" : ""}
                </div>
              );
            })}
          </div>
        ) : (
          /* Cooldown Timer View */
          <div className="my-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-red-700 font-semibold text-[13px]">
              <Clock size={15} />
              <span>Retry Countdown</span>
            </div>
            <div className="mt-1 font-mono text-[28px] font-extrabold tracking-wider text-red-600">
              {formatCooldown(cooldownRemainingMs)}
            </div>
          </div>
        )}

        {/* Status / Error Message */}
        <div className="min-h-[22px] text-center">
          {isUnlocking ? (
            <p className="text-[12.5px] font-semibold text-emerald-700">Opening secure storage...</p>
          ) : errorMsg ? (
            <p className="flex items-center justify-center gap-1 text-[12px] font-medium text-red-600">
              <AlertCircle size={13} /> {errorMsg}
            </p>
          ) : !isCooldown ? (
            <p className="text-[11.5px] text-slate-400">
              {attemptsLeft < MAX_ATTEMPTS ? (
                <span className="font-medium text-amber-600">
                  {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} remaining
                </span>
              ) : (
                "Press Backspace to clear"
              )}
            </p>
          ) : null}
        </div>

        {/* Bottom subtle footnote */}
        <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-center text-[11.5px] text-slate-400">
          <KeyRound size={12} className="text-slate-400" />
          <span>Auto-locks on leaving or 10m inactivity</span>
        </div>
      </div>
    </div>
  );
}
