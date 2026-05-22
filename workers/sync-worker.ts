import { MailboxProvider } from "../src/lib/enums";
import { prisma } from "../src/lib/db";
import { logger } from "../src/lib/logger";
import { historicalGmailSync, incrementalGmailSync, startGmailWatch } from "../src/lib/sync/gmail";
import { deltaMicrosoftSync, renewMicrosoftSubscription } from "../src/lib/sync/microsoft";
import { upsertEmail } from "../src/lib/sync/persist";
import { queues } from "../src/lib/queue";

export async function runHistoricalSync(payload: { mailboxId: string; maxMessages?: number }) {
  const { mailboxId } = payload;
  const job = await prisma.syncJob.create({
    data: {
      mailboxId,
      organizationId: (await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId }, select: { organizationId: true } })).organizationId,
      kind: "HISTORICAL",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });
  let processed = 0;

  try {
    if (mailbox.provider === MailboxProvider.GMAIL) {
      for await (const msg of historicalGmailSync(mailboxId, { maxMessages: payload.maxMessages ?? 500 })) {
        const { created, threadId } = await upsertEmail(mailbox.organizationId, mailboxId, msg);
        processed++;
        if (created) await queues.aiProcessThread.add("ai", { threadId, reason: "historical" }, { jobId: `ai:${threadId}` });
      }
      // Register push watch after baseline
      const watch = await startGmailWatch(mailboxId).catch((err) => {
        logger.warn({ err, mailboxId }, "gmail watch failed (continuing without push)");
        return null;
      });
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: {
          fullSyncCompletedAt: new Date(),
          lastSyncedAt: new Date(),
          historyCursor: watch?.historyId ?? undefined,
          subscriptionExpiresAt: watch?.expiration ?? undefined,
        },
      });
    } else {
      // Microsoft delta gives both initial + incremental
      const { deltaLink, processed: count } = await deltaMicrosoftSync(mailboxId, async (msg) => {
        const { created, threadId } = await upsertEmail(mailbox.organizationId, mailboxId, msg);
        if (created) await queues.aiProcessThread.add("ai", { threadId, reason: "historical" }, { jobId: `ai:${threadId}` });
      });
      processed = count;
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: { fullSyncCompletedAt: new Date(), lastSyncedAt: new Date(), historyCursor: deltaLink },
      });
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", processedCount: processed, finishedAt: new Date() },
    });
  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: err.message, finishedAt: new Date() },
    });
    throw err;
  }
}

export async function runIncrementalSync(payload: { mailboxId: string; reason?: string }) {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: payload.mailboxId } });
  const job = await prisma.syncJob.create({
    data: {
      mailboxId: mailbox.id,
      organizationId: mailbox.organizationId,
      kind: "INCREMENTAL",
      status: "RUNNING",
      startedAt: new Date(),
      payload: JSON.stringify({ reason: payload.reason ?? "scheduled" }),
    },
  });
  try {
    let processed = 0;
    if (mailbox.provider === MailboxProvider.GMAIL) {
      const { historyId, processed: count } = await incrementalGmailSync(mailbox.id, async (msg) => {
        const { created, threadId } = await upsertEmail(mailbox.organizationId, mailbox.id, msg);
        if (created) await queues.aiProcessThread.add("ai", { threadId, reason: payload.reason ?? "inc" }, { jobId: `ai:${threadId}` });
      });
      processed = count;
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { historyCursor: historyId, lastSyncedAt: new Date() },
      });
    } else {
      const { deltaLink, processed: count } = await deltaMicrosoftSync(mailbox.id, async (msg) => {
        const { created, threadId } = await upsertEmail(mailbox.organizationId, mailbox.id, msg);
        if (created) await queues.aiProcessThread.add("ai", { threadId, reason: payload.reason ?? "inc" }, { jobId: `ai:${threadId}` });
      });
      processed = count;
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { historyCursor: deltaLink, lastSyncedAt: new Date() },
      });
    }
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", processedCount: processed, finishedAt: new Date() },
    });
  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: err.message, finishedAt: new Date(), attempt: { increment: 1 } },
    });
    throw err;
  }
}

export async function renewSubscription(payload: { mailboxId: string }) {
  const mailbox = await prisma.mailbox.findUniqueOrThrow({ where: { id: payload.mailboxId } });
  if (mailbox.provider === MailboxProvider.GMAIL) {
    const watch = await startGmailWatch(mailbox.id);
    await prisma.mailbox.update({
      where: { id: mailbox.id },
      data: { historyCursor: watch.historyId, subscriptionExpiresAt: watch.expiration },
    });
  } else if (mailbox.subscriptionId) {
    const exp = await renewMicrosoftSubscription(mailbox.id, mailbox.subscriptionId);
    await prisma.mailbox.update({ where: { id: mailbox.id }, data: { subscriptionExpiresAt: exp } });
  }
}
