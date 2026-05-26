"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  Shield,
  RotateCw,
  User,
  AlertCircle,
  Activity,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { toast } from "sonner";

type Escalation = {
  id: string;
  kind: string;
  severity?: string | null;
  status: string;
  riskScore?: number;
  summary?: string | null;
  reason?: string | null;
  createdAt: string | Date;
  acknowledgedAt?: string | Date | null;
  resolvedAt?: string | Date | null;
  resolutionNotes?: string | null;
  assignee?: { id: string; name: string | null; email: string | null } | null;
  thread?: { id?: string; subject?: string | null } | null;
};

type TimelineEvent = {
  kind: "flagged" | "acknowledged" | "in_progress" | "resolved" | "dismissed";
  at: Date;
  by?: string;
  note?: string | null;
};

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
};

export function EscalationCard({ e }: { e: Escalation }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const risk = typeof e.riskScore === "number" ? e.riskScore : 0;
  const riskPct = Math.round(risk * 100);
  const ageHours = (Date.now() - new Date(e.createdAt).getTime()) / 3_600_000;
  const isFresh = e.status === "OPEN" && ageHours < 12;
  const isStale = (e.status === "OPEN" || e.status === "ACKNOWLEDGED") && ageHours > 48;

  const slaHours = SLA_HOURS[e.severity ?? "HIGH"] ?? 24;
  const slaRemaining = slaHours - ageHours;
  const slaActive = e.status === "OPEN" || e.status === "ACKNOWLEDGED" || e.status === "IN_PROGRESS";

  async function changeStatus(status: "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "OPEN") {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/escalations/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const verb =
        status === "ACKNOWLEDGED"
          ? "Acknowledged"
          : status === "IN_PROGRESS"
            ? "Now in progress"
            : status === "RESOLVED"
              ? "Resolved"
              : "Reopened";
      toast.success(verb);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(`Couldn't update: ${(err as Error).message}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="transition-all hover:border-primary/40 hover:shadow-subtle">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Badge variant={e.severity === "CRITICAL" ? "critical" : "secondary"}>
            {(e.severity ?? "high").toLowerCase()}
          </Badge>
          <span className="a3-label font-semibold text-foreground">{prettyKind(e.kind)}</span>
          {isFresh && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <Clock className="h-2.5 w-2.5" /> Fresh
            </span>
          )}
          {isStale && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Clock className="h-2.5 w-2.5" /> Sitting {Math.round(ageHours)}h
            </span>
          )}
          {slaActive && (
            <SlaChip remaining={slaRemaining} />
          )}
          {e.assignee && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <User className="h-2.5 w-2.5" />
              {e.assignee.name?.split(" ")[0] ?? e.assignee.email?.split("@")[0]}
            </span>
          )}
          <span className="ml-auto whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-a3-fog">
            {relativeTime(e.createdAt)}
          </span>
        </div>

        <Link
          href={e.thread?.id ? `/inbox/${e.thread.id}` : "#"}
          className="group block"
        >
          <div className="flex items-start gap-2 text-[15px] font-bold leading-snug text-foreground group-hover:text-primary">
            {e.thread?.subject ?? "(no subject)"}
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>

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

        {/* Activity timeline */}
        <ActivityTimeline e={e} />

        {/* Inline actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {e.status === "OPEN" && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={pending} onClick={() => changeStatus("ACKNOWLEDGED")}>
              <Shield className="mr-1 h-3 w-3" /> Acknowledge
            </Button>
          )}
          {(e.status === "OPEN" || e.status === "ACKNOWLEDGED") && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={pending} onClick={() => changeStatus("IN_PROGRESS")}>
              <Clock className="mr-1 h-3 w-3" /> Work on it
            </Button>
          )}
          {e.status !== "RESOLVED" && e.status !== "DISMISSED" && (
            <Button size="sm" className="h-7 px-2 text-[11px]" disabled={pending} onClick={() => changeStatus("RESOLVED")}>
              <CheckCircle2 className="mr-1 h-3 w-3" /> Resolve
            </Button>
          )}
          {(e.status === "RESOLVED" || e.status === "DISMISSED") && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={pending} onClick={() => changeStatus("OPEN")}>
              <RotateCw className="mr-1 h-3 w-3" /> Reopen
            </Button>
          )}
          {e.thread?.id && (
            <Link
              href={`/inbox/${e.thread.id}`}
              className="ml-auto inline-flex items-center gap-1 self-center text-[11px] font-medium text-primary hover:underline"
            >
              Open thread <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTimeline({ e }: { e: Escalation }) {
  const events: TimelineEvent[] = [];
  events.push({ kind: "flagged", at: new Date(e.createdAt) });
  if (e.acknowledgedAt) {
    events.push({ kind: "acknowledged", at: new Date(e.acknowledgedAt), by: e.assignee?.name ?? undefined });
  }
  if (e.status === "IN_PROGRESS" && !e.resolvedAt) {
    events.push({ kind: "in_progress", at: new Date(e.acknowledgedAt ?? e.createdAt), by: e.assignee?.name ?? undefined });
  }
  if (e.resolvedAt) {
    events.push({
      kind: e.status === "DISMISSED" ? "dismissed" : "resolved",
      at: new Date(e.resolvedAt),
      by: e.assignee?.name ?? undefined,
      note: e.resolutionNotes ?? undefined,
    });
  }
  events.sort((a, b) => +a.at - +b.at);

  if (events.length <= 1) return null;

  return (
    <details className="group rounded-md border border-border bg-secondary/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground">
        <Activity className="h-3 w-3" />
        <span>Activity</span>
        <span className="ml-1 font-mono text-[10px] text-a3-fog">· {events.length} event{events.length === 1 ? "" : "s"}</span>
      </summary>
      <ol className="space-y-2.5 px-3 pb-3 pt-1">
        {events.map((ev, i) => {
          const meta = TIMELINE_META[ev.kind];
          const Icon = meta.icon;
          const isLast = i === events.length - 1;
          return (
            <li key={i} className="relative flex gap-3">
              {!isLast && (
                <span className="absolute left-[7px] top-[18px] h-[calc(100%+10px)] w-px bg-border" />
              )}
              <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${meta.tone}`}>
                <Icon className="h-2 w-2 stroke-[3]" />
              </span>
              <div className="flex-1 -mt-0.5">
                <div className="text-[12px] font-medium text-foreground">
                  {meta.label}
                  {ev.by && (
                    <span className="font-normal text-muted-foreground"> by {ev.by.split(" ")[0]}</span>
                  )}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                  {relativeTime(ev.at)}
                </div>
                {ev.note && <div className="mt-1 text-[12px] italic text-muted-foreground">&ldquo;{ev.note}&rdquo;</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

const TIMELINE_META: Record<
  TimelineEvent["kind"],
  { label: string; tone: string; icon: typeof AlertCircle }
> = {
  flagged: { label: "Flagged by AI", tone: "bg-red-500 text-white", icon: AlertCircle },
  acknowledged: { label: "Acknowledged", tone: "bg-amber-500 text-white", icon: Shield },
  in_progress: { label: "Marked in progress", tone: "bg-primary text-primary-foreground", icon: Clock },
  resolved: { label: "Resolved", tone: "bg-emerald-500 text-white", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", tone: "bg-muted-foreground text-background", icon: CheckCircle2 },
};

function SlaChip({ remaining }: { remaining: number }) {
  // remaining is in hours; can be negative (overdue)
  if (remaining < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
        SLA breached
      </span>
    );
  }
  const tone =
    remaining < 4
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : remaining < 12
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-secondary text-muted-foreground";
  const display = remaining >= 24 ? `${Math.round(remaining / 24)}d to SLA` : `${Math.round(remaining)}h to SLA`;
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {display}
    </span>
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
