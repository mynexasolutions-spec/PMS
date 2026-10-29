import { endSession } from "@/lib/auth";
import { noContent } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return noContent();
}
