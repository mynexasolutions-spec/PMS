import crypto from "node:crypto";
import { createEmailVerification, getUserForLogin } from "@/lib/db/users";
import { sendVerificationEmail } from "@/lib/email";
import { fail, readJson } from "@/lib/http";
import { lockedFor, recordFailure, clearFailures } from "@/lib/rateLimit";

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
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    return fail("Please enter a valid e-mail address.", 400);
  }

  // Rate limit resend requests per IP + email
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const rateKey = `resend|${ip}|${email}`;
  const wait = lockedFor(rateKey);
  if (wait) {
    return fail(`Please wait ${Math.ceil(wait / 60)} minute(s) before requesting another email.`, 429);
  }

  const user = getUserForLogin(email);
  if (!user) {
    // Return friendly response without leaking account existence
    return Response.json({
      success: true,
      message: "If an account with that e-mail exists and is unverified, a verification link has been sent.",
    });
  }

  if (user.emailVerified && user.active) {
    return fail("This account is already verified. Please sign in.", 400);
  }

  try {
    recordFailure(rateKey); // throttles repeated clicks
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    createEmailVerification(user.id, tokenHash, expiresAt);

    const verificationUrl = `${getBaseUrl(request)}/verify?token=${rawToken}`;
    await sendVerificationEmail({ toEmail: user.email, toName: user.name, verificationUrl });

    return Response.json({
      success: true,
      message: `A fresh verification link has been sent to ${user.email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return fail("Could not send verification email. Please try again later.", 500);
  }
}
