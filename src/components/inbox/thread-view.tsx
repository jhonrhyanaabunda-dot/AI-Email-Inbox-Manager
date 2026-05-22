"use client";
import { useState } from "react";
import { Sparkles, Send, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge, CategoryBadge } from "./priority-badge";
import { relativeTime } from "@/lib/utils";

function parseList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string" && v) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? (p as T[]) : []; } catch { return []; }
  }
  return [];
}

interface Email {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  fromEmail: string;
  fromName: string | null;
  receivedAt: string | Date;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
}
interface Draft {
  id: string;
  bodyText: string;
  subject: string | null;
  toEmails: unknown;
  confidence: number | null;
  tone: string | null;
  rationale: string | null;
}
interface Escalation {
  id: string;
  kind: string;
  riskScore: number;
  summary: string;
  recommendedActions: unknown;
}

export function ThreadView({
  thread,
  emails,
  draft,
  escalations,
}: {
  thread: {
    id: string;
    subject: string | null;
    priority: string | null;
    category: string | null;
    aiSummary: string | null;
    aiActionItems: unknown;
    isVip: boolean;
  };
  emails: Email[];
  draft: Draft | null;
  escalations: Escalation[];
}) {
  const openEsc = escalations[0];
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="a3-label mb-1 text-a3-fog">Thread</div>
            <h1 className="text-[22px] font-extrabold leading-snug tracking-tight text-foreground">
              {thread.subject || "(no subject)"}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {thread.isVip ? <Badge>VIP</Badge> : null}
            <PriorityBadge priority={thread.priority} />
            <CategoryBadge category={thread.category} />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {openEsc ? <EscalationBanner esc={openEsc} /> : null}
        {thread.aiSummary ? <AiSummary summary={thread.aiSummary} actions={thread.aiActionItems} /> : null}

        <div className="space-y-4 p-6">
          {emails.map((e) => (
            <Card key={e.id} className="hover:shadow-subtle">
              <CardHeader className="space-y-1 pb-3">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="font-semibold text-foreground">
                    {e.fromName ? `${e.fromName}` : e.fromEmail}
                    <span className="ml-2 font-normal text-a3-fog">{e.fromName ? `<${e.fromEmail}>` : ""}</span>
                    {e.direction === "OUTBOUND" ? <Badge variant="secondary" className="ml-2">sent</Badge> : null}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                    {relativeTime(e.receivedAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {e.bodyText ? (
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">{e.bodyText}</pre>
                ) : e.bodyHtml ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: e.bodyHtml }} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {draft ? <DraftPanel draft={draft} /> : <NoDraftPanel threadId={thread.id} />}
    </div>
  );
}

function AiSummary({ summary, actions }: { summary: string; actions: unknown }) {
  const items = parseList<string>(actions);
  return (
    <div className="border-b border-border bg-primary/[0.08] px-6 py-4">
      <div className="a3-label mb-1.5 flex items-center gap-1.5 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        AI Summary
      </div>
      <p className="text-[13px] leading-relaxed text-foreground">{summary}</p>
      {items.length ? (
        <ul className="mt-3 space-y-1">
          {items.map((a, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-foreground/85">
              <span className="font-mono text-primary">→</span> {a}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EscalationBanner({ esc }: { esc: Escalation }) {
  const actions = parseList<string>(esc.recommendedActions);
  return (
    <div className="border-b border-red-500/40 bg-red-500/[0.07] px-6 py-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-red-700 dark:text-red-300">
        <AlertTriangle className="h-4 w-4" />
        <span className="uppercase tracking-wider">Escalation</span>
        <Badge variant="critical">{esc.kind.replace(/_/g, " ")}</Badge>
        <span className="ml-auto font-mono text-[11px] font-bold">RISK {(esc.riskScore * 100).toFixed(0)}%</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{esc.summary}</p>
      {actions.length ? (
        <ul className="mt-3 space-y-1">
          {actions.map((a, i) => (
            <li key={i} className="text-[13px] text-foreground/90">
              <span className="text-red-600 dark:text-red-400">●</span> {a}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DraftPanel({ draft }: { draft: Draft }) {
  const [body, setBody] = useState(draft.bodyText);
  const [pending, setPending] = useState<"approve" | "send" | "reject" | null>(null);

  async function dispatch(action: "approve" | "reject" | "send") {
    setPending(action);
    if (body !== draft.bodyText) {
      await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyText: body }),
      });
    }
    await fetch(`/api/drafts/${draft.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);
    location.reload();
  }

  return (
    <div className="border-t border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="a3-label flex items-center gap-1.5 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI Draft Ready
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Tone: <span className="font-semibold text-foreground">{draft.tone ?? "neutral"}</span></span>
          <span>·</span>
          <span>Confidence: <span className="font-semibold text-primary">{Math.round((draft.confidence ?? 0) * 100)}%</span></span>
        </div>
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="font-mono text-[12px]" />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => dispatch("reject")} disabled={pending !== null}>
          Reject
        </Button>
        <Button variant="outline" size="sm" onClick={() => dispatch("approve")} disabled={pending !== null}>
          Approve only
        </Button>
        <Button size="sm" onClick={() => dispatch("send")} disabled={pending !== null}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Approve &amp; send
        </Button>
      </div>
      {draft.rationale ? (
        <details className="mt-3 text-[11px] text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium hover:text-primary">Why this draft</summary>
          <p className="mt-1.5 leading-relaxed">{draft.rationale}</p>
        </details>
      ) : null}
    </div>
  );
}

function NoDraftPanel({ threadId }: { threadId: string }) {
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    await fetch(`/api/threads/${threadId}/process`, { method: "POST" });
    setPending(false);
  }
  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-5 py-4">
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <MessageSquare className="h-4 w-4" /> No AI draft yet for this thread
      </span>
      <Button size="sm" variant="ghost" onClick={run} disabled={pending}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {pending ? "Triggering…" : "Run A3 AI"}
      </Button>
    </div>
  );
}
