// JSON column helpers.
//
// We're on Postgres now — Prisma serializes native objects/arrays into Json
// columns automatically, so `toJsonColumn` is effectively the identity.
// (It used to JSON.stringify when the dev DB was SQLite; we keep the same
// surface so callers don't have to change.)
//
// `fromJsonColumn` is tolerant: returns the value as-is if Prisma gave us an
// object/array; falls back to JSON.parse only for legacy string payloads.

export function toJsonColumn<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return value;
}

export function fromJsonColumn<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return fallback;
}
