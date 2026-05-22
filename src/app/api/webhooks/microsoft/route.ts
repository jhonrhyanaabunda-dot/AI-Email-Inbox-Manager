import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { queues } from "@/lib/queue";

/**
 * Microsoft Graph notification endpoint.
 * - GET / POST with `?validationToken=...` is the subscription handshake;
 *   we must echo it back as text/plain within 10 seconds.
 * - Otherwise, body is `{ value: [{ subscriptionId, clientState, resource, ... }] }`.
 */
export async function POST(req: NextRequest) {
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  let payload: { value?: Array<{ subscriptionId: string; clientState?: string }> };
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  for (const notif of payload?.value ?? []) {
    if (env().MICROSOFT_WEBHOOK_CLIENT_STATE && notif.clientState !== env().MICROSOFT_WEBHOOK_CLIENT_STATE) {
      logger.warn({ subId: notif.subscriptionId }, "ms webhook: bad clientState");
      continue;
    }
    const mailbox = await prisma.mailbox.findFirst({
      where: { subscriptionId: notif.subscriptionId, provider: "MICROSOFT", status: "ACTIVE" },
      select: { id: true },
    });
    if (mailbox) {
      await queues.syncIncremental.add(
        "webhook",
        { mailboxId: mailbox.id, reason: "ms.notification" },
        { jobId: `inc:${mailbox.id}:${Date.now()}`, removeOnComplete: 100 }
      );
    }
  }
  return new NextResponse(null, { status: 202 });
}

export async function GET(req: NextRequest) {
  // Microsoft sometimes uses GET for validation, depending on subscription.
  const validationToken = req.nextUrl.searchParams.get("validationToken");
  if (validationToken) return new NextResponse(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } });
  return new NextResponse(null, { status: 200 });
}
