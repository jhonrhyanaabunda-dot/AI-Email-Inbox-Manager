import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * On Vercel (serverless), the filesystem under /var/task is read-only but /tmp
 * is writable. The repo ships with a pre-seeded prisma/dev.db; on cold start
 * we copy it to /tmp so Prisma can read AND write (snooze, archive, comments).
 *
 * The fs/path imports are lazy to keep this module compatible with the Edge
 * runtime (used by middleware), which would otherwise refuse to bundle `node:fs`.
 */
function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL;

  // Not SQLite — passthrough (Postgres in prod, etc.)
  if (fromEnv && !fromEnv.startsWith("file:")) return fromEnv;

  // SQLite on Vercel: copy bundled DB to /tmp once per cold start.
  // Detect Vercel via the standard env vars they set.
  const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;
  if (isServerless) {
    const tmpPath = "/tmp/dev.db";
    try {
      // Use Function() so webpack can't statically analyze + try to bundle
      // node:fs into the Edge runtime (where middleware lives).
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const nodeRequire: (m: string) => any = new Function("m", "return require(m)") as any;
      const fs = nodeRequire("fs");
      const path = nodeRequire("path");
      if (!fs.existsSync(tmpPath)) {
        const candidates = [
          path.join(process.cwd(), "prisma/dev.db"),
          "/var/task/prisma/dev.db",
        ];
        const source = candidates.find((p: string) => fs.existsSync(p));
        if (source) {
          fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
          fs.copyFileSync(source, tmpPath);
        } else {
          console.warn("[db] no bundled dev.db found, starting empty");
        }
      }
    } catch (err) {
      console.warn("[db] SQLite copy failed (non-fatal):", err);
    }
    return `file:${tmpPath}`;
  }

  // Local dev — use what's in .env (defaults to file:./dev.db)
  return fromEnv ?? "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env().NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (env().NODE_ENV !== "production") globalForPrisma.prisma = prisma;
