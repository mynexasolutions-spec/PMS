import SuperadminDashboard from "@/components/superadmin/SuperadminDashboard";
import SuperadminLogin from "@/components/superadmin/SuperadminLogin";
import { getSuperadminOverview } from "@/lib/db/repo";
import { getSuperadminEmail, getSuperadminSession } from "@/lib/superadmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Superadmin Portal – Nexa PMS" };

export default async function SuperadminPage() {
  const session = await getSuperadminSession();

  if (!session) {
    return <SuperadminLogin defaultEmail={getSuperadminEmail()} />;
  }

  const overview = getSuperadminOverview();

  return <SuperadminDashboard data={overview} superadminEmail={session.email} />;
}
