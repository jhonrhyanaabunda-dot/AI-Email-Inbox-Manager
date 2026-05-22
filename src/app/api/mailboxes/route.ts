import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, ok, toErrorResponse } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession();
    if (!can(session.role, "mailbox:read")) return fail(403, "Forbidden");
    const mailboxes = await prisma.mailbox.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        provider: true,
        emailAddress: true,
        displayName: true,
        status: true,
        statusReason: true,
        lastSyncedAt: true,
        fullSyncCompletedAt: true,
        subscriptionExpiresAt: true,
        dealership: { select: { id: true, name: true, brand: true } },
      },
    });
    return ok({ mailboxes });
  } catch (err) {
    return toErrorResponse(err);
  }
}
