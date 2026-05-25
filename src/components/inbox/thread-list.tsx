"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, Sparkles, Clock, Tag } from "lucide-react";
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
}

export function ThreadList({ threads }: { threads: ThreadRow[] }) {
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
    return (
      <div className="flex h-full items-center justify-center p-10 text-center text-[13px] text-muted-foreground">
        {query ? (
          <>No matches for &quot;<span className="font-semibold text-foreground">{query}</span>&quot;</>
        ) : (
          "Inbox zero. Nothing for the GM to triage."
        )}
      </div>
    );
  }

  return (
    <>
      {query && (
        <div className="border-b border-border bg-secondary px-4 py-2 text-[11px] text-muted-foreground">
          {filtered.length} of {threads.length} threads matching &quot;
          <span className="font-semibold text-foreground">{query}</span>&quot;
        </div>
      )}
      <ul className="divide-y divide-border">
        {filtered.map((t) => {
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
                  !t.isRead && !active && "bg-primary/[0.03]"
                )}
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={cn("truncate font-semibold text-foreground", !t.isRead && "text-foreground")}>
                    {fromName}
                  </span>
                  {t.isVip ? <Star className="h-3 w-3 fill-primary stroke-primary" aria-label="VIP" /> : null}
                  <PriorityBadge priority={t.priority} />
                  <CategoryBadge category={t.category} />
                  {t.snoozedUntil ? (
                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono text-[10px] uppercase">{relativeTime(t.snoozedUntil).replace(" ago", "")}</span>
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
                {labels.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
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
