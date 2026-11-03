// Superadmin session and authentication helpers (server only).
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SUPERADMIN_COOKIE = "nexa_superadmin_session";
const SESSION_DAYS = 7;

const getSecret = () => process.env.VAULT_KEY || "nexa-superadmin-secret-key-2026";
export const getSuperadminEmail = () => (process.env.SUPERADMIN_EMAIL || "admin@pms.com").trim().toLowerCase();
export const getSuperadminPassword = () => process.env.SUPERADMIN_PASSWORD || "pms@0302";

const secureCookie = () =>
  process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production";

function signToken(payloadStr) {
  const hmac = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("base64url");
  return `${payloadStr}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (!data || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function verifySuperadminCredentials(email, password) {
  if (!email || !password) return false;
  const cleanEmail = String(email).trim().toLowerCase();
  const expectedEmail = getSuperadminEmail();
  const expectedPassword = getSuperadminPassword();

  if (cleanEmail !== expectedEmail) return false;
  try {
    const a = Buffer.from(String(password));
    const b = Buffer.from(String(expectedPassword));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function startSuperadminSession(email) {
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      role: "superadmin",
      exp: expires.getTime(),
    }),
  ).toString("base64url");

  const token = signToken(payload);
  (await cookies()).set(SUPERADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    expires,
  });
}

export async function endSuperadminSession() {
  const store = await cookies();
  store.delete(SUPERADMIN_COOKIE);
}

export async function getSuperadminSession() {
  const store = await cookies();
  const token = store.get(SUPERADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
