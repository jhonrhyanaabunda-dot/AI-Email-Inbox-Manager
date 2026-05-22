import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { ok, toErrorResponse } from "@/lib/api";
import { isDemoMode, cannedDigest } from "@/lib/demo-mode";

export async function GET() {
  try {
    const session = await requireSession();
    const briefings = await prisma.dailyBriefing.findMany({
      where: { userId: session.userId },
      orderBy: { forDate: "desc" },
      take: 14,
    });
    return ok({ briefings });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST() {
  try {
    const session = await requireSession();

    // Demo mode: synthesize a briefing immediately so the demo refreshes
    // with a fresh-looking digest.
    if (isDemoMode()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [openEsc, leads, drafts] = await Promise.all([
        prisma.escalation.count({ where: { organizationId: session.organizationId, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
        prisma.emailThread.count({ where: { organizationId: session.organizationId, category: "SALES_LEAD" } }),
        prisma.aiDraft.count({ where: { organizationId: session.organizationId, status: "PENDING_REVIEW" } }),
      ]);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { name: true, email: true } });
      const digest = cannedDigest({ name: user.name ?? user.email, openEsc, leads, drafts });

      await prisma.dailyBriefing.upsert({
        where: { userId_forDate: { userId: session.userId, forDate: today } },
        update: {
          summary: digest.summary,
          topThreads: JSON.stringify(digest.topThreads),
          openEscalations: openEsc,
          newLeads: leads,
          pendingDrafts: drafts,
          metrics: JSON.stringify({ inboxVolume: 26 }),
          modelUsed: "demo",
        },
        create: {
          organizationId: session.organizationId,
          userId: session.userId,
          forDate: today,
          summary: digest.summary,
          topThreads: JSON.stringify(digest.topThreads),
          openEscalations: openEsc,
          newLeads: leads,
          pendingDrafts: drafts,
          metrics: JSON.stringify({ inboxVolume: 26 }),
          modelUsed: "demo",
        },
      });
      return ok({ generated: true, demo: true });
    }

    const { queues } = await import("@/lib/queue");
    await queues.aiDigest.add("manual", { userId: session.userId }, { jobId: `digest:${session.userId}:${Date.now()}` });
    return ok({ enqueued: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
