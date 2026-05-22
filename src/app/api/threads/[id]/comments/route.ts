import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const Body = z.object({ body: z.string().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "thread:write")) return fail(403, "Forbidden");

    const body = Body.parse(await req.json());
    const thread = await prisma.emailThread.findUnique({ where: { id }, select: { organizationId: true } });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);

    const comment = await prisma.threadComment.create({
      data: { threadId: id, userId: session.userId, body: body.body },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    await audit({
      organizationId: session.organizationId,
      userId: session.userId,
      kind: "THREAD_COMMENT",
      targetType: "thread",
      targetId: id,
    });
    return ok({ comment });
  } catch (err) {
    return toErrorResponse(err);
  }
}
