import { processThread } from "../src/lib/agents/orchestrator";
import { logger } from "../src/lib/logger";

export async function runProcessThread(payload: { threadId: string; reason?: string }) {
  logger.info({ threadId: payload.threadId, reason: payload.reason }, "ai.process_thread start");
  const result = await processThread(payload.threadId);
  logger.info(
    {
      threadId: payload.threadId,
      category: result.category?.category,
      priority: result.priority?.priority,
      isEscalation: result.legal?.isEscalation,
      hasDraft: !!result.draft?.shouldDraft,
      trace: result.trace,
    },
    "ai.process_thread done"
  );
  return { ok: true };
}
