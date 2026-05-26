import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Shield, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"] as const;
type Status = (typeof STATUS_ORDER)[number];

const STATUS_META: Record<Status, { label: string; tone: string; icon: typeof AlertTriangle }> = {
  OPEN: { label: "Open", tone: "text-red-600 dark:text-red-400", icon: AlertTriangle },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "text-amber-600 dark:text-amber-400", icon: Shield },
  IN_PROGRESS: { label: "In progress", tone: "text-primary", icon: Clock },
  RESOLVED: { label: "Resolved", tone: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  DISMISSED: { label: "Dismissed", tone: "text-muted-foreground", icon: CheckCircle2 },
};

export default async function EscalationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const filter = (sp.filter ?? "ALL").toUpperCase();

  const escalations = await prisma.escalation.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ status: "asc" }, { riskScore: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { thread: { select: { id: true, subject: true, priority: true, category: true } } },
  });

  const counts = {
    OPEN: escalations.filter((e: any) => e.status === "OPEN").length,
    ACKNOWLEDGED: escalations.filter((e: any) => e.status === "ACKNOWLEDGED").length,
    IN_PROGRESS: escalations.filter((e: any) => e.status === "IN_PROGRESS").length,
    RESOLVED: escalations.filter((e: any) => e.status === "RESOLVED").length,
    DISMISSED: escalations.filter((e: any) => e.status === "DISMISSED").length,
  };
  const total = escalations.length;
  const openish = counts.OPEN + counts.ACKNOWLEDGED + counts.IN_PROGRESS;

  // Kind filter (LEGAL_THREAT, CUSTOMER_THREAT, etc.)
  const kinds = Array.from(new Set(escalations.map((e: any) => e.kind))).sort();
  const visible = filter === "ALL" ? escalations : escalations.filter((e: any) => e.kind === filter);

  // Group by status for the rendered output
  const grouped = STATUS_ORDER
    .map((s) => ({ status: s, items: (visible as any[]).filter((e) => e.status === s) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-4 md:p-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="a3-label mb-1 text-a3-fog">Risk &amp; Compliance</div>
            <h2 className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight text-foreground md:text-[28px]">
              <AlertTriangle className="h-7 w-7 text-red-500" />
              Escalations
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Threads the legal-risk &amp; priority agents pulled out for human attention.
            </p>
          </div>
          {openish > 0 && (
            <Badge variant="critical" className="self-start text-[11px] md:self-end">
              {openish} need your attention
            </Badge>
          )}
        </header>

        {/* Status summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Open" value={counts.OPEN} tone="text-red-600 dark:text-red-400" />
          <StatCard label="Acknowledged" value={counts.ACKNOWLEDGED} tone="text-amber-600 dark:text-amber-400" />
          <StatCard label="In progress" value={counts.IN_PROGRESS} tone="text-primary" />
          <StatCard label="Resolved" value={counts.RESOLVED + counts.DISMISSED} tone="text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Kind filter chips */}
        {kinds.length > 1 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="a3-label text-a3-fog">Filter:</span>
            <FilterChip href="/escalations" label={`All · ${total}`} active={filter === "ALL"} />
            {kinds.map((k: any) => (
              <FilterChip
                key={k}
                href={`/escalations?filter=${encodeURIComponent(k)}`}
                label={`${prettyKind(k)} · ${(escalations as any[]).filter((e) => e.kind === k).length}`}
                active={filter === k}
              />
            ))}
          </div>
        )}

        {grouped.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-[15px] font-bold text-foreground">No escalations right now.</div>
              <p className="max-w-sm text-[13px] text-muted-foreground">
                The risk agents will surface anything matching legal threats, HR complaints,
                lemon law, BBB, executive escalation, or wire-fraud patterns the moment it arrives.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ status, items }) => {
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              return (
                <section key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${meta.tone}`} />
                    <h3 className={`text-[13px] font-bold uppercase tracking-wider ${meta.tone}`}>
                      {meta.label}
                    </h3>
                    <span className="font-mono text-[11px] text-a3-fog">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((e: any) => (
                      <EscalationCard key={e.id} e={e} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="a3-label text-a3-fog">{label}</div>
        <div className={`mt-1 text-[28px] font-extrabold tracking-tight ${tone}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function EscalationCard({ e }: { e: any }) {
  const risk = typeof e.riskScore === "number" ? e.riskScore : 0;
  const riskPct = Math.round(risk * 100);
  const ageHours = (Date.now() - new Date(e.createdAt).getTime()) / 3_600_000;
  const isUrgent = e.status === "OPEN" && ageHours < 12;
  const isStale = (e.status === "OPEN" || e.status === "ACKNOWLEDGED") && ageHours > 48;

  return (
    <Link href={`/inbox/${e.thread?.id}`} className="block">
      <Card className="transition-all hover:border-primary/40 hover:shadow-subtle">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <Badge variant={e.severity === "CRITICAL" ? "critical" : "secondary"}>
                  {e.severity?.toLowerCase() ?? "high"}
                </Badge>
                <span className="a3-label font-semibold text-foreground">
                  {prettyKind(e.kind)}
                </span>
                {isUrgent && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <Clock className="h-2.5 w-2.5" /> Fresh
                  </span>
                )}
                {isStale && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <Clock className="h-2.5 w-2.5" /> Sitting {Math.round(ageHours)}h
                  </span>
                )}
                <span className="ml-auto whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                  {relativeTime(e.createdAt)}
                </span>
              </div>
              <div className="text-[15px] font-bold leading-snug text-foreground">
                {e.thread?.subject ?? "(no subject)"}
              </div>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {e.summary ?? e.reason ?? "—"}
              </p>

              {/* Risk score bar */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider">
                    <span className="text-a3-fog">Risk score</span>
                    <span className={`font-mono font-bold ${riskBarTone(risk)}`}>{riskPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${riskBarBg(risk)}`}
                      style={{ width: `${Math.max(2, riskPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function prettyKind(k: string | undefined | null): string {
  if (!k) return "Escalation";
  return k.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function riskBarTone(r: number): string {
  if (r >= 0.85) return "text-red-600 dark:text-red-400";
  if (r >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-primary";
}
function riskBarBg(r: number): string {
  if (r >= 0.85) return "bg-red-500";
  if (r >= 0.6) return "bg-amber-500";
  return "bg-primary";
}
