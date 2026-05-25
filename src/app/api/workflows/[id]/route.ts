import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

const Patch = z.object({ isEnabled: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "workflow:write")) return fail(403, "Forbidden");

    const body = Patch.parse(await req.json());
    const wf = await prisma.workflow.findUnique({ where: { id }, select: { organizationId: true } });
    if (!wf) return fail(404, "Not found");
    assertSameOrg(wf.organizationId, session.organizationId);

    const updated = await prisma.workflow.update({
      where: { id },
      data: { isEnabled: body.isEnabled },
    });
    return ok({ workflow: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
