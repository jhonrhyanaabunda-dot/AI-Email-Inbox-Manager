import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter backed by Redis.
 * Atomic via INCR + EXPIRE (single round-trip pipeline).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  const pipeline = redis.pipeline();
  pipeline.incr(bucket);
  pipeline.expire(bucket, windowSeconds);
  const results = await pipeline.exec();
  const count = Number((results?.[0]?.[1] as number | string | undefined) ?? 0);
  const resetAt = (Math.floor(Date.now() / 1000 / windowSeconds) + 1) * windowSeconds * 1000;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
    resetAt,
  };
}
