import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThreadList } from "@/components/inbox/thread-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [threads, thread] = await Promise.all([
    prisma.emailThread.findMany({
      where: { organizationId: session.user.organizationId, status: "INBOX" },
      orderBy: [{ priorityScore: "desc" }, { lastMessageAt: "desc" }],
      take: 50,
      select: {
        id: true,
        subject: true,
        snippet: true,
        priority: true,
        priorityScore: true,
        category: true,
        sentiment: true,
        isVip: true,
        isRead: true,
        lastMessageAt: true,
        messageCount: true,
        participants: true,
        aiSummary: true,
      },
    }),
    prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        emails: { orderBy: { receivedAt: "asc" } },
        drafts: { where: { status: { in: ["PENDING_REVIEW", "EDITED"] } }, orderBy: { createdAt: "desc" }, take: 1 },
        escalations: { where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } }, orderBy: { riskScore: "desc" }, take: 1 },
      },
    }),
  ]);

  if (!thread || thread.organizationId !== session.user.organizationId) notFound();

  // Lazy-mark read
  if (!thread.isRead) {
    await prisma.emailThread.update({ where: { id: thread.id }, data: { isRead: true } });
  }

  return (
    <div className="grid h-full grid-cols-[400px_1fr]">
      <aside className="overflow-y-auto border-r scrollbar-thin">
        <ThreadList threads={threads.map((t) => ({ ...t, lastMessageAt: t.lastMessageAt.toISOString() }))} />
      </aside>
      <section className="overflow-hidden">
        <ThreadView
          thread={{
            id: thread.id,
            subject: thread.subject,
            priority: thread.priority,
            category: thread.category,
            aiSummary: thread.aiSummary,
            aiActionItems: thread.aiActionItems,
            isVip: thread.isVip,
          }}
          emails={thread.emails.map((e) => ({
            id: e.id,
            direction: (e.direction === "OUTBOUND" ? "OUTBOUND" : "INBOUND") as "INBOUND" | "OUTBOUND",
            fromEmail: e.fromEmail,
            fromName: e.fromName,
            receivedAt: e.receivedAt.toISOString(),
            subject: e.subject,
            bodyText: e.bodyText,
            bodyHtml: e.bodyHtml,
          }))}
          draft={
            thread.drafts[0]
              ? {
                  id: thread.drafts[0].id,
                  bodyText: thread.drafts[0].bodyText,
                  subject: thread.drafts[0].subject,
                  toEmails: thread.drafts[0].toEmails,
                  confidence: thread.drafts[0].confidence,
                  tone: thread.drafts[0].tone,
                  rationale: thread.drafts[0].rationale,
                }
              : null
          }
          escalations={thread.escalations.map((e) => ({
            id: e.id,
            kind: e.kind,
            riskScore: e.riskScore,
            summary: e.summary,
            recommendedActions: e.recommendedActions,
          }))}
        />
      </section>
    </div>
  );
}
