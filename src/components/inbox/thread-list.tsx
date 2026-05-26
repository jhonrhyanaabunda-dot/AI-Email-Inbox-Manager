"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star, Sparkles, Clock, Tag, FileEdit, AlertTriangle, MessageSquare,
  Inbox as InboxIcon, CheckCircle2, Archive as ArchiveIcon,
} from "lucide-react";
import { cn, relativeTime, truncate } from "@/lib/utils";
import { PriorityBadge, CategoryBadge } from "./priority-badge";

export interface ThreadRow {
  id: string;
  subject: string | null;
  snippet: string | null;
  priority: string | null;
  priorityScore: number | null;
  category: string | null;
  sentiment: string | null;
  isVip: boolean;
  isRead: boolean;
  lastMessageAt: string | Date;
  messageCount: number;
  aiSummary: string | null;
  participants: unknown;
  labels?: string[];
  snoozedUntil?: string | null;
  hasPendingDraft?: boolean;
  openEscalationCount?: number;
  commentCount?: number;
}

type View = "INBOX" | "SNOOZED" | "DONE" | "ARCHIVED";

const EMPTY_STATES: Record<View, { icon: typeof InboxIcon; title: string; body: string }> = {
  INBOX: {
    icon: InboxIcon,
    title: "Inbox zero.",
    body: "Nothing left for the GM to triage. Either you're on top of it or the AI archived the noise.",
  },
  SNOOZED: {
    icon: Clock,
    title: "Nothing snoozed.",
    body: "When you snooze a thread it'll surface here until its wake-up time.",
  },
  DONE: {
    icon: CheckCircle2,
    title: "No completed threads yet.",
    body: "Mark a thread done after you've handled it — it'll move here so the inbox stays sharp.",
  },
  ARCHIVED: {
    icon: ArchiveIcon,
    title: "Archive is empty.",
    body: "Vendor newsletters and low-priority noise get auto-archived once you turn that on.",
  },
};

export function ThreadList({ threads, view = "INBOX" }: { threads: ThreadRow[]; view?: View }) {
  const params = useParams<{ threadId?: string }>();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setQuery((html.dataset.search ?? "").trim().toLowerCase());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(html, { attributes: true, attributeFilter: ["data-search"] });
    return () => obs.disconnect();
  }, []);

  const filtered = query
    ? threads.filter((t) => {
        const hay = [
          t.subject ?? "",
          t.snippet ?? "",
          t.aiSummary ?? "",
          t.category ?? "",
          (t.labels ?? []).join(" "),
          pickFromName(t.participants),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
    : threads;

  if (!filtered.length) {
    const empty = EMPTY_STATES[view];
    const Icon = empty.icon;
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-xs text-center">
          {query ? (
            <>
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                <InboxIcon className="h-5 w-5" />
              </div>
              <div className="text-[13px] font-semibold text-foreground">No matches</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Nothing in this view matches &ldquo;<span className="font-mono text-foreground">{query}</span>&rdquo;.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-[13px] font-semibold text-foreground">{empty.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{empty.body}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Group filtered threads by recency bucket for visual rhythm.
  const groups = groupByRecency(filtered);

  return (
    <>
      {query && (
        <div className="border-b border-border bg-secondary px-4 py-2 text-[11px] text-muted-foreground">
          {filtered.length} of {threads.length} threads matching &ldquo;
          <span className="font-semibold text-foreground">{query}</span>&rdquo;
        </div>
      )}
      {groups.map(({ label, rows }) => (
        <section key={label}>
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-1.5 backdrop-blur">
            <span className="a3-label text-a3-fog">{label}</span>
            <span className="ml-2 font-mono text-[10px] text-a3-fog">{rows.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {rows.map((t) => {
              const fromName = pickFromName(t.participants);
              const active = params?.threadId === t.id;
              const labels = t.labels ?? [];
              return (
                <li key={t.id} className="relative">
                  {active && <span className="absolute left-0 top-0 h-full w-[3px] bg-primary" />}
                  <Link
                    href={`/inbox/${t.id}`}
                    className={cn(
                      "block px-5 py-4 transition-colors hover:bg-secondary",
                      active && "bg-secondary",
                      !t.isRead && !active && "bg-primary/[0.03]",
                    )}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {!t.isRead && (
                        <span
                          aria-label="Unread"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        />
                      )}
                      <span className={cn("truncate font-semibold text-foreground", !t.isRead && "text-foreground")}>
                        {fromName}
                      </span>
                      {t.isVip ? <Star className="h-3 w-3 fill-primary stroke-primary" aria-label="VIP" /> : null}
                      <PriorityBadge priority={t.priority} />
                      <CategoryBadge category={t.category} />
                      {t.snoozedUntil ? (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          <span className="font-mono text-[10px] uppercase">
                            {relativeTime(t.snoozedUntil).replace(" ago", "")}
                          </span>
                        </span>
                      ) : null}
                      <span className="ml-auto whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                        {relativeTime(t.lastMessageAt)}
                      </span>
                    </div>
                    <div className={cn("mt-1.5 text-[14px] leading-snug text-foreground", !t.isRead && "font-semibold")}>
                      {t.subject || "(no subject)"}
                      {t.messageCount > 1 && (
                        <span className="ml-1.5 font-mono text-[11px] font-normal text-a3-fog">· {t.messageCount}</span>
                      )}
                    </div>
                    {t.aiSummary ? (
                      <div className="mt-2 flex items-start gap-2 rounded-md bg-primary/[0.06] px-2.5 py-1.5 text-[12px] leading-relaxed text-foreground/85">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span className="line-clamp-2">{truncate(t.aiSummary, 220)}</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 line-clamp-1 text-[12px] text-muted-foreground">{t.snippet ?? ""}</div>
                    )}

                    {/* Signals row — drafts, escalations, comments, labels */}
                    {(t.hasPendingDraft || (t.openEscalationCount ?? 0) > 0 || (t.commentCount ?? 0) > 0 || labels.length > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {t.hasPendingDraft && (
                          <span
                            title="AI draft awaiting your approval"
                            className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                          >
                            <FileEdit className="h-2.5 w-2.5" />
                            Draft
                          </span>
                        )}
                        {(t.openEscalationCount ?? 0) > 0 && (
                          <span
                            title="Open escalation on this thread"
                            className="inline-flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Escalated
                          </span>
                        )}
                        {(t.commentCount ?? 0) > 0 && (
                          <span
                            title={`${t.commentCount} internal comment${t.commentCount === 1 ? "" : "s"}`}
                            className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            {t.commentCount}
                          </span>
                        )}
                        {labels.map((l) => (
                          <span
                            key={l}
                            className="inline-flex items-center gap-0.5 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                          >
                            <Tag className="h-2 w-2" />
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function pickFromName(participants: unknown): string {
  let list: any[] = [];
  if (Array.isArray(participants)) list = participants;
  else if (typeof participants === "string" && participants) {
    try { list = JSON.parse(participants); } catch {}
  }
  const from = list.find((p: any) => p?.role === "from");
  return from?.name || from?.email || "";
}

/** Bucket threads into Today / Yesterday / This week / Older for visual rhythm. */
function groupByRecency(rows: ThreadRow[]): { label: string; rows: ThreadRow[] }[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const buckets: Record<string, ThreadRow[]> = { Today: [], Yesterday: [], "This week": [], Older: [] };
  for (const r of rows) {
    const ts = new Date(r.lastMessageAt).getTime();
    const age = now - ts;
    if (age < day) buckets.Today.push(r);
    else if (age < 2 * day) buckets.Yesterday.push(r);
    else if (age < 7 * day) buckets["This week"].push(r);
    else buckets.Older.push(r);
  }
  return Object.entries(buckets)
    .filter(([, rs]) => rs.length > 0)
    .map(([label, rs]) => ({ label, rows: rs }));
}
