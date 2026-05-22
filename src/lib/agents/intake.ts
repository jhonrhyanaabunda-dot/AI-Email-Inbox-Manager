import { z } from "zod";
import { structured } from "./llm";
import { SYSTEM_PROMPTS, renderThreadForModel } from "./prompts";
import type { SummaryResult, ThreadContext } from "./types";

const Schema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()).max(5),
  nextSteps: z.string(),
});

export async function intakeAgent(ctx: ThreadContext): Promise<SummaryResult> {
  return structured<SummaryResult>({
    schema: Schema,
    schemaName: "intake_summary",
    system: SYSTEM_PROMPTS.intake,
    user: renderThreadForModel(ctx),
    temperature: 0.2,
  });
}
