import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, assertSameOrg } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const Patch = z.object({
  status: z.enum(["INBOX", "SNOOZED", "ARCHIVED", "DONE", "SPAM", "TRASH"]).optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  snoozedUntil: z.string().datetime().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "thread:read")) return fail(403, "Forbidden");

    const thread = await prisma.emailThread.findUnique({
      where: { id },
      include: {
        emails: {
          orderBy: { receivedAt: "asc" },
          select: {
            id: true,
            direction: true,
            fromEmail: true,
            fromName: true,
            toEmails: true,
            ccEmails: true,
            subject: true,
            snippet: true,
            bodyText: true,
            bodyHtml: true,
            receivedAt: true,
            hasAttachments: true,
            attachments: { select: { id: true, filename: true, mimeType: true, sizeBytes: true } },
          },
        },
        drafts: { where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "desc" }, take: 1 },
        escalations: { orderBy: { createdAt: "desc" }, take: 5 },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        mailbox: { select: { emailAddress: true, provider: true } },
      },
    });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);
    return ok({ thread });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    if (!can(session.role, "thread:write")) return fail(403, "Forbidden");

    const body = Patch.parse(await req.json());
    const thread = await prisma.emailThread.findUnique({ where: { id }, select: { organizationId: true } });
    if (!thread) return fail(404, "Not found");
    assertSameOrg(thread.organizationId, session.organizationId);

    const updated = await prisma.emailThread.update({
      where: { id },
      data: {
        ...body,
        snoozedUntil: body.snoozedUntil === null ? null : body.snoozedUntil ? new Date(body.snoozedUntil) : undefined,
        followUpAt: body.followUpAt === null ? null : body.followUpAt ? new Date(body.followUpAt) : undefined,
      },
    });

    if (body.status) {
      await audit({
        organizationId: session.organizationId,
        userId: session.userId,
        kind: body.status === "ARCHIVED" ? "THREAD_ARCHIVE" : body.status === "SNOOZED" ? "THREAD_SNOOZE" : "THREAD_LABEL",
        targetType: "thread",
        targetId: id,
        meta: { status: body.status },
      });
    }
    return ok({ thread: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
