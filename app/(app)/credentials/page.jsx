import CredentialsView from "@/components/credentials/CredentialsView";
import CredentialsLock from "@/components/credentials/CredentialsLock";

export const dynamic = "force-dynamic";
export const metadata = { title: "Project Credentials Storage – Nexa PMS" };

export default function Page() {
  return (
    <CredentialsLock>
      <CredentialsView />
    </CredentialsLock>
  );
}
