import crypto from "node:crypto";
import { createEmailVerification, createUser, getUserForLogin } from "@/lib/db/users";
import { sendVerificationEmail } from "@/lib/email";
import { fail, readJson } from "@/lib/http";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function getBaseUrl(request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(request) {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return fail("Please enter your name.", 400);
  if (name.length > 60) return fail("Name cannot exceed 60 characters.", 400);

  if (!email || !email.includes("@")) return fail("Please enter a valid work e-mail.", 400);
  if (email.length > 120) return fail("E-mail cannot exceed 120 characters.", 400);

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
  }

  const existing = getUserForLogin(email);
  if (existing) {
    // If account exists and already verified, prompt them to sign in
    if (existing.emailVerified) {
      return fail("An account with that e-mail already exists. Please sign in.", 409);
    }

    // Account exists but is unverified: refresh verification token and resend email
    try {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = sha256(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      createEmailVerification(existing.id, tokenHash, expiresAt);

      const verificationUrl = `${getBaseUrl(request)}/verify?token=${rawToken}`;
      await sendVerificationEmail({ toEmail: existing.email, toName: existing.name, verificationUrl });

      return Response.json(
        {
          pendingVerification: true,
          email: existing.email,
          message: "Account already registered! A fresh verification link has been sent to your email.",
        },
        { status: 200 }
      );
    } catch (err) {
      console.error("Failed to resend verification email:", err);
      return fail("Account exists but failed to send verification email. Please try again.", 500);
    }
  }

  try {
    const passwordHash = await hashPassword(password);
    // User is created with active = 0 and email_verified = 0 until they verify via email
    const user = createUser({ name, email, role: "member", passwordHash, active: 0, emailVerified: 0 });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    createEmailVerification(user.id, tokenHash, expiresAt);

    const verificationUrl = `${getBaseUrl(request)}/verify?token=${rawToken}`;
    await sendVerificationEmail({ toEmail: user.email, toName: user.name, verificationUrl });

    return Response.json(
      {
        pendingVerification: true,
        email: user.email,
        message: "Account created! We've sent a verification link to your email address.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign up error:", error);
    return fail("Could not create account. Please check your details and try again.", 500);
  }
}
