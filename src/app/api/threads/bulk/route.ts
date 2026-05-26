import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["archive_vendor_lowpriority", "archive_ids", "done_ids", "snooze_ids"]),
  ids: z.array(z.string()).optional(),
  until: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!can(session.role, "thread:write")) return fail(403, "Forbidden");
    const { action, ids, until } = Body.parse(await req.json());

    if (action === "archive_vendor_lowpriority") {
      const r = await prisma.emailThread.updateMany({
        where: {
          organizationId: session.organizationId,
          status: "INBOX",
          isVendor: true,
          priority: { in: ["LOW", "NORMAL"] },
        },
        data: { status: "ARCHIVED" },
      });
      await audit({
        organizationId: session.organizationId,
        userId: session.userId,
        kind: "THREAD_ARCHIVE",
        meta: { action, count: r.count },
      });
      return ok({ archived: r.count });
    }

    if (action === "archive_ids" && ids?.length) {
      const r = await prisma.emailThread.updateMany({
        where: { id: { in: ids }, organizationId: session.organizationId },
        data: { status: "ARCHIVED" },
      });
      return ok({ archived: r.count });
    }
    if (action === "done_ids" && ids?.length) {
      const r = await prisma.emailThread.updateMany({
        where: { id: { in: ids }, organizationId: session.organizationId },
        data: { status: "DONE" },
      });
      return ok({ done: r.count });
    }
    if (action === "snooze_ids" && ids?.length) {
      const until_ts = until ? new Date(until) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const r = await prisma.emailThread.updateMany({
        where: { id: { in: ids }, organizationId: session.organizationId },
        data: { status: "SNOOZED", snoozedUntil: until_ts },
      });
      return ok({ snoozed: r.count });
    }
    return fail(400, "No work to do");
  } catch (err) {
    return toErrorResponse(err);
  }
}
