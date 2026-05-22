import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, toErrorResponse } from "@/lib/api";
import { redis } from "@/lib/redis";
import { microsoftAuthUrl } from "@/lib/sync/microsoft";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession();
    if (!can(session.role, "mailbox:connect")) return fail(403, "Forbidden");
    const state = randomBytes(16).toString("hex");
    await redis.set(
      `oauth:ms:${state}`,
      JSON.stringify({ userId: session.userId, organizationId: session.organizationId }),
      "EX",
      300
    );
    return NextResponse.redirect(microsoftAuthUrl(state));
  } catch (err) {
    return toErrorResponse(err);
  }
}
