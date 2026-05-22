import { z } from "zod";
import { EscalationKind } from "../enums";
import { structured } from "./llm";
import { SYSTEM_PROMPTS, renderThreadForModel } from "./prompts";
import type { LegalRiskResult, ThreadContext } from "./types";
import { MODEL } from "../openai";

const Schema = z.object({
  isEscalation: z.boolean(),
  kind: z.nativeEnum(EscalationKind).optional(),
  riskScore: z.number(),
  summary: z.string(),
  signals: z.array(z.object({ type: z.string(), evidence: z.string(), weight: z.number() })).max(8),
  recommendedActions: z.array(z.string()).max(5),
});

// Cheap lexical pre-filter — gates whether the LLM legal pass runs.
// Avoids burning tokens on obvious vendor/newsletter mail.
const KEYWORDS = [
  /\battorney\b/i,
  /\blawsuit\b/i,
  /\bsue(?:d|ing)?\b/i,
  /\blawyer\b/i,
  /\blegal action\b/i,
  /\blemon law\b/i,
  /\bbbb\b/i,
  /\bbetter business bureau\b/i,
  /\bharass(ed|ment)?\b/i,
  /\bdiscriminat(e|ed|ion|ory)\b/i,
  /\bretaliation\b/i,
  /\bcompliance\b/i,
  /\boem\b.*\b(escalat|complaint)/i,
  /\bfraud(?:ulent)?\b/i,
  /\bchargeback\b/i,
  /\brefund(?:ed)? immediately\b/i,
  /\bI (?:will|am going to) (?:report|escalate|contact)\b/i,
  /\bnever (?:do business|buying) again\b/i,
];

export function quickLegalSignal(bodyText: string): boolean {
  return KEYWORDS.some((re) => re.test(bodyText));
}

export async function legalRiskAgent(ctx: ThreadContext): Promise<LegalRiskResult> {
  // Always run, but use the heavier model when a keyword fires so we get
  // higher-precision judgement on the high-stakes path.
  const hot = quickLegalSignal(ctx.latestBodyText);
  return structured<LegalRiskResult>({
    schema: Schema,
    schemaName: "legal_risk",
    system: SYSTEM_PROMPTS.legal,
    user: renderThreadForModel(ctx),
    temperature: 0,
    model: hot ? MODEL.heavy() : MODEL.fast(),
  });
}
