import { MailboxProvider } from "../src/lib/enums";
import { prisma } from "../src/lib/db";
import { sendGmailReply } from "../src/lib/sync/gmail";
import { sendMicrosoftReply } from "../src/lib/sync/microsoft";
import { audit } from "../src/lib/audit";
import { fromJsonColumn } from "../src/lib/json-column";

export async function runSendDraft(payload: { draftId: string; userId: string }) {
  const draft = await prisma.aiDraft.findUniqueOrThrow({
    where: { id: payload.draftId },
    include: {
      thread: { include: { mailbox: true, emails: { orderBy: { receivedAt: "desc" }, take: 1 } } },
    },
  });
  if (draft.status !== "APPROVED") throw new Error(`Draft ${draft.id} not approved (status=${draft.status})`);

  const last = draft.thread.emails[0];
  const to = fromJsonColumn<string[]>(draft.toEmails, []);
  const cc = fromJsonColumn<string[] | undefined>(draft.ccEmails, undefined);
  let providerMessageId = "";

  if (draft.thread.mailbox.provider === MailboxProvider.GMAIL) {
    const r = await sendGmailReply(draft.thread.mailbox.id, {
      to,
      cc,
      subject: draft.subject ?? `Re: ${draft.thread.subject ?? ""}`,
      bodyText: draft.bodyText,
      inReplyTo: last?.internetMessageId ?? undefined,
      references: last?.internetMessageId ? [last.internetMessageId] : undefined,
      threadId: draft.thread.providerThreadId,
    });
    providerMessageId = r.id;
  } else {
    const r = await sendMicrosoftReply(draft.thread.mailbox.id, {
      to,
      cc,
      subject: draft.subject ?? `Re: ${draft.thread.subject ?? ""}`,
      bodyText: draft.bodyText,
      conversationId: draft.thread.providerThreadId,
    });
    providerMessageId = r.id;
  }

  await prisma.aiDraft.update({
    where: { id: draft.id },
    data: { status: "SENT", sentAt: new Date(), sentMessageId: providerMessageId },
  });

  await audit({
    organizationId: draft.organizationId,
    userId: payload.userId,
    kind: "DRAFT_SENT",
    targetType: "draft",
    targetId: draft.id,
    meta: { providerMessageId },
  });
}
