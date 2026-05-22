import { z } from "zod";
import { Category } from "../enums";
import { structured } from "./llm";
import { SYSTEM_PROMPTS, renderThreadForModel } from "./prompts";
import type { CategorizationResult, ThreadContext } from "./types";

const Schema = z.object({
  category: z.nativeEnum(Category),
  topic: z.string(),
  confidence: z.number(),
  reasons: z.array(z.string()).max(4),
});

export async function categorizationAgent(ctx: ThreadContext): Promise<CategorizationResult> {
  return structured<CategorizationResult>({
    schema: Schema,
    schemaName: "categorization",
    system: SYSTEM_PROMPTS.categorize,
    user: renderThreadForModel(ctx),
    temperature: 0,
  });
}
