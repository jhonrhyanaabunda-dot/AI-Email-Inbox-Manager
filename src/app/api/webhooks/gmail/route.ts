import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { queues } from "@/lib/queue";

export const dynamic = "force-dynamic";

/**
 * Google Pub/Sub push endpoint. Pub/Sub posts the message base64-encoded
 * under `message.data` with `{ emailAddress, historyId }`.
 *
 * Auth: we accept either an Authorization: Bearer <token> JWT (Pub/Sub
 * standard OIDC) — verified upstream by your proxy — or a shared verification
 * token configured on the Pub/Sub subscription's `pushConfig.attributes`.
 */
export async function POST(req: NextRequest) {
  // Cheap shared-secret check (defense-in-depth alongside Pub/Sub OIDC).
  const expected = env().GOOGLE_PUBSUB_VERIFICATION_TOKEN;
  if (expected) {
    const token = req.nextUrl.searchParams.get("token") ?? req.headers.get("x-goog-token");
    if (token !== expected) return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: { message?: { data?: string } };
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  const dataB64 = payload?.message?.data;
  if (!dataB64) return new NextResponse(null, { status: 204 });

  try {
    const decoded = JSON.parse(Buffer.from(dataB64, "base64").toString("utf8")) as {
      emailAddress: string;
      historyId: string;
    };
    const mailbox = await prisma.mailbox.findFirst({
      where: { emailAddress: decoded.emailAddress.toLowerCase(), provider: "GMAIL", status: "ACTIVE" },
      select: { id: true },
    });
    if (mailbox) {
      await queues.syncIncremental.add(
        "webhook",
        { mailboxId: mailbox.id, reason: "gmail.push" },
        { jobId: `inc:${mailbox.id}:${decoded.historyId}`, removeOnComplete: 100 }
      );
    }
  } catch (err) {
    logger.warn({ err }, "failed to handle gmail push");
  }
  return new NextResponse(null, { status: 204 });
}
