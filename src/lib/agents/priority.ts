import { z } from "zod";
import { Priority, Sentiment } from "../enums";
import { structured } from "./llm";
import { SYSTEM_PROMPTS, renderThreadForModel } from "./prompts";
import type { PriorityResult, SentimentResult, ThreadContext } from "./types";

const Schema = z.object({
  priority: z.nativeEnum(Priority),
  score: z.number(),
  sentiment: z.nativeEnum(Sentiment),
  intensity: z.number(),
  reasons: z.array(z.string()).max(4),
});

export async function priorityAgent(
  ctx: ThreadContext
): Promise<{ priority: PriorityResult; sentiment: SentimentResult }> {
  const r = await structured<z.infer<typeof Schema>>({
    schema: Schema,
    schemaName: "priority_sentiment",
    system: SYSTEM_PROMPTS.priority,
    user: renderThreadForModel(ctx) + (ctx.isFromVip ? "\n\nNote: sender is on the VIP list." : ""),
    temperature: 0,
  });
  // VIP nudge: never silently demote a VIP below HIGH
  let priority = r.priority;
  let score = r.score;
  if (ctx.isFromVip && score < 0.7) {
    score = 0.75;
    priority = priority === Priority.LOW ? Priority.HIGH : priority;
  }
  return {
    priority: { priority, score, reasons: r.reasons },
    sentiment: { sentiment: r.sentiment, intensity: r.intensity },
  };
}
