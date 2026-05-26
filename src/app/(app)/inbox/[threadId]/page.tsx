import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThreadList } from "@/components/inbox/thread-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { InboxTabs, type InboxView } from "@/components/inbox/inbox-tabs";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID: InboxView[] = ["INBOX", "SNOOZED", "DONE", "ARCHIVED"];

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [counts, threads, thread, teammates] = await Promise.all([
    Promise.all(VALID.map((v) => prisma.emailThread.count({ where: { organizationId: session.user.organizationId, status: v } }))).then(
      (arr) => Object.fromEntries(VALID.map((v, i) => [v, arr[i]])) as Record<InboxView, number>
    ),
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
        labels: { include: { label: { select: { name: true } } } },
        snoozedUntil: true,
      },
    }),
    prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        emails: { orderBy: { receivedAt: "asc" } },
        drafts: { where: { status: { in: ["PENDING_REVIEW", "EDITED"] } }, orderBy: { createdAt: "desc" }, take: 1 },
        escalations: { where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } }, orderBy: { riskScore: "desc" }, take: 1 },
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
        comments: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, email: true } } } },
        labels: { include: { label: { select: { id: true, name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!thread || thread.organizationId !== session.user.organizationId) notFound();

  // Lazy-mark read
  if (!thread.isRead) {
    await prisma.emailThread.update({ where: { id: thread.id }, data: { isRead: true } });
  }

  return (
    <div className="grid h-full md:grid-cols-[380px_1fr] lg:grid-cols-[400px_1fr]">
      <aside className="hidden h-full min-h-0 flex-col overflow-hidden border-r border-border md:flex">
        <InboxTabs counts={counts} />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ThreadList
            threads={threads.map((t) => ({
              ...t,
              lastMessageAt: t.lastMessageAt.toISOString(),
              labels: t.labels.map((l) => l.label.name),
              snoozedUntil: t.snoozedUntil?.toISOString() ?? null,
            }))}
          />
        </div>
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
            snoozedUntil: thread.snoozedUntil?.toISOString() ?? null,
            followUpAt: thread.followUpAt?.toISOString() ?? null,
            labels: thread.labels.map((l) => l.label.name),
          }}
          assignments={thread.assignments.map((a) => ({
            id: a.id,
            user: { id: a.user.id, name: a.user.name, email: a.user.email },
          }))}
          comments={thread.comments.map((c) => ({
            id: c.id,
            body: c.body,
            createdAt: c.createdAt.toISOString(),
            user: { id: c.user.id, name: c.user.name, email: c.user.email },
          }))}
          teammates={teammates.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
          currentUserId={session.user.id}
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
            status: e.status,
          }))}
        />
      </section>
    </div>
  );
}
