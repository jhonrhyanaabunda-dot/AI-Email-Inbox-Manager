import { NextRequest, NextResponse } from "next/server";
import { MailboxProvider, MailboxStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { encryptSecret } from "@/lib/encryption";
import { exchangeMicrosoftCode, startMicrosoftSubscription } from "@/lib/sync/microsoft";
import { audit } from "@/lib/audit";
import { queues } from "@/lib/queue";
import { env } from "@/lib/env";
import { toErrorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    if (!code || !state) return NextResponse.redirect(new URL("/settings/mailboxes?error=missing_params", req.url));

    const raw = await redis.get(`oauth:ms:${state}`);
    if (!raw) return NextResponse.redirect(new URL("/settings/mailboxes?error=invalid_state", req.url));
    await redis.del(`oauth:ms:${state}`);
    const ctx = JSON.parse(raw) as { userId: string; organizationId: string };

    const { tokens, email, name } = await exchangeMicrosoftCode(code);

    const mailbox = await prisma.mailbox.upsert({
      where: {
        organizationId_provider_emailAddress: {
          organizationId: ctx.organizationId,
          provider: MailboxProvider.MICROSOFT,
          emailAddress: email,
        },
      },
      update: {
        accessTokenEnc: encryptSecret(tokens.access_token),
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope ?? undefined,
        status: MailboxStatus.ACTIVE,
        statusReason: null,
        displayName: name ?? undefined,
        ownerUserId: ctx.userId,
      },
      create: {
        organizationId: ctx.organizationId,
        ownerUserId: ctx.userId,
        provider: MailboxProvider.MICROSOFT,
        emailAddress: email,
        displayName: name ?? null,
        accessTokenEnc: encryptSecret(tokens.access_token),
        refreshTokenEnc: encryptSecret(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope ?? null,
        status: MailboxStatus.ACTIVE,
      },
    });

    // Register webhook subscription (best-effort)
    try {
      const sub = await startMicrosoftSubscription(mailbox.id, `${env().APP_URL}/api/webhooks/microsoft`);
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { subscriptionId: sub.subscriptionId, subscriptionExpiresAt: sub.expirationDateTime },
      });
    } catch (err) {
      // Push not available — incremental polling will still cover this mailbox.
    }

    await queues.syncHistorical.add("backfill", { mailboxId: mailbox.id, maxMessages: 500 });
    await audit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      kind: "MAILBOX_CONNECT",
      targetType: "mailbox",
      targetId: mailbox.id,
      meta: { provider: "MICROSOFT", email },
    });

    return NextResponse.redirect(new URL(`/settings/mailboxes?connected=${encodeURIComponent(email)}`, req.url));
  } catch (err) {
    return toErrorResponse(err);
  }
}
