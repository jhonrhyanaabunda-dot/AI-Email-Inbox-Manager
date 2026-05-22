import { generateDailyDigest } from "../src/lib/agents/daily-digest";
import { logger } from "../src/lib/logger";

export async function runDigest(payload: { userId: string; forDate?: string }) {
  const forDate = payload.forDate ? new Date(payload.forDate) : new Date();
  const briefing = await generateDailyDigest(payload.userId, forDate);
  logger.info({ userId: payload.userId, briefingId: briefing.id }, "ai.digest done");
}
