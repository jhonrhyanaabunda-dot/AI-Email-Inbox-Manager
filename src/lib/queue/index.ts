import { Queue, QueueEvents } from "bullmq";
import { redis } from "../redis";

// One Redis connection re-used across all queues on the producer side.
const connection = redis;

export const QueueName = {
  SYNC_INCREMENTAL: "sync.incremental",
  SYNC_HISTORICAL: "sync.historical",
  SYNC_RENEW: "sync.renew",
  AI_PROCESS_THREAD: "ai.process_thread",
  AI_DIGEST: "ai.digest",
  DRAFT_SEND: "draft.send",
} as const;

export type QueueNameType = typeof QueueName[keyof typeof QueueName];

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { count: 1000, age: 60 * 60 * 24 },
  removeOnFail: { count: 5000, age: 60 * 60 * 24 * 7 },
};

function queue<T>(name: QueueNameType) {
  return new Queue<T>(name, { connection, defaultJobOptions });
}

export const queues = {
  syncIncremental: queue<{ mailboxId: string; reason?: string }>(QueueName.SYNC_INCREMENTAL),
  syncHistorical: queue<{ mailboxId: string; maxMessages?: number }>(QueueName.SYNC_HISTORICAL),
  syncRenew: queue<{ mailboxId: string }>(QueueName.SYNC_RENEW),
  aiProcessThread: queue<{ threadId: string; reason?: string }>(QueueName.AI_PROCESS_THREAD),
  aiDigest: queue<{ userId: string; forDate?: string }>(QueueName.AI_DIGEST),
  draftSend: queue<{ draftId: string; userId: string }>(QueueName.DRAFT_SEND),
};

// Useful for tests/debugging; not used at runtime.
export function queueEvents(name: QueueNameType) {
  return new QueueEvents(name, { connection });
}
