// Fixed-window counters in memory. Each server instance keeps its own and a
// restart clears them, so these limits are best-effort: they slow down abuse
// from one place, but the sign-in's safety does not depend on them (see
// lib/auth.ts).

const windows = new Map<string, { count: number; resetAt: number }>();

/**
 * Counts one hit for `key` and returns false once it has been hit more than
 * `limit` times within `windowMs`.
 */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (windows.size > 10_000) prune(now);

  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

/** True when `key` is already over `limit` in its current window, without counting a hit. */
export function isBlocked(key: string, limit: number, now = Date.now()): boolean {
  const entry = windows.get(key);
  return entry !== undefined && entry.resetAt > now && entry.count >= limit;
}

/** Marks `key` as used up for `windowMs`, e.g. a code that has already signed someone in. */
export function block(key: string, windowMs: number, now = Date.now()): void {
  windows.set(key, { count: Number.MAX_SAFE_INTEGER, resetAt: now + windowMs });
}

function prune(now: number) {
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}
