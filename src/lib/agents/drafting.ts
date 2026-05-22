import { z } from "zod";
import { structured } from "./llm";
import { SYSTEM_PROMPTS, renderThreadForModel } from "./prompts";
import { MODEL } from "../openai";
import type { DraftResult, LegalRiskResult, ThreadContext } from "./types";

const Schema = z.object({
  shouldDraft: z.boolean(),
  tone: z.enum(["professional", "warm", "direct", "apologetic", "diplomatic"]),
  subject: z.string(),
  bodyText: z.string(),
  confidence: z.number(),
  rationale: z.string(),
});

export async function draftingAgent(
  ctx: ThreadContext,
  opts: { legal?: LegalRiskResult } = {}
): Promise<DraftResult> {
  // High-risk threads get a short, deferential acknowledgement only.
  const guard = opts.legal?.isEscalation
    ? `\n\nThis thread is flagged as an escalation (${opts.legal.kind ?? "risk"}, score ${opts.legal.riskScore.toFixed(2)}). Draft a SHORT acknowledgement only — confirm receipt, name a single accountable owner (e.g. "the dealer principal will reach out personally"), and do NOT make substantive commitments, admissions, or apologies that imply liability.`
    : "";

  return structured<DraftResult>({
    schema: Schema,
    schemaName: "draft_reply",
    system: SYSTEM_PROMPTS.draft + guard,
    user: renderThreadForModel(ctx) + (ctx.isFromVendor ? "\n\nNote: sender appears to be a vendor — only draft if a real human action is requested." : ""),
    temperature: 0.4,
    model: opts.legal?.isEscalation ? MODEL.heavy() : MODEL.fast(),
    maxTokens: 800,
  });
}
