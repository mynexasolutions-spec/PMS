// Tiny in-memory login throttle: 5 failed attempts per key (IP + e-mail) locks that key for 10 minutes.
// It lives in the Node process, which is enough for one server; use a shared store if you ever run several.
const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60 * 1000;

const failures = globalThis.__nexaLoginFailures ?? (globalThis.__nexaLoginFailures = new Map());

/** Seconds left on the lock, or 0 if the key may try. */
export function lockedFor(key) {
  const entry = failures.get(key);
  if (!entry) return 0;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return 0;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.first + WINDOW_MS - Date.now()) / 1000) : 0;
}

export function recordFailure(key) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export const clearFailures = (key) => failures.delete(key);
