import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { subDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    if (!can(session.role, "analytics:read")) return fail(403, "Forbidden");
    const since = startOfDay(subDays(new Date(), 7));

    const [byPriority, byCategory, escalations, drafts, threadsLast7] = await Promise.all([
      prisma.emailThread.groupBy({
        by: ["priority"],
        where: { organizationId: session.organizationId, lastMessageAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.emailThread.groupBy({
        by: ["category"],
        where: { organizationId: session.organizationId, lastMessageAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.escalation.groupBy({
        by: ["status"],
        where: { organizationId: session.organizationId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.aiDraft.groupBy({
        by: ["status"],
        where: { organizationId: session.organizationId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.email.count({ where: { organizationId: session.organizationId, receivedAt: { gte: since } } }),
    ]);

    return ok({
      window: { sinceISO: since.toISOString(), days: 7 },
      threadsLast7,
      byPriority,
      byCategory,
      escalations,
      drafts,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
