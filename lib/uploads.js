// Note attachments are stored as plain files outside the database, under random names.
// Set UPLOAD_DIR on the VPS to a folder outside the project (like DATABASE_PATH) so deploys never touch them.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_NOTE = 5;

// The type is decided by the file extension (never by what the browser claims), and only these are accepted.
const ALLOWED = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

export const INLINE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function mimeFor(filename) {
  return ALLOWED[path.extname(filename).toLowerCase()] ?? null;
}

/** Strips folders and control characters from a client-supplied file name. */
export function cleanName(name) {
  // eslint-disable-next-line no-control-regex
  const base = path.basename(String(name)).replace(/[\u0000-\u001f\\/]/g, "").trim();
  return (base || "file").slice(0, 120);
}

// The upload folder is chosen at runtime (UPLOAD_DIR) on purpose, so the bundler must not try to trace it at build time.
// Every path goes through this helper (basename() also blocks "../" tricks).
const uploadPath = (storedName) => path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, path.basename(storedName));

export function saveFile(buffer, filename) {
  fs.mkdirSync(/*turbopackIgnore: true*/ UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}${path.extname(filename).toLowerCase()}`;
  fs.writeFileSync(uploadPath(storedName), buffer);
  return storedName;
}

export const readFile = (storedName) => fs.readFileSync(uploadPath(storedName));

export function removeFile(storedName) {
  try {
    fs.unlinkSync(uploadPath(storedName));
  } catch {
    // Already gone: nothing to clean up.
  }
}
