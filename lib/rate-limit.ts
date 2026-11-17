/**
 * Tiny in-process sliding-window limiter.
 *
 * This is deliberately dependency-free and good enough for a single Node
 * process (the ENVIS deployment model). If the portal is ever run as several
 * replicas, move the counters to the database or a shared store, and also
 * enforce limits at the reverse proxy.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5_000;

function prune(now: number): void {
  if (buckets.size <= MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still too large: drop the oldest entries (Map preserves insertion order).
  if (buckets.size > MAX_KEYS) {
    const excess = buckets.size - MAX_KEYS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}

/** Read the current state without consuming quota. */
export function checkLimit(key: string, limit: number): { blocked: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return { blocked: false, retryAfterMs: 0 };
  if (bucket.count >= limit) return { blocked: true, retryAfterMs: bucket.resetAt - now };
  return { blocked: false, retryAfterMs: 0 };
}

/** Record one event and return the new count inside the current window. */
export function recordHit(key: string, windowMs: number): number {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
}

/** Clear a bucket (e.g. after a successful sign-in). */
export function clearLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Caller identity for throttling. Honours the headers set by a reverse proxy.
 * If the app is exposed directly to the internet, spoofed X-Forwarded-For
 * values can bypass per-IP limits — so per-account limits are applied as well.
 */
export function clientIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerStore.get("x-real-ip")?.trim() || "unknown";
}
