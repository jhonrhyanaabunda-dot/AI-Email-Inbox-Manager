import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/demo-mode";

const Patch = z.object({
  bodyText: z.string().optional(),
  subject: z.string().optional(),
  toEmails: z.array(z.string().email()).optional(),
  ccEmails: z.array(z.string().email()).optional(),
});

const Action = z.object({ action: z.enum(["approve", "reject", "send"]), notes: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "draft:create")) return fail(403, "Forbidden");

    const draft = await prisma.aiDraft.findUnique({ where: { id }, select: { organizationId: true, status: true } });
    if (!draft) return fail(404, "Not found");
    assertSameOrg(draft.organizationId, session.organizationId);
    if (draft.status === "SENT") return fail(409, "Already sent");

    const body = Patch.parse(await req.json());
    const updated = await prisma.aiDraft.update({
      where: { id },
      data: {
        bodyText: body.bodyText,
        subject: body.subject,
        toEmails: body.toEmails ? JSON.stringify(body.toEmails) : undefined,
        ccEmails: body.ccEmails ? JSON.stringify(body.ccEmails) : undefined,
        status: "EDITED",
      },
    });
    return ok({ draft: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const { action, notes } = Action.parse(await req.json());

    const draft = await prisma.aiDraft.findUnique({ where: { id }, select: { organizationId: true, status: true } });
    if (!draft) return fail(404, "Not found");
    assertSameOrg(draft.organizationId, session.organizationId);
    if (draft.status === "SENT") return fail(409, "Already sent");

    if (action === "approve") {
      if (!can(session.role, "draft:approve")) return fail(403, "Forbidden");
      await prisma.aiDraft.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: session.userId, reviewedAt: new Date(), reviewNotes: notes },
      });
      await audit({ organizationId: session.organizationId, userId: session.userId, kind: "DRAFT_APPROVED", targetType: "draft", targetId: id });
      return ok({ ok: true });
    }
    if (action === "reject") {
      if (!can(session.role, "draft:approve")) return fail(403, "Forbidden");
      await prisma.aiDraft.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: session.userId, reviewedAt: new Date(), reviewNotes: notes },
      });
      await audit({ organizationId: session.organizationId, userId: session.userId, kind: "DRAFT_REJECTED", targetType: "draft", targetId: id });
      return ok({ ok: true });
    }
    if (action === "send") {
      if (!can(session.role, "draft:send")) return fail(403, "Forbidden");

      // Demo mode: simulate the send so the demo flows end-to-end.
      if (isDemoMode()) {
        await prisma.aiDraft.update({
          where: { id },
          data: {
            status: "SENT",
            reviewedById: session.userId,
            reviewedAt: new Date(),
            reviewNotes: notes,
            sentAt: new Date(),
            sentMessageId: `demo-${id}`,
          },
        });
        await audit({
          organizationId: session.organizationId,
          userId: session.userId,
          kind: "DRAFT_SENT",
          targetType: "draft",
          targetId: id,
          meta: { demo: true },
        });
        return ok({ sent: true, demo: true });
      }

      // Production path: queue the real send.
      await prisma.aiDraft.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: session.userId, reviewedAt: new Date(), reviewNotes: notes },
      });
      const { queues } = await import("@/lib/queue");
      await queues.draftSend.add("send", { draftId: id, userId: session.userId }, { jobId: `send:${id}` });
      return ok({ enqueued: true });
    }
    return fail(400, "Unknown action");
  } catch (err) {
    return toErrorResponse(err);
  }
}
