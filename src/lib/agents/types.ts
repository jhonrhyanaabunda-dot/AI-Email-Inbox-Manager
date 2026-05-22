import { Category, EscalationKind, Priority, Sentiment } from "../enums";

export const PROMPT_VERSIONS = {
  intake: "intake-v1",
  categorize: "categorize-v1",
  priority: "priority-v1",
  legal: "legal-v1",
  draft: "draft-v1",
  digest: "digest-v1",
  escalation: "escalation-v1",
} as const;

export interface ThreadContext {
  threadId: string;
  organizationId: string;
  mailboxId: string;
  mailboxEmail: string;
  subject: string;
  // Most recent inbound message + last few prior turns for context
  latestFromName?: string;
  latestFromEmail: string;
  latestBodyText: string;
  recentTurns: Array<{
    direction: "INBOUND" | "OUTBOUND";
    from: string;
    receivedAt: string;
    bodyText: string;
  }>;
  participants: Array<{ email: string; name?: string; role?: string }>;
  isFromVip: boolean;
  isFromVendor: boolean;
  dealershipBrand?: string | null;
}

export interface CategorizationResult {
  category: Category;
  topic: string;
  confidence: number;
  reasons: string[];
}

export interface PriorityResult {
  priority: Priority;
  score: number; // 0-1
  reasons: string[];
}

export interface SentimentResult {
  sentiment: Sentiment;
  intensity: number; // 0-1
}

export interface SummaryResult {
  summary: string;
  actionItems: string[];
  nextSteps: string;
}

export interface LegalRiskResult {
  isEscalation: boolean;
  kind?: EscalationKind;
  riskScore: number; // 0-1
  summary: string;
  signals: Array<{ type: string; evidence: string; weight: number }>;
  recommendedActions: string[];
}

export interface DraftResult {
  shouldDraft: boolean;
  tone: "professional" | "warm" | "direct" | "apologetic" | "diplomatic";
  subject: string;
  bodyText: string;
  confidence: number;
  rationale: string;
}

export interface AgentTrace {
  agent: string;
  ms: number;
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface OrchestratorState {
  ctx: ThreadContext;
  category?: CategorizationResult;
  priority?: PriorityResult;
  sentiment?: SentimentResult;
  summary?: SummaryResult;
  legal?: LegalRiskResult;
  draft?: DraftResult;
  trace: AgentTrace[];
}
