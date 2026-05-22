// SQLite stores JSON as TEXT — these helpers normalize reads/writes so callers
// can keep working with native objects.

export function toJsonColumn(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function fromJsonColumn<T = unknown>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
