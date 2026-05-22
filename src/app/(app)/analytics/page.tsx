import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { startOfDay, subDays } from "date-fns";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const since = startOfDay(subDays(new Date(), 7));
  const where = { organizationId: session.user.organizationId };

  const [emails7d, openEsc, pendingDrafts, byPriority, byCategory] = await Promise.all([
    prisma.email.count({ where: { ...where, receivedAt: { gte: since } } }),
    prisma.escalation.count({ where: { ...where, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
    prisma.aiDraft.count({ where: { ...where, status: "PENDING_REVIEW" } }),
    prisma.emailThread.groupBy({
      by: ["priority"],
      where: { ...where, lastMessageAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.emailThread.groupBy({
      by: ["category"],
      where: { ...where, lastMessageAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6">
          <div className="a3-label mb-1 text-a3-fog">Performance · last 7 days</div>
          <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
            <BarChart3 className="h-7 w-7 text-primary" />
            Analytics
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Emails received" value={emails7d} />
          <Stat label="Open escalations" value={openEsc} tone="critical" />
          <Stat label="Drafts awaiting review" value={pendingDrafts} tone="primary" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>By priority</CardTitle></CardHeader>
            <CardContent>
              <Distribution rows={byPriority.map((r) => ({ label: r.priority ?? "(none)", count: r._count._all }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>By category</CardTitle></CardHeader>
            <CardContent>
              <Distribution rows={byCategory.map((r) => ({ label: r.category ?? "(none)", count: r._count._all }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "critical" | "primary" }) {
  const color =
    tone === "critical" ? "text-red-600 dark:text-red-400" :
    tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-6">
        <div className="a3-label text-a3-fog">{label}</div>
        <div className={`mt-2 text-[40px] font-black leading-none tracking-tight ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Distribution({ rows }: { rows: { label: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-foreground">{r.label.replace(/_/g, " ").toLowerCase()}</span>
            <span className="font-mono font-bold text-foreground">{r.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${(r.count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
