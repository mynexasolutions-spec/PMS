import { authorize } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// In-memory tracker for rate limiting PIN verification attempts per user.
// Survives page reloads and prevents brute forcing.
const userAttempts = new Map();

function getMasterPin() {
  return String(process.env.VAULT_MASTER_PIN || "0302").trim();
}

export async function GET(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const record = userAttempts.get(auth.user.id);
  const now = Date.now();

  if (record?.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingMs = record.lockedUntil - now;
      return Response.json(
        { locked: true, cooldownRemainingMs: remainingMs, attemptsLeft: 0 },
        { headers: noStore }
      );
    } else {
      // Cooldown expired
      userAttempts.delete(auth.user.id);
    }
  }

  const attemptsUsed = userAttempts.get(auth.user.id)?.attempts || 0;
  return Response.json(
    {
      locked: false,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attemptsUsed),
    },
    { headers: noStore }
  );
}

export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const now = Date.now();
  let record = userAttempts.get(auth.user.id) || { attempts: 0, lockedUntil: null };

  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingMs = record.lockedUntil - now;
      return Response.json(
        {
          ok: false,
          error: "Vault is locked due to too many failed attempts.",
          locked: true,
          cooldownRemainingMs: remainingMs,
          attemptsLeft: 0,
        },
        { status: 429, headers: noStore }
      );
    } else {
      // Cooldown has elapsed
      record = { attempts: 0, lockedUntil: null };
      userAttempts.delete(auth.user.id);
    }
  }

  const body = await readJson(request);
  const enteredPin = String(body?.pin || "").trim();
  const masterPin = getMasterPin();

  if (enteredPin === masterPin) {
    // Reset failed counter on successful unlock
    userAttempts.delete(auth.user.id);
    return Response.json(
      { ok: true, message: "PIN verified successfully." },
      { headers: noStore }
    );
  }

  // Failed attempt
  record.attempts = (record.attempts || 0) + 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + COOLDOWN_MS;
    userAttempts.set(auth.user.id, record);
    return Response.json(
      {
        ok: false,
        error: "Maximum failed attempts reached. Vault is locked for 10 minutes.",
        locked: true,
        cooldownRemainingMs: COOLDOWN_MS,
        attemptsLeft: 0,
      },
      { status: 429, headers: noStore }
    );
  }

  userAttempts.set(auth.user.id, record);
  const left = MAX_ATTEMPTS - record.attempts;
  return Response.json(
    {
      ok: false,
      error: `Incorrect PIN. ${left} ${left === 1 ? "attempt" : "attempts"} remaining.`,
      locked: false,
      attemptsLeft: left,
    },
    { status: 400, headers: noStore }
  );
}
