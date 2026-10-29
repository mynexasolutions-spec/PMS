// Password hashing with Node's built-in scrypt (no extra dependency). Stored as
// "scrypt$N$r$p$salt$hash" so the cost can be raised later without breaking existing passwords.
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 8;

const format = (salt, hash) => `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return format(salt, await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P }));
}

/** Synchronous variant for seeding and the create-admin script. */
export function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16);
  return format(salt, crypto.scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P }));
}

// A real hash of a throw-away password, compared against when the e-mail is unknown, so a login attempt
// takes the same time whether or not the account exists.
const DECOY = hashPasswordSync(crypto.randomBytes(12).toString("hex"));

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? DECOY).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export const verifyDecoy = (password) => verifyPassword(password, DECOY);
