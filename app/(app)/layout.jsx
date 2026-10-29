import { redirect } from "next/navigation";
import { AppProvider } from "@/components/AppProvider";
import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/db/repo";

// Every request reads fresh data from the database, for the signed-in person only.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppProvider initial={getSnapshot(user)}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
