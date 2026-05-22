import { Client } from "@microsoft/microsoft-graph-client";
import { decryptSecret, encryptSecret } from "../encryption";
import { env } from "../env";
import { prisma } from "../db";
import { logger } from "../logger";
import {
  inferDirection,
  parseAddress,
  type NormalizedAttachment,
  type NormalizedEmail,
} from "./normalizer";

const SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "User.Read",
  "Mail.ReadWrite",
  "Mail.Send",
];

function authUrlBase(): string {
  const tenant = env().MICROSOFT_TENANT_ID || "common";
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
}

export function microsoftAuthUrl(state: string): string {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_REDIRECT_URI } = env();
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_REDIRECT_URI) throw new Error("Microsoft OAuth env not configured");
  const url = new URL(`${authUrlBase()}/authorize`);
  url.searchParams.set("client_id", MICROSOFT_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", MICROSOFT_REDIRECT_URI);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeMicrosoftCode(code: string) {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI } = env();
  const res = await fetch(`${authUrlBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID!,
      client_secret: MICROSOFT_CLIENT_SECRET!,
      redirect_uri: MICROSOFT_REDIRECT_URI!,
      grant_type: "authorization_code",
      code,
      scope: SCOPES.join(" "),
    }),
  });
  if (!res.ok) throw new Error(`Microsoft token exchange failed: ${res.status} ${await res.text()}`);
  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = (await profileRes.json()) as { mail?: string; userPrincipalName?: string; displayName?: string };
  return {
    tokens,
    email: (profile.mail ?? profile.userPrincipalName ?? "").toLowerCase(),
    name: profile.displayName ?? null,
  };
}

async function refreshMicrosoftToken(refreshToken: string) {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET } = env();
  const res = await fetch(`${authUrlBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID!,
      client_secret: MICROSOFT_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES.join(" "),
    }),
  });
  if (!res.ok) throw new Error(`Microsoft token refresh failed: ${res.status}`);
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
}

async function graphFor(mailboxId: string): Promise<{ client: Client; mailbox: Awaited<ReturnType<typeof prisma.mailbox.findUnique>> & {} }> {
  const mailbox = await prisma.mailbox.findUnique({ where: { id: mailboxId } });
  if (!mailbox?.accessTokenEnc || !mailbox.refreshTokenEnc) throw new Error(`Mailbox ${mailboxId} not connected`);

  let accessToken = decryptSecret(mailbox.accessTokenEnc);
  const refreshToken = decryptSecret(mailbox.refreshTokenEnc);

  if (!mailbox.tokenExpiresAt || mailbox.tokenExpiresAt.getTime() - Date.now() < 60_000) {
    const refreshed = await refreshMicrosoftToken(refreshToken);
    accessToken = refreshed.access_token;
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        accessTokenEnc: encryptSecret(refreshed.access_token),
        refreshTokenEnc: refreshed.refresh_token ? encryptSecret(refreshed.refresh_token) : mailbox.refreshTokenEnc,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
  }

  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });
  return { client, mailbox };
}

/** Microsoft Graph subscription for push notifications on /me/mailFolders('inbox')/messages. */
export async function startMicrosoftSubscription(
  mailboxId: string,
  notificationUrl: string
): Promise<{ subscriptionId: string; expirationDateTime: Date }> {
  const { client } = await graphFor(mailboxId);
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days (Graph max for mail)
  const subscription = await client.api("/subscriptions").post({
    changeType: "created,updated",
    notificationUrl,
    resource: "/me/mailFolders('inbox')/messages",
    expirationDateTime: expirationDateTime.toISOString(),
    clientState: env().MICROSOFT_WEBHOOK_CLIENT_STATE,
  });
  return {
    subscriptionId: subscription.id as string,
    expirationDateTime: new Date(subscription.expirationDateTime as string),
  };
}

export async function renewMicrosoftSubscription(mailboxId: string, subscriptionId: string) {
  const { client } = await graphFor(mailboxId);
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await client.api(`/subscriptions/${subscriptionId}`).patch({ expirationDateTime: expirationDateTime.toISOString() });
  return expirationDateTime;
}

export async function deleteMicrosoftSubscription(mailboxId: string, subscriptionId: string) {
  const { client } = await graphFor(mailboxId);
  await client.api(`/subscriptions/${subscriptionId}`).delete().catch(() => null);
}

/** Delta sync — incremental + initial bootstrap. */
export async function deltaMicrosoftSync(
  mailboxId: string,
  onMessage: (msg: NormalizedEmail) => Promise<void>
): Promise<{ deltaLink: string; processed: number }> {
  const { client, mailbox } = await graphFor(mailboxId);
  let url = mailbox!.historyCursor || "/me/mailFolders('inbox')/messages/delta";
  let processed = 0;
  let nextDeltaLink = url;

  while (url) {
    const res: { value: any[]; "@odata.nextLink"?: string; "@odata.deltaLink"?: string } = url.startsWith("http")
      ? await client.api(url).get()
      : await client.api(url).top(50).get();

    for (const item of res.value ?? []) {
      try {
        const normalized = normalizeGraphMessage(item, mailbox!.emailAddress);
        if (normalized) {
          await onMessage(normalized);
          processed++;
        }
      } catch (err) {
        logger.warn({ err, id: item.id }, "skip graph message");
      }
    }

    if (res["@odata.nextLink"]) url = res["@odata.nextLink"];
    else {
      if (res["@odata.deltaLink"]) nextDeltaLink = res["@odata.deltaLink"];
      break;
    }
  }
  return { deltaLink: nextDeltaLink, processed };
}

export function normalizeGraphMessage(item: any, mailboxEmail: string): NormalizedEmail | null {
  if (!item.id || !item.conversationId) return null;
  const fromAddr = item.from?.emailAddress;
  const from = fromAddr ? parseAddress(`${fromAddr.name ?? ""} <${fromAddr.address ?? ""}>`) : { email: "unknown" };

  const map = (arr: any[] | undefined) =>
    (arr ?? []).map((r) => parseAddress(`${r.emailAddress?.name ?? ""} <${r.emailAddress?.address ?? ""}>`));

  const attachments: NormalizedAttachment[] = (item.attachments ?? []).map((a: any) => ({
    providerAttachmentId: a.id,
    filename: a.name,
    mimeType: a.contentType,
    sizeBytes: a.size ?? 0,
    inline: a.isInline ?? false,
    contentId: a.contentId,
  }));

  return {
    providerMessageId: item.id,
    providerThreadId: item.conversationId,
    internetMessageId: item.internetMessageId,
    direction: inferDirection(from, mailboxEmail),
    from,
    to: map(item.toRecipients),
    cc: map(item.ccRecipients),
    bcc: map(item.bccRecipients),
    replyTo: map(item.replyTo),
    subject: item.subject ?? undefined,
    snippet: item.bodyPreview ?? undefined,
    bodyText: item.body?.contentType === "text" ? item.body.content : undefined,
    bodyHtml: item.body?.contentType === "html" ? item.body.content : undefined,
    receivedAt: new Date(item.receivedDateTime ?? Date.now()),
    hasAttachments: item.hasAttachments ?? attachments.length > 0,
    attachments,
  };
}

export async function sendMicrosoftReply(
  mailboxId: string,
  opts: { to: string[]; cc?: string[]; subject: string; bodyText: string; conversationId?: string }
): Promise<{ id: string }> {
  const { client } = await graphFor(mailboxId);
  const message = {
    subject: opts.subject,
    body: { contentType: "Text", content: opts.bodyText },
    toRecipients: opts.to.map((address) => ({ emailAddress: { address } })),
    ccRecipients: (opts.cc ?? []).map((address) => ({ emailAddress: { address } })),
  };
  const sent = await client.api("/me/sendMail").post({ message, saveToSentItems: true });
  return { id: sent?.id ?? "" };
}
