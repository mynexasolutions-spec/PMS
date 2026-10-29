import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import LoginHero from "@/components/auth/LoginHero";
import { getSessionUser } from "@/lib/auth";
import { istHour } from "@/lib/dates";
import { DEMO_USERS } from "@/lib/db/seed";
import { countUsers, listUsers } from "@/lib/db/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in – Nexa PMS" };

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** One-click demo sign-in while developing on this computer. Never in production, never when opened from another machine. */
async function demoAccounts() {
  if (process.env.NODE_ENV === "production" || process.env.NEXA_SEED_DEMO === "false") return null;
  if (!LOCAL_HOST.test((await headers()).get("host") ?? "")) return null;

  const demoEmails = new Set(DEMO_USERS.map(([, email]) => email));
  const accounts = listUsers()
    .filter((user) => user.active && demoEmails.has(user.email))
    .map(({ id, name, email, role }) => ({ id, name, email, role }));
  return accounts.length ? { accounts, password: process.env.NEXA_DEMO_PASSWORD || "nexa-demo-1234" } : null;
}

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <LoginHero initialHour={istHour()} />
      <div className="flex flex-col px-5 pb-8 pt-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
        <div className="mx-auto my-auto w-full max-w-[410px]">
          <LoginForm noAccounts={countUsers() === 0} demo={await demoAccounts()} />
        </div>
        <p className="mt-10 text-center text-[12.5px] text-muted">© {new Date().getFullYear()} Nexa Solution · Need an account? Ask your admin.</p>
      </div>
    </main>
  );
}
