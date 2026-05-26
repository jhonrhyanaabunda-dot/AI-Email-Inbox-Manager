/**
 * Cold-start DB bootstrap for the Vercel demo.
 *
 * Why this exists: the demo ships a bundled `prisma/dev.db` and tries to copy
 * it to `/tmp` at cold start (see db.ts). On Vercel that copy is fragile —
 * `outputFileTracingIncludes` doesn't always pick up the SQLite file, and
 * silently fails. When that happens, the dashboard breaks because no users
 * exist in the DB.
 *
 * This module guarantees the DB is usable by:
 *   1. Running the Prisma init migration SQL if the `User` table is missing
 *   2. Running the demo seed if the `User` table is empty
 *
 * End-to-end takes ~130ms locally, well under Vercel's function timeout.
 * Checks are cheap on warm starts (one COUNT query) and only do work on the
 * first cold start. Subsequent invocations on the same Lambda are no-ops.
 *
 * Node-only — never imported by Edge runtime code (middleware uses authConfig
 * not this).
 */
import type { PrismaClient } from "@prisma/client";

let bootstrapPromise: Promise<void> | null = null;

/**
 * Idempotent. Returns a singleton promise so concurrent callers all wait on
 * the same bootstrap, never running it twice.
 */
export function ensureDbReady(prisma: PrismaClient): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = bootstrap(prisma).catch((err) => {
    // Reset so a transient failure doesn't poison the cache forever.
    bootstrapPromise = null;
    throw err;
  });
  return bootstrapPromise;
}

async function bootstrap(prisma: PrismaClient): Promise<void> {
  await ensureSchema(prisma);
  await ensureSeed(prisma);
}

async function ensureSeed(prisma: PrismaClient): Promise<void> {
  const userCount = await prisma.user.count().catch(() => -1);
  if (userCount > 0) return;
  console.log("[db-bootstrap] DB empty, running demo seed");
  // Lazy import so the heavy seed module doesn't load on warm starts.
  const { seedDemoDatabase } = await import("../../prisma/seed");
  await seedDemoDatabase(prisma);
  console.log("[db-bootstrap] seed complete");
}

async function ensureSchema(prisma: PrismaClient): Promise<void> {
  // If the User table exists, schema is in place. Cheap check.
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "User" LIMIT 1`);
    return;
  } catch {
    // Table missing — run migration.
  }

  console.log("[db-bootstrap] schema missing, running init migration");
  const sql = readMigrationSql();
  // SQLite doesn't support multi-statement exec via $executeRawUnsafe in one
  // call; split on `;` at statement boundaries, strip leading `-- ...` comment
  // lines that Prisma prepends to each statement, and run what's left.
  const statements = sql
    .split(/;\s*[\r\n]/)
    .map((s) =>
      s
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
}

function readMigrationSql(): string {
  // Lazy require so webpack can't statically bundle node:fs into the Edge
  // runtime where this module might (defensively) be evaluated.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const nodeRequire: (m: string) => any = new Function("m", "return require(m)") as any;
  const fs = nodeRequire("fs");
  const path = nodeRequire("path");

  const candidates = [
    path.join(process.cwd(), "prisma/migrations/20260525071650_init/migration.sql"),
    "/var/task/prisma/migrations/20260525071650_init/migration.sql",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(
    `[db-bootstrap] migration.sql not found in: ${candidates.join(", ")}`,
  );
}
