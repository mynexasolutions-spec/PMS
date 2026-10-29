// Encryption for project secrets (.env files, account logins): AES-256-GCM, a fresh random IV per value.
// The key comes from VAULT_KEY (any long random string). If it isn't set, a key file is created once next to the
// database and reused. Back that file up WITH the database: without the key the secrets cannot be decrypted.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const store = globalThis;

function loadKey() {
  if (store.__nexaVaultKey) return store.__nexaVaultKey;

  if (process.env.VAULT_KEY) {
    store.__nexaVaultKey = crypto.createHash("sha256").update(process.env.VAULT_KEY).digest();
    return store.__nexaVaultKey;
  }

  // Runtime-chosen path on purpose, so the bundler must not trace it.
  const file = process.env.VAULT_KEY_FILE || path.join(process.cwd(), "data", "vault.key");
  let key;
  if (fs.existsSync(/*turbopackIgnore: true*/ file)) {
    key = Buffer.from(fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8").trim(), "base64");
  } else {
    key = crypto.randomBytes(32);
    fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
    fs.writeFileSync(/*turbopackIgnore: true*/ file, key.toString("base64"), { mode: 0o600 });
    console.warn(`[nexa] Created a new vault key at ${file}. Back it up with the database, and set VAULT_KEY in production.`);
  }
  if (key.length !== 32) throw new Error("The vault key is damaged (expected 32 bytes).");
  store.__nexaVaultKey = key;
  return key;
}

/** Encrypts any JSON-serialisable value to a "v1.iv.tag.ciphertext" string. */
export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", loadKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

/** Reverses encryptSecret. Throws if the data was tampered with or the key is wrong. */
export function decryptSecret(payload) {
  const [version, iv, tag, data] = String(payload).split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", loadKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const text = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(text);
}
