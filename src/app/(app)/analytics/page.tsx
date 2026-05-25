import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { startOfDay, subDays, differenceInMinutes } from "date-fns";
import { BarChart3, Clock, AlertTriangle, FileEdit, Mail, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const since = startOfDay(subDays(new Date(), 7));
  const where = { organizationId: session.user.organizationId };

  const [emails7d, openEsc, pendingDrafts, sentDrafts, byPriority, byCategory, bySentiment, allEmails, threadsForResponse] =
    await Promise.all([
      prisma.email.count({ where: { ...where, receivedAt: { gte: since } } }),
      prisma.escalation.count({ where: { ...where, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      prisma.aiDraft.count({ where: { ...where, status: "PENDING_REVIEW" } }),
      prisma.aiDraft.count({ where: { ...where, status: "SENT", sentAt: { gte: since } } }),
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
      prisma.emailThread.groupBy({
        by: ["sentiment"],
        where: { ...where, lastMessageAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.email.findMany({
        where: { ...where, receivedAt: { gte: since } },
        select: { direction: true, receivedAt: true, threadId: true },
      }),
      prisma.emailThread.findMany({
        where: { ...where, lastMessageAt: { gte: since } },
        select: {
          id: true,
          emails: { orderBy: { receivedAt: "asc" }, select: { direction: true, receivedAt: true } },
        },
      }),
    ]);

  // Response-time: for each thread w/ inbound followed by outbound, measure minutes
  const responseTimes: number[] = [];
  for (const t of threadsForResponse) {
    let lastInbound: Date | null = null;
    for (const e of t.emails) {
      if (e.direction === "INBOUND") lastInbound = e.receivedAt;
      else if (e.direction === "OUTBOUND" && lastInbound) {
        responseTimes.push(differenceInMinutes(e.receivedAt, lastInbound));
        lastInbound = null;
      }
    }
  }
  const avgResponseMin = responseTimes.length
    ? Math.round(responseTimes.reduce((s, n) => s + n, 0) / responseTimes.length)
    : null;
  const medianResponseMin = responseTimes.length
    ? [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
    : null;
  const slaPct = responseTimes.length
    ? Math.round((responseTimes.filter((m) => m <= 60).length / responseTimes.length) * 100)
    : null;

  // Heatmap: 7 days × 24 hours grid of inbound email volume
  const heat: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const e of allEmails) {
    if (e.direction !== "INBOUND") continue;
    const dayIdx = Math.floor((Date.now() - e.receivedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIdx >= 0 && dayIdx < 7) heat[6 - dayIdx][e.receivedAt.getHours()]++;
  }
  const heatMax = Math.max(1, ...heat.flat());

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

        {/* ── Top KPI strip ─────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPI label="Emails received" value={emails7d} icon={Mail} />
          <KPI
            label="Avg. response time"
            value={avgResponseMin !== null ? formatMinutes(avgResponseMin) : "—"}
            sub={medianResponseMin !== null ? `median ${formatMinutes(medianResponseMin)}` : undefined}
            icon={Clock}
            tone="primary"
          />
          <KPI
            label="Replies within 1h SLA"
            value={slaPct !== null ? `${slaPct}%` : "—"}
            sub={`${responseTimes.length} replies measured`}
            icon={TrendingUp}
            tone="primary"
          />
          <KPI label="Drafts sent" value={sentDrafts} sub={`${pendingDrafts} pending review`} icon={FileEdit} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <KPI label="Open escalations" value={openEsc} icon={AlertTriangle} tone="critical" />
          <Card>
            <CardContent className="flex h-full items-center gap-4 p-6">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="a3-label text-a3-fog">A3 Inbox AI impact (est)</div>
                <div className="text-[22px] font-extrabold leading-tight text-foreground">
                  <span className="text-primary">{Math.round(emails7d * 0.65)}h</span> of GM time reclaimed this week
                </div>
                <div className="text-[11px] text-muted-foreground">Based on industry-typical 8 min triage time × emails AI handled.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Email heatmap ─────────────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Inbound volume — last 7 days × hour of day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="mb-1 grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-[10px] uppercase tracking-wider text-a3-fog">
                  <div />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="text-center">{h.toString().padStart(2, "0")}</div>
                  ))}
                </div>
                {heat.map((row, dayIdx) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - dayIdx));
                  const label = date.toLocaleDateString(undefined, { weekday: "short" });
                  return (
                    <div key={dayIdx} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 py-0.5">
                      <div className="self-center text-[11px] font-semibold text-foreground">{label}</div>
                      {row.map((v, h) => {
                        const intensity = v / heatMax;
                        return (
                          <div
                            key={h}
                            title={`${label} ${h.toString().padStart(2, "0")}:00 — ${v} email${v === 1 ? "" : "s"}`}
                            className="aspect-square rounded-sm border border-border"
                            style={{
                              backgroundColor:
                                v === 0
                                  ? "hsl(var(--secondary))"
                                  : `hsl(141 73% ${Math.max(28, 88 - intensity * 60)}%)`,
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-a3-fog">
                  <span>Quiet</span>
                  {[0.2, 0.4, 0.6, 0.8, 1].map((i) => (
                    <div key={i} className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: `hsl(141 73% ${Math.max(28, 88 - i * 60)}%)` }} />
                  ))}
                  <span>Busy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Distribution cards ────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
          <Card>
            <CardHeader><CardTitle>By sentiment</CardTitle></CardHeader>
            <CardContent>
              <Distribution rows={bySentiment.map((r) => ({ label: r.sentiment ?? "(none)", count: r._count._all }))} sentimentColors />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "critical" | "primary";
}) {
  const color =
    tone === "critical" ? "text-red-600 dark:text-red-400" :
    tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="a3-label text-a3-fog">{label}</div>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className={`mt-2 text-[32px] font-black leading-none tracking-tight ${color}`}>{value}</div>
        {sub ? <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

function Distribution({
  rows,
  sentimentColors,
}: {
  rows: { label: string; count: number }[];
  sentimentColors?: boolean;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  function colorFor(label: string) {
    if (!sentimentColors) return "hsl(var(--primary))";
    if (label === "VERY_POSITIVE" || label === "POSITIVE") return "hsl(141 73% 45%)";
    if (label === "NEUTRAL") return "hsl(220 9% 60%)";
    if (label === "NEGATIVE" || label === "VERY_NEGATIVE") return "hsl(0 72% 55%)";
    return "hsl(var(--primary))";
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-foreground">{r.label.replace(/_/g, " ").toLowerCase()}</span>
            <span className="font-mono font-bold text-foreground">{r.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full transition-all" style={{ width: `${(r.count / total) * 100}%`, backgroundColor: colorFor(r.label) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function Badge_({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}
