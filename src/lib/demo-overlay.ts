/**
 * Per-session demo state overlay.
 *
 * The in-memory store in db.ts resets on every Vercel cold start, which makes
 * mid-demo state (snoozed thread, archived row, etc.) disappear after ~5 min
 * of idle. This module persists a tiny set of mutations to a cookie so they
 * survive cold starts for the lifetime of the user's browser session.
 *
 * Only thread-level state changes are persisted — the things a viewer would
 * notice "resetting":
 *   - status (INBOX / SNOOZED / DONE / ARCHIVED)
 *   - isRead
 *   - snoozedUntil
 *
 * Cookie format: JSON `{ [threadId]: { status?, isRead?, snoozedUntil? } }`.
 * Stays well under the 4KB cookie ceiling — 15 threads × ~40 bytes = ~600 B.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "a3-demo-overlay";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type ThreadOverlay = Partial<{
  status: string;
  isRead: boolean;
  snoozedUntil: string | null;
  archivedAt: string | null;
  completedAt: string | null;
}>;

type OverlayMap = Record<string, ThreadOverlay>;

/**
 * Read the overlay from the request cookie. Returns {} in any non-request
 * context (cookies() throws there). Safe to call anywhere.
 */
export async function readOverlay(): Promise<OverlayMap> {
  try {
    const c = await cookies();
    const raw = c.get(COOKIE_NAME)?.value;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as OverlayMap) : {};
  } catch {
    return {};
  }
}

/**
 * Merge a per-thread mutation into the cookie. Idempotent. Must be called
 * from a Server Action or Route Handler (cookies().set() is read-only in
 * a plain Server Component).
 */
export async function writeThreadOverlay(threadId: string, patch: ThreadOverlay): Promise<void> {
  try {
    const c = await cookies();
    const current = await readOverlay();
    const next = { ...current, [threadId]: { ...current[threadId], ...patch } };
    // Convert Date objects to ISO strings (cookie storage is text only).
    for (const k of Object.keys(next[threadId]) as (keyof ThreadOverlay)[]) {
      const v = next[threadId][k];
      if (v instanceof Date) (next[threadId] as any)[k] = (v as Date).toISOString();
    }
    c.set(COOKIE_NAME, JSON.stringify(next), {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  } catch {
    // Outside a request context (e.g. during initial build prerender) —
    // mutations there don't need to persist anyway.
  }
}

/**
 * Apply overlay to a thread row. Returns a new object with overlaid fields,
 * leaving the base untouched. Status changes also adjust the matching
 * archivedAt/completedAt/snoozedUntil timestamps for visual consistency.
 */
export function applyOverlayToThread<T extends { id: string }>(row: T, overlay: OverlayMap): T {
  const o = overlay[row.id];
  if (!o) return row;
  const out: any = { ...row, ...o };
  if (o.snoozedUntil && typeof o.snoozedUntil === "string") {
    out.snoozedUntil = new Date(o.snoozedUntil);
  }
  if (o.archivedAt && typeof o.archivedAt === "string") {
    out.archivedAt = new Date(o.archivedAt);
  }
  if (o.completedAt && typeof o.completedAt === "string") {
    out.completedAt = new Date(o.completedAt);
  }
  return out;
}
