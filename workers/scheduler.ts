import { queues } from "../src/lib/queue";
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { logger } from "../src/lib/logger";

/**
 * Lightweight scheduler using BullMQ repeatable jobs.
 * - Incremental sync poll every 5 min for every ACTIVE mailbox (also primary
 *   delivery mechanism if push notifications are unavailable).
 * - Renew subscription every 12 h for mailboxes whose push expires within 24 h.
 * - Daily digest at DIGEST_CRON for every user (per-user job at fan-out).
 */
export async function startScheduler() {
  await queues.syncIncremental.add(
    "poll-all",
    { mailboxId: "__fanout__" },
    { repeat: { pattern: "*/5 * * * *" }, jobId: "scheduler:poll-all" }
  );
  await queues.syncRenew.add(
    "renew",
    { mailboxId: "__fanout__" },
    { repeat: { pattern: "0 */12 * * *" }, jobId: "scheduler:renew" }
  );
  await queues.aiDigest.add(
    "fanout",
    { userId: "__fanout__" },
    { repeat: { pattern: env().DIGEST_CRON }, jobId: "scheduler:digest" }
  );

  // Fan-out handlers: when the special __fanout__ job fires, expand to one job per target.
  queues.syncIncremental.on("waiting" as any, async (job: { id?: string; data?: any; name?: string }) => {
    if (job?.data?.mailboxId !== "__fanout__") return;
    const mailboxes = await prisma.mailbox.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    for (const m of mailboxes) {
      await queues.syncIncremental.add("poll", { mailboxId: m.id, reason: "scheduled" });
    }
  });

  queues.aiDigest.on("waiting" as any, async (job: { data?: any }) => {
    if (job?.data?.userId !== "__fanout__") return;
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      await queues.aiDigest.add("digest", { userId: u.id });
    }
  });

  logger.info("scheduler registered repeatable jobs");
}
