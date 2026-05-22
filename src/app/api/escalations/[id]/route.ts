import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";

const Patch = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
  resolutionNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "escalation:resolve")) return fail(403, "Forbidden");
    const body = Patch.parse(await req.json());
    const esc = await prisma.escalation.findUnique({ where: { id }, select: { organizationId: true } });
    if (!esc) return fail(404, "Not found");
    assertSameOrg(esc.organizationId, session.organizationId);

    const isResolved = body.status === "RESOLVED" || body.status === "DISMISSED";
    const updated = await prisma.escalation.update({
      where: { id },
      data: {
        status: body.status,
        acknowledgedAt: body.status === "ACKNOWLEDGED" ? new Date() : undefined,
        acknowledgedBy: body.status === "ACKNOWLEDGED" ? session.userId : undefined,
        resolvedAt: isResolved ? new Date() : undefined,
        resolvedBy: isResolved ? session.userId : undefined,
        resolutionNotes: body.resolutionNotes,
      },
    });
    await audit({
      organizationId: session.organizationId,
      userId: session.userId,
      kind: body.status === "ACKNOWLEDGED" ? "ESCALATION_ACKED" : "ESCALATION_RESOLVED",
      targetType: "escalation",
      targetId: id,
      meta: { status: body.status },
    });
    return ok({ escalation: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
