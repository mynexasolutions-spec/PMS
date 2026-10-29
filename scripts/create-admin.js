// Creates an account from the command line (use it for the first admin on a server):
//   npm run create-admin -- you@company.com "Your Name" "a-long-password" [admin|manager|member]
// The role defaults to admin. Set DATABASE_PATH to the same value the app uses.
process.env.NEXA_SEED_DEMO = "false"; // never add demo data from a script

const [email, name, password, role = "admin"] = process.argv.slice(2);
const usage = 'Usage: npm run create-admin -- <email> "<name>" "<password>" [admin|manager|member]';

if (!email || !name || !password) {
  console.error(usage);
  process.exit(1);
}

const { hashPasswordSync, MIN_PASSWORD_LENGTH } = await import("../lib/password.js");
const { ROLES } = await import("../lib/permissions.js");
const { createUser } = await import("../lib/db/users.js");

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That e-mail address doesn't look valid.");
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error(`Role must be one of: ${ROLES.join(", ")}`);
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

try {
  const user = createUser({ name: name.trim(), email: email.trim().toLowerCase(), role, passwordHash: hashPasswordSync(password) });
  console.log(`Created ${user.role} account for ${user.name} <${user.email}>.`);
} catch (error) {
  console.error(error instanceof Error && error.message.includes("UNIQUE") ? "An account with that e-mail already exists." : error);
  process.exit(1);
}
