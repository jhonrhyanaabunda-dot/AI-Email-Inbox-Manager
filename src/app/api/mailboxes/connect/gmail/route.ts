import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireSession } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { fail, toErrorResponse } from "@/lib/api";
import { redis } from "@/lib/redis";
import { gmailAuthUrl } from "@/lib/sync/gmail";

export const dynamic = "force-dynamic";

// Begin OAuth: persist a short-lived state token (5 min) in Redis keyed to the user.
export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession();
    if (!can(session.role, "mailbox:connect")) return fail(403, "Forbidden");
    const state = randomBytes(16).toString("hex");
    await redis.set(
      `oauth:gmail:${state}`,
      JSON.stringify({ userId: session.userId, organizationId: session.organizationId }),
      "EX",
      300
    );
    return NextResponse.redirect(gmailAuthUrl(state));
  } catch (err) {
    return toErrorResponse(err);
  }
}
