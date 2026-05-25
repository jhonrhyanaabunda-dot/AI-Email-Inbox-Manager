// JSON column helpers — SQLite stores JSON as TEXT.
// `toJsonColumn` stringifies for writes; `fromJsonColumn` parses on read.

export function toJsonColumn(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function fromJsonColumn<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return fallback;
}
