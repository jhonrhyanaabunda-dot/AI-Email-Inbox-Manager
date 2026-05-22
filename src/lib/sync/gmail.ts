import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { decryptSecret, encryptSecret } from "../encryption";
import { env } from "../env";
import { prisma } from "../db";
import { logger } from "../logger";
import {
  inferDirection,
  parseAddress,
  parseAddressList,
  type NormalizedAttachment,
  type NormalizedEmail,
} from "./normalizer";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

function oauthClient(): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = env();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth env vars not configured");
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export function gmailAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeGmailCode(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const profile = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
  return {
    tokens,
    email: profile.data.email!,
    name: profile.data.name ?? null,
  };
}

/** Build an authenticated client for a given mailbox row; refreshes if needed. */
async function gmailFor(mailboxId: string): Promise<{ gmail: gmail_v1.Gmail; mailbox: Awaited<ReturnType<typeof prisma.mailbox.findUnique>> & {} }> {
  const mailbox = await prisma.mailbox.findUnique({ where: { id: mailboxId } });
  if (!mailbox) throw new Error(`Mailbox ${mailboxId} not found`);
  if (!mailbox.accessTokenEnc) throw new Error(`Mailbox ${mailboxId} missing access token`);

  const client = oauthClient();
  client.setCredentials({
    access_token: decryptSecret(mailbox.accessTokenEnc),
    refresh_token: mailbox.refreshTokenEnc ? decryptSecret(mailbox.refreshTokenEnc) : undefined,
    expiry_date: mailbox.tokenExpiresAt?.getTime(),
  });

  client.on("tokens", async (tokens) => {
    try {
      const update: { accessTokenEnc?: string; refreshTokenEnc?: string; tokenExpiresAt?: Date } = {};
      if (tokens.access_token) update.accessTokenEnc = encryptSecret(tokens.access_token);
      if (tokens.refresh_token) update.refreshTokenEnc = encryptSecret(tokens.refresh_token);
      if (tokens.expiry_date) update.tokenExpiresAt = new Date(tokens.expiry_date);
      if (Object.keys(update).length) await prisma.mailbox.update({ where: { id: mailboxId }, data: update });
    } catch (err) {
      logger.error({ err, mailboxId }, "failed to persist refreshed gmail tokens");
    }
  });

  return { gmail: google.gmail({ version: "v1", auth: client }), mailbox };
}

/** Register Gmail watch (push notifications via Pub/Sub). */
export async function startGmailWatch(mailboxId: string): Promise<{ historyId: string; expiration: Date }> {
  const { gmail } = await gmailFor(mailboxId);
  const topic = env().GOOGLE_PUBSUB_TOPIC;
  if (!topic) throw new Error("GOOGLE_PUBSUB_TOPIC not configured");
  const { data } = await gmail.users.watch({
    userId: "me",
    requestBody: { topicName: topic, labelIds: ["INBOX"], labelFilterAction: "include" },
  });
  return {
    historyId: String(data.historyId),
    expiration: new Date(Number(data.expiration)),
  };
}

export async function stopGmailWatch(mailboxId: string): Promise<void> {
  const { gmail } = await gmailFor(mailboxId);
  await gmail.users.stop({ userId: "me" }).catch(() => null);
}

/**
 * Historical sync: list message ids (paginated) and yield normalized emails.
 * For initial backfill of a connected mailbox.
 */
export async function* historicalGmailSync(
  mailboxId: string,
  opts: { maxMessages?: number } = {}
): AsyncGenerator<NormalizedEmail> {
  const { gmail, mailbox } = await gmailFor(mailboxId);
  const max = opts.maxMessages ?? 500;
  let pageToken: string | undefined;
  let count = 0;

  while (count < max) {
    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: Math.min(100, max - count),
      pageToken,
      q: "in:inbox newer_than:90d",
    });
    const ids = data.messages?.map((m) => m.id!) ?? [];
    for (const id of ids) {
      const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      const normalized = normalizeGmailMessage(msg.data, mailbox!.emailAddress);
      if (normalized) yield normalized;
      count++;
      if (count >= max) break;
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
}

/** Incremental: pull all changes since the stored historyId. Returns new historyId. */
export async function incrementalGmailSync(
  mailboxId: string,
  onMessage: (msg: NormalizedEmail) => Promise<void>
): Promise<{ historyId: string; processed: number }> {
  const { gmail, mailbox } = await gmailFor(mailboxId);
  if (!mailbox!.historyCursor) {
    // No cursor yet — establish baseline.
    const profile = await gmail.users.getProfile({ userId: "me" });
    return { historyId: String(profile.data.historyId), processed: 0 };
  }
  let pageToken: string | undefined;
  let processed = 0;
  let latestHistoryId = mailbox!.historyCursor;

  do {
    const { data } = await gmail.users.history.list({
      userId: "me",
      startHistoryId: mailbox!.historyCursor!,
      historyTypes: ["messageAdded"],
      pageToken,
    });
    if (data.historyId) latestHistoryId = String(data.historyId);
    for (const h of data.history ?? []) {
      for (const added of h.messagesAdded ?? []) {
        const id = added.message?.id;
        if (!id) continue;
        try {
          const full = await gmail.users.messages.get({ userId: "me", id, format: "full" });
          const normalized = normalizeGmailMessage(full.data, mailbox!.emailAddress);
          if (normalized) {
            await onMessage(normalized);
            processed++;
          }
        } catch (err) {
          logger.warn({ err, id, mailboxId }, "skip gmail message");
        }
      }
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return { historyId: latestHistoryId, processed };
}

/** Convert a raw Gmail message into our normalized shape. */
export function normalizeGmailMessage(
  msg: gmail_v1.Schema$Message,
  mailboxEmail: string
): NormalizedEmail | null {
  if (!msg.id || !msg.threadId) return null;
  const headers = Object.fromEntries(
    (msg.payload?.headers ?? []).map((h) => [h.name?.toLowerCase() ?? "", h.value ?? ""])
  );

  const from = parseAddress(headers["from"] ?? "");
  const to = parseAddressList(headers["to"]);
  const cc = parseAddressList(headers["cc"]);
  const bcc = parseAddressList(headers["bcc"]);
  const replyTo = parseAddressList(headers["reply-to"]);
  const subject = headers["subject"] || undefined;
  const internetMessageId = headers["message-id"] || undefined;

  const { text, html, attachments } = extractGmailBody(msg.payload ?? {});

  return {
    providerMessageId: msg.id,
    providerThreadId: msg.threadId,
    internetMessageId,
    direction: inferDirection(from, mailboxEmail),
    from,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    snippet: msg.snippet ?? undefined,
    bodyText: text,
    bodyHtml: html,
    receivedAt: new Date(Number(msg.internalDate ?? Date.now())),
    hasAttachments: attachments.length > 0,
    attachments,
    headers,
  };
}

function extractGmailBody(
  payload: gmail_v1.Schema$MessagePart
): { text?: string; html?: string; attachments: NormalizedAttachment[] } {
  const attachments: NormalizedAttachment[] = [];
  let text: string | undefined;
  let html: string | undefined;

  function walk(part: gmail_v1.Schema$MessagePart) {
    const mime = part.mimeType ?? "";
    const filename = part.filename ?? "";
    const attachmentId = part.body?.attachmentId;

    if (attachmentId && filename) {
      attachments.push({
        providerAttachmentId: attachmentId,
        filename,
        mimeType: mime,
        sizeBytes: part.body?.size ?? 0,
        inline: (part.headers ?? []).some((h) => h.name?.toLowerCase() === "content-disposition" && h.value?.includes("inline")),
        contentId: (part.headers ?? []).find((h) => h.name?.toLowerCase() === "content-id")?.value ?? undefined,
      });
    } else if (mime === "text/plain" && part.body?.data) {
      text = (text ?? "") + decodeBase64Url(part.body.data);
    } else if (mime === "text/html" && part.body?.data) {
      html = (html ?? "") + decodeBase64Url(part.body.data);
    }

    for (const child of part.parts ?? []) walk(child);
  }

  walk(payload);
  return { text, html, attachments };
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

/** Send an email reply on a thread via Gmail. Returns provider message id. */
export async function sendGmailReply(
  mailboxId: string,
  opts: {
    to: string[];
    cc?: string[];
    subject: string;
    bodyText: string;
    inReplyTo?: string;
    references?: string[];
    threadId?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const { gmail, mailbox } = await gmailFor(mailboxId);
  const mime = buildMime({
    from: mailbox!.emailAddress,
    to: opts.to,
    cc: opts.cc,
    subject: opts.subject,
    bodyText: opts.bodyText,
    inReplyTo: opts.inReplyTo,
    references: opts.references,
  });
  const raw = Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: opts.threadId },
  });
  return { id: res.data.id!, threadId: res.data.threadId! };
}

function buildMime(o: {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  inReplyTo?: string;
  references?: string[];
}): string {
  const lines = [
    `From: ${o.from}`,
    `To: ${o.to.join(", ")}`,
    ...(o.cc?.length ? [`Cc: ${o.cc.join(", ")}`] : []),
    `Subject: ${o.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ...(o.inReplyTo ? [`In-Reply-To: ${o.inReplyTo}`] : []),
    ...(o.references?.length ? [`References: ${o.references.join(" ")}`] : []),
    ``,
    o.bodyText,
  ];
  return lines.join("\r\n");
}
