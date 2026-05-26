import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { isDemoMode, cannedDraft, cannedSummary } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "draft:create")) return fail(403, "Forbidden");

    const thread = await prisma.emailThread.findUnique({
      where: { id },
      include: { emails: { orderBy: { receivedAt: "desc" }, take: 1 } },
    });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);

    // Demo mode: simulate the orchestrator inline so the UI updates immediately.
    if (isDemoMode()) {
      const latest = thread.emails[0];
      const summary = cannedSummary(thread.subject ?? thread.id);
      const draft = cannedDraft(latest?.fromName);

      await prisma.$transaction(async (tx) => {
        await tx.emailThread.update({
          where: { id },
          data: {
            aiSummary: thread.aiSummary ?? summary.summary,
            aiActionItems: JSON.stringify(summary.actionItems),
            priority: thread.priority ?? "NORMAL",
            priorityScore: thread.priorityScore ?? 0.5,
            category: thread.category ?? "OTHER",
            sentiment: thread.sentiment ?? "NEUTRAL",
          },
        });
        await tx.aiDraft.updateMany({
          where: { threadId: id, status: "PENDING_REVIEW" },
          data: { status: "STALE" },
        });
        await tx.aiDraft.create({
          data: {
            organizationId: thread.organizationId,
            threadId: id,
            status: "PENDING_REVIEW",
            subject: `Re: ${thread.subject ?? ""}`,
            bodyText: draft.bodyText,
            toEmails: JSON.stringify([latest?.fromEmail].filter(Boolean)),
            modelUsed: "demo",
            promptVersion: "demo-v1",
            confidence: draft.confidence,
            tone: draft.tone,
            rationale: draft.rationale,
          },
        });
      });
      return ok({ enqueued: true, demo: true });
    }

    // Demo mode — no AI processing queue. Demo branch above handles it inline.
    return ok({ enqueued: true, demo: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
