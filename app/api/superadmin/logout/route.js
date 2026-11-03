import { endSuperadminSession } from "@/lib/superadmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await endSuperadminSession();
  return Response.json({ ok: true });
}
