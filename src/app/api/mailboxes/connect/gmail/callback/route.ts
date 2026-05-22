import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/encryption";
import { exchangeGmailCode } from "@/lib/sync/gmail";
import { audit } from "@/lib/audit";
import { queues } from "@/lib/queue";
import { MailboxProvider, MailboxStatus } from "@/lib/enums";
import { toErrorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    if (!code || !state) return NextResponse.redirect(new URL("/settings/mailboxes?error=missing_params", req.url));

    const raw = await redis.get(`oauth:gmail:${state}`);
    if (!raw) return NextResponse.redirect(new URL("/settings/mailboxes?error=invalid_state", req.url));
    await redis.del(`oauth:gmail:${state}`);
    const ctx = JSON.parse(raw) as { userId: string; organizationId: string };

    const { tokens, email, name } = await exchangeGmailCode(code);

    const mailbox = await prisma.mailbox.upsert({
      where: {
        organizationId_provider_emailAddress: {
          organizationId: ctx.organizationId,
          provider: MailboxProvider.GMAIL,
          emailAddress: email,
        },
      },
      update: {
        accessTokenEnc: tokens.access_token ? encryptSecret(tokens.access_token) : undefined,
        refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scope: tokens.scope ?? undefined,
        status: MailboxStatus.ACTIVE,
        statusReason: null,
        displayName: name ?? undefined,
        ownerUserId: ctx.userId,
      },
      create: {
        organizationId: ctx.organizationId,
        ownerUserId: ctx.userId,
        provider: MailboxProvider.GMAIL,
        emailAddress: email,
        displayName: name ?? null,
        accessTokenEnc: tokens.access_token ? encryptSecret(tokens.access_token) : null,
        refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : null,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? null,
        status: MailboxStatus.ACTIVE,
      },
    });

    await queues.syncHistorical.add("backfill", { mailboxId: mailbox.id, maxMessages: 500 });
    await audit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      kind: "MAILBOX_CONNECT",
      targetType: "mailbox",
      targetId: mailbox.id,
      meta: { provider: "GMAIL", email },
    });

    return NextResponse.redirect(new URL(`/settings/mailboxes?connected=${encodeURIComponent(email)}`, req.url));
  } catch (err) {
    return toErrorResponse(err);
  }
}
