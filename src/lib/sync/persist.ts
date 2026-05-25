import type { Prisma } from "@prisma/client";
import { EmailDirection } from "../enums";
import { prisma } from "../db";
import { logger } from "../logger";
import type { NormalizedEmail } from "./normalizer";

const J = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;
const Jopt = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === undefined || v === null ? undefined : (v as Prisma.InputJsonValue);

/**
 * Idempotently persist a normalized email + ensure its thread exists.
 * Returns { emailId, threadId, created } so the caller can enqueue AI work
 * only on truly new messages.
 *
 * Note: SQLite dev schema stores JSON-shaped fields as TEXT — every object/array
 * is stringified via toJsonColumn. On Postgres we'd swap back to native Json columns.
 */
export async function upsertEmail(
  organizationId: string,
  mailboxId: string,
  msg: NormalizedEmail
): Promise<{ emailId: string; threadId: string; created: boolean }> {
  const existing = await prisma.email.findUnique({
    where: { mailboxId_providerMessageId: { mailboxId, providerMessageId: msg.providerMessageId } },
    select: { id: true, threadId: true },
  });
  if (existing) return { emailId: existing.id, threadId: existing.threadId, created: false };

  const participants = J(uniqueParticipants(msg));
  const thread = await prisma.emailThread.upsert({
    where: { mailboxId_providerThreadId: { mailboxId, providerThreadId: msg.providerThreadId } },
    update: {
      lastMessageAt: msg.receivedAt,
      messageCount: { increment: 1 },
      participants,
      snippet: msg.snippet ?? undefined,
      subject: msg.subject ?? undefined,
    },
    create: {
      organizationId,
      mailboxId,
      providerThreadId: msg.providerThreadId,
      subject: msg.subject,
      snippet: msg.snippet,
      participants,
      firstMessageAt: msg.receivedAt,
      lastMessageAt: msg.receivedAt,
      messageCount: 1,
    },
  });

  const email = await prisma.email.create({
    data: {
      organizationId,
      mailboxId,
      threadId: thread.id,
      providerMessageId: msg.providerMessageId,
      providerThreadId: msg.providerThreadId,
      internetMessageId: msg.internetMessageId,
      direction: msg.direction as EmailDirection,
      fromEmail: msg.from.email,
      fromName: msg.from.name,
      toEmails: J(msg.to.map((a) => a.email)),
      ccEmails: Jopt(msg.cc.length ? msg.cc.map((a) => a.email) : undefined),
      bccEmails: Jopt(msg.bcc.length ? msg.bcc.map((a) => a.email) : undefined),
      replyToEmails: Jopt(msg.replyTo.length ? msg.replyTo.map((a) => a.email) : undefined),
      subject: msg.subject,
      snippet: msg.snippet,
      bodyText: msg.bodyText,
      bodyHtml: msg.bodyHtml,
      receivedAt: msg.receivedAt,
      hasAttachments: msg.hasAttachments,
      rawHeaders: Jopt(msg.headers),
      attachments: msg.attachments.length
        ? {
            create: msg.attachments.map((a) => ({
              providerAttachmentId: a.providerAttachmentId,
              filename: a.filename,
              mimeType: a.mimeType,
              sizeBytes: a.sizeBytes,
              inline: a.inline,
              contentId: a.contentId,
            })),
          }
        : undefined,
    },
    select: { id: true, threadId: true },
  });

  logger.debug({ emailId: email.id, threadId: email.threadId, subject: msg.subject }, "persisted email");
  return { emailId: email.id, threadId: email.threadId, created: true };
}

function uniqueParticipants(msg: NormalizedEmail) {
  const all = [
    { ...msg.from, role: "from" as const },
    ...msg.to.map((a) => ({ ...a, role: "to" as const })),
    ...msg.cc.map((a) => ({ ...a, role: "cc" as const })),
  ];
  const seen = new Set<string>();
  return all.filter((p) => {
    const key = `${p.email}:${p.role}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
