import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const Body = z.object({ userId: z.string() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "thread:assign")) return fail(403, "Forbidden");

    const { userId } = Body.parse(await req.json());
    const thread = await prisma.emailThread.findUnique({ where: { id }, select: { organizationId: true } });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
    if (!user || user.organizationId !== session.organizationId) return fail(403, "Cross-tenant assignment denied");

    const assignment = await prisma.threadAssignment.upsert({
      where: { threadId_userId: { threadId: id, userId } },
      update: {},
      create: { threadId: id, userId, assignedBy: session.userId },
    });

    await audit({
      organizationId: session.organizationId,
      userId: session.userId,
      kind: "THREAD_ASSIGN",
      targetType: "thread",
      targetId: id,
      meta: { assignedUserId: userId },
    });

    return ok({ assignment });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "thread:assign")) return fail(403, "Forbidden");

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return fail(400, "Missing userId");

    const thread = await prisma.emailThread.findUnique({ where: { id }, select: { organizationId: true } });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);

    await prisma.threadAssignment.delete({
      where: { threadId_userId: { threadId: id, userId } },
    });

    return ok({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
