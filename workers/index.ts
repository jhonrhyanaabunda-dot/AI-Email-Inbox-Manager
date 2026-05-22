/* eslint-disable no-console */
import { Worker, type Processor } from "bullmq";
import { makeRedisConnection } from "../src/lib/redis";
import { env } from "../src/lib/env";
import { logger } from "../src/lib/logger";
import { QueueName } from "../src/lib/queue";
import { runHistoricalSync, runIncrementalSync, renewSubscription } from "./sync-worker";
import { runProcessThread } from "./ai-worker";
import { runDigest } from "./digest-worker";
import { runSendDraft } from "./send-worker";
import { startScheduler } from "./scheduler";

interface WorkerSpec<T = any> {
  name: string;
  processor: Processor<T>;
  concurrency?: number;
}

const specs: WorkerSpec[] = [
  { name: QueueName.SYNC_INCREMENTAL, processor: (job) => runIncrementalSync(job.data) },
  { name: QueueName.SYNC_HISTORICAL, processor: (job) => runHistoricalSync(job.data), concurrency: 2 },
  { name: QueueName.SYNC_RENEW, processor: (job) => renewSubscription(job.data) },
  { name: QueueName.AI_PROCESS_THREAD, processor: (job) => runProcessThread(job.data) },
  { name: QueueName.AI_DIGEST, processor: (job) => runDigest(job.data), concurrency: 2 },
  { name: QueueName.DRAFT_SEND, processor: (job) => runSendDraft(job.data) },
];

const workers: Worker[] = [];

for (const spec of specs) {
  const w = new Worker(spec.name, spec.processor, {
    connection: makeRedisConnection(),
    concurrency: spec.concurrency ?? env().WORKER_CONCURRENCY,
  });
  w.on("failed", (job, err) => logger.error({ queue: spec.name, jobId: job?.id, err }, "job failed"));
  w.on("completed", (job) => logger.debug({ queue: spec.name, jobId: job.id }, "job ok"));
  workers.push(w);
}

startScheduler().catch((err) => logger.error({ err }, "scheduler failed to start"));

logger.info({ workers: specs.map((s) => s.name) }, "workers started");

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down workers");
  await Promise.allSettled(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
