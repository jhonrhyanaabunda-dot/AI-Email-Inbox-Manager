import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ThreadList } from "@/components/inbox/thread-list";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InboxIndex() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const threads = await prisma.emailThread.findMany({
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
  });

  return (
    <div className="grid h-full grid-cols-[400px_1fr]">
      <aside className="overflow-y-auto border-r scrollbar-thin">
        <ThreadList
          threads={threads.map((t) => ({
            ...t,
            lastMessageAt: t.lastMessageAt.toISOString(),
          }))}
        />
      </aside>
      <section className="flex h-full flex-col items-center justify-center gap-8 p-10 text-center">
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
