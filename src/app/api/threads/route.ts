import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { ok, toErrorResponse } from "@/lib/api";

const Query = z.object({
  status: z.enum(["INBOX", "SNOOZED", "ARCHIVED", "DONE", "SPAM", "TRASH"]).default("INBOX"),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  mailboxId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!can(session.role, "thread:read")) return new Response("Forbidden", { status: 403 });

    const params = Query.parse(Object.fromEntries(req.nextUrl.searchParams));

    const threads = await prisma.emailThread.findMany({
      where: {
        organizationId: session.organizationId,
        status: params.status,
        priority: params.priority,
        category: params.category as any,
        mailboxId: params.mailboxId,
        ...(params.q
          ? {
              OR: [
                { subject: { contains: params.q } },
                { snippet: { contains: params.q } },
              ],
            }
          : {}),
      },
      orderBy: [{ priorityScore: "desc" }, { lastMessageAt: "desc" }],
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        subject: true,
        snippet: true,
        priority: true,
        priorityScore: true,
        category: true,
        sentiment: true,
        isVip: true,
        isRead: true,
        lastMessageAt: true,
        messageCount: true,
        participants: true,
        aiSummary: true,
      },
    });

    const nextCursor = threads.length > params.limit ? threads.pop()!.id : null;
    return ok({ threads, nextCursor });
  } catch (err) {
    return toErrorResponse(err);
  }
}
