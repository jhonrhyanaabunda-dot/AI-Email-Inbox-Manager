import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

const Query = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!can(session.role, "escalation:read")) return fail(403, "Forbidden");
    const params = Query.parse(Object.fromEntries(req.nextUrl.searchParams));
    const escalations = await prisma.escalation.findMany({
      where: { organizationId: session.organizationId, status: params.status },
      orderBy: [{ status: "asc" }, { riskScore: "desc" }, { createdAt: "desc" }],
      take: params.limit,
      include: {
        thread: { select: { id: true, subject: true, snippet: true, lastMessageAt: true } },
      },
    });
    return ok({ escalations });
  } catch (err) {
    return toErrorResponse(err);
  }
}
