import crypto from "node:crypto";
import { startSession } from "@/lib/auth";
import { findEmailVerification, verifyUserEmail } from "@/lib/db/users";
import { fail, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export async function POST(request) {
  const body = await readJson(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return fail("Verification token is missing.", 400);
  }

  const tokenHash = sha256(token);
  const record = findEmailVerification(tokenHash);

  if (!record) {
    return fail("This verification link is invalid or has already been used.", 400);
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return fail("This verification link has expired. Please request a new one.", 410, { expired: true, email: record.user?.email });
  }

  try {
    // Activate user and mark email as verified
    const user = verifyUserEmail(record.userId);

    // Auto-login: start user session
    await startSession(user.id);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return fail("Failed to verify email. Please try again.", 500);
  }
}
