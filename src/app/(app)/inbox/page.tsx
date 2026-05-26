import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThreadList } from "@/components/inbox/thread-list";
import { InboxTabs, type InboxView } from "@/components/inbox/inbox-tabs";
import { SmartArchiveBanner } from "@/components/inbox/smart-archive-banner";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID: InboxView[] = ["INBOX", "SNOOZED", "DONE", "ARCHIVED"];

export default async function InboxIndex({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const view: InboxView = VALID.includes(params.view as InboxView) ? (params.view as InboxView) : "INBOX";
  const orgWhere = { organizationId: session.user.organizationId };

  const [counts, threads, archivableCount] = await Promise.all([
    Promise.all(VALID.map((v) => prisma.emailThread.count({ where: { ...orgWhere, status: v } }))).then((arr) =>
      Object.fromEntries(VALID.map((v, i) => [v, arr[i]])) as Record<InboxView, number>
    ),
    prisma.emailThread.findMany({
      where: { ...orgWhere, status: view },
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
        snoozedUntil: true,
        hasPendingDraft: true,
        openEscalationCount: true,
        commentCount: true,
        labels: { include: { label: { select: { name: true } } } },
      },
    }),
    // Archivable: vendor + low-priority unread threads in inbox
    prisma.emailThread.count({
      where: { ...orgWhere, status: "INBOX", isVendor: true, priority: { in: ["LOW", "NORMAL"] } },
    }),
  ]);

  return (
    <div className="grid h-full md:grid-cols-[380px_1fr] lg:grid-cols-[400px_1fr]">
      <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border">
        <InboxTabs counts={counts} />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {view === "INBOX" && archivableCount > 0 && <SmartArchiveBanner count={archivableCount} />}
          <ThreadList
            view={view}
            threads={threads.map((t) => ({
              ...t,
              lastMessageAt: t.lastMessageAt.toISOString(),
              snoozedUntil: t.snoozedUntil?.toISOString() ?? null,
              labels: t.labels.map((l) => l.label.name),
            }))}
          />
        </div>
      </aside>
      <section className="hidden h-full flex-col items-center justify-center gap-8 p-10 text-center md:flex">
        <div className="text-sm text-muted-foreground">Select a thread to view.</div>
        <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 text-left shadow-subtle">
          <div className="a3-label mb-3 text-primary">How A3 Inbox AI Works</div>
          <ol className="space-y-3">
            {[
              ["Triage", "every inbound email the moment it lands"],
              ["Categorize & prioritize", "sales lead, OEM, complaint, legal, vendor noise…"],
              ["Draft a reply", "in the GM's voice — held for one-click approval"],
              ["Daily digest", "at 7am with what matters and what shipped"],
              ["Escalation alerts", "on legal threats, BBB, lemon law, HR, fraud"],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-primary/10 font-mono text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <span className="font-semibold text-foreground">{title}</span>{" "}
                  <span className="text-muted-foreground">{body}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
