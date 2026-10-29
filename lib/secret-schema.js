// Validation of what may be stored as a project secret. Shared by the create and update routes.

export const SECRET_KINDS = ["env", "credential"];
const MAX_ENV = 20000;
const CREDENTIAL_FIELDS = { service: 80, url: 200, username: 200, password: 300, notes: 1000 };

export function validLabel(value) {
  const label = typeof value === "string" ? value.trim() : "";
  return label && label.length <= 80 ? label : null;
}

/** Returns { ok: true, value } with only the allowed fields, or { ok: false, error }. */
export function cleanSecretData(kind, data) {
  if (!SECRET_KINDS.includes(kind)) return { ok: false, error: "Unknown secret type." };
  if (!data || typeof data !== "object") return { ok: false, error: "Nothing to save." };

  if (kind === "env") {
    if (typeof data.text !== "string" || !data.text.trim()) return { ok: false, error: "Paste the contents of the .env file." };
    if (data.text.length > MAX_ENV) return { ok: false, error: `Keep an .env file under ${MAX_ENV} characters.` };
    return { ok: true, value: { text: data.text } };
  }

  const value = {};
  for (const [field, max] of Object.entries(CREDENTIAL_FIELDS)) {
    const raw = data[field] ?? "";
    if (typeof raw !== "string" || raw.length > max) return { ok: false, error: `"${field}" must be text up to ${max} characters.` };
    value[field] = raw;
  }
  if (!value.username.trim() && !value.password.trim()) return { ok: false, error: "Add a username or a password." };
  if (value.url.trim() && !/^https?:\/\//i.test(value.url.trim())) return { ok: false, error: "The link must start with http:// or https://." };
  return { ok: true, value };
}
