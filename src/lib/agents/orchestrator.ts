import { END, START, StateGraph, Annotation } from "@langchain/langgraph";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { logger } from "../logger";
import { MODEL } from "../openai";
import { fromJsonColumn, toJsonColumn } from "../json-column";
import { categorizationAgent } from "./categorization";
import { draftingAgent } from "./drafting";
import { intakeAgent } from "./intake";
import { legalRiskAgent, quickLegalSignal } from "./legal-risk";
import { priorityAgent } from "./priority";
import { PROMPT_VERSIONS, type OrchestratorState, type ThreadContext } from "./types";

/**
 * LangGraph state graph:
 *
 *   START → intake ─┬→ legal ──┐
 *                   ├→ category┤→ draft → END
 *                   └→ priority┘
 *
 * intake / category / priority run in parallel where possible; the graph
 * fans in before drafting so the draft prompt has full context.
 */

const StateAnnotation = Annotation.Root({
  ctx: Annotation<ThreadContext>(),
  category: Annotation<OrchestratorState["category"]>(),
  priority: Annotation<OrchestratorState["priority"]>(),
  sentiment: Annotation<OrchestratorState["sentiment"]>(),
  summary: Annotation<OrchestratorState["summary"]>(),
  legal: Annotation<OrchestratorState["legal"]>(),
  draft: Annotation<OrchestratorState["draft"]>(),
  trace: Annotation<OrchestratorState["trace"]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
});

async function timed<T>(agent: string, fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const value = await fn();
    return { value, trace: [{ agent, ms: Date.now() - start, ok: true }] };
  } catch (err) {
    logger.error({ err, agent }, "agent failure");
    return {
      value: undefined as T | undefined,
      trace: [{ agent, ms: Date.now() - start, ok: false, meta: { error: (err as Error).message } }],
    };
  }
}

const graph = new StateGraph(StateAnnotation)
  .addNode("intake", async (s) => {
    const r = await timed("intake", () => intakeAgent(s.ctx));
    return { summary: r.value, trace: r.trace };
  })
  .addNode("category", async (s) => {
    const r = await timed("category", () => categorizationAgent(s.ctx));
    return { category: r.value, trace: r.trace };
  })
  .addNode("priority", async (s) => {
    const r = await timed("priority", () => priorityAgent(s.ctx));
    return { priority: r.value?.priority, sentiment: r.value?.sentiment, trace: r.trace };
  })
  .addNode("legal", async (s) => {
    const r = await timed("legal", () => legalRiskAgent(s.ctx));
    return { legal: r.value, trace: r.trace };
  })
  .addNode("draft", async (s) => {
    // Skip drafting for clear non-actionable mail.
    const skipReason =
      s.category?.category === "SPAM"
        ? "spam"
        : s.category?.category === "NEWSLETTER"
        ? "newsletter"
        : s.ctx.isFromVendor && s.priority && s.priority.score < 0.4
        ? "low-priority-vendor"
        : null;
    if (skipReason) {
      return {
        draft: {
          shouldDraft: false,
          tone: "professional" as const,
          subject: "",
          bodyText: "",
          confidence: 0,
          rationale: `Skipped: ${skipReason}`,
        },
        trace: [{ agent: "draft", ms: 0, ok: true, meta: { skipped: skipReason } }],
      };
    }
    const r = await timed("draft", () => draftingAgent(s.ctx, { legal: s.legal }));
    return { draft: r.value, trace: r.trace };
  })
  .addEdge(START, "intake")
  .addEdge(START, "category")
  .addEdge(START, "priority")
  .addEdge(START, "legal")
  .addEdge("intake", "draft")
  .addEdge("category", "draft")
  .addEdge("priority", "draft")
  .addEdge("legal", "draft")
  .addEdge("draft", END);

const compiled = graph.compile();

/**
 * Process a single thread: load context, run the LangGraph, persist all
 * artefacts atomically. Idempotent — safe to retry.
 */
export async function processThread(threadId: string): Promise<OrchestratorState> {
  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
    include: {
      mailbox: { select: { emailAddress: true } },
      emails: { orderBy: { receivedAt: "asc" } },
    },
  });
  if (!thread) throw new Error(`Thread ${threadId} not found`);
  if (thread.emails.length === 0) throw new Error(`Thread ${threadId} has no messages`);

  const latest = thread.emails[thread.emails.length - 1];
  const ctx: ThreadContext = {
    threadId: thread.id,
    organizationId: thread.organizationId,
    mailboxId: thread.mailboxId,
    mailboxEmail: thread.mailbox.emailAddress,
    subject: thread.subject ?? "(no subject)",
    latestFromName: latest.fromName ?? undefined,
    latestFromEmail: latest.fromEmail,
    latestBodyText: latest.bodyText ?? latest.snippet ?? "",
    recentTurns: thread.emails.slice(-5).map((e) => ({
      direction: (e.direction === "OUTBOUND" ? "OUTBOUND" : "INBOUND") as "INBOUND" | "OUTBOUND",
      from: e.fromEmail,
      receivedAt: e.receivedAt.toISOString(),
      bodyText: e.bodyText ?? e.snippet ?? "",
    })),
    participants: fromJsonColumn<{ email: string; name?: string; role?: string }[]>(thread.participants, []),
    isFromVip: thread.isVip,
    isFromVendor: thread.isVendor,
  };

  const result = (await compiled.invoke({ ctx })) as OrchestratorState;

  await persistResult(thread.id, thread.organizationId, result);
  return result;
}

async function persistResult(threadId: string, organizationId: string, r: OrchestratorState) {
  await prisma.$transaction(async (tx) => {
    await tx.emailThread.update({
      where: { id: threadId },
      data: {
        category: r.category?.category,
        priority: r.priority?.priority,
        priorityScore: r.priority?.score,
        sentiment: r.sentiment?.sentiment,
        aiSummary: r.summary?.summary,
        aiActionItems: toJsonColumn(r.summary?.actionItems) as Prisma.InputJsonValue | undefined,
        aiNextSteps: r.summary?.nextSteps,
        aiTopic: r.category?.topic,
      },
    });

    if (r.legal?.isEscalation && r.legal.riskScore >= 0.5) {
      await tx.escalation.create({
        data: {
          organizationId,
          threadId,
          kind: r.legal.kind ?? "ANGRY_CUSTOMER",
          riskScore: r.legal.riskScore,
          summary: r.legal.summary,
          signals: r.legal.signals as unknown as Prisma.InputJsonValue,
          recommendedActions: r.legal.recommendedActions as unknown as Prisma.InputJsonValue,
          modelUsed: MODEL.heavy(),
          promptVersion: PROMPT_VERSIONS.legal,
        },
      });
    }

    if (r.draft?.shouldDraft && r.draft.bodyText) {
      // One pending draft per thread — supersede prior pending.
      await tx.aiDraft.updateMany({
        where: { threadId, status: "PENDING_REVIEW" },
        data: { status: "STALE" },
      });
      const latestEmail = await tx.email.findFirst({
        where: { threadId },
        orderBy: { receivedAt: "desc" },
        select: { fromEmail: true, fromName: true, ccEmails: true },
      });
      await tx.aiDraft.create({
        data: {
          organizationId,
          threadId,
          status: "PENDING_REVIEW",
          subject: r.draft.subject,
          bodyText: r.draft.bodyText,
          toEmails: ([latestEmail?.fromEmail].filter(Boolean) as string[]) as Prisma.InputJsonValue,
          ccEmails: (latestEmail?.ccEmails ?? undefined) as Prisma.InputJsonValue | undefined,
          modelUsed: MODEL.fast(),
          promptVersion: PROMPT_VERSIONS.draft,
          confidence: r.draft.confidence,
          tone: r.draft.tone,
          rationale: r.draft.rationale,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        organizationId,
        kind: "WORKFLOW_TRIGGERED",
        targetType: "thread",
        targetId: threadId,
        meta: toJsonColumn({ agent: "orchestrator", trace: r.trace }) as Prisma.InputJsonValue | undefined,
      },
    });
  });
}

export const orchestratorGraph = compiled;
export { quickLegalSignal };
