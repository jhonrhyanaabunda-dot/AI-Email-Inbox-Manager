"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Send, AlertTriangle, MessageSquare, Clock, Bell, Archive,
  CheckCircle2, UserPlus, Tag, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityBadge, CategoryBadge } from "./priority-badge";
import { relativeTime } from "@/lib/utils";
import { toast } from "sonner";

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
  status: string;
}
interface Assignment {
  id: string;
  user: { id: string; name: string | null; email: string };
}
interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}
interface Teammate {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function ThreadView({
  thread,
  emails,
  draft,
  escalations,
  assignments,
  comments,
  teammates,
  currentUserId,
}: {
  thread: {
    id: string;
    subject: string | null;
    priority: string | null;
    category: string | null;
    aiSummary: string | null;
    aiActionItems: unknown;
    isVip: boolean;
    snoozedUntil: string | null;
    followUpAt: string | null;
    labels: string[];
  };
  emails: Email[];
  draft: Draft | null;
  escalations: Escalation[];
  assignments: Assignment[];
  comments: Comment[];
  teammates: Teammate[];
  currentUserId: string;
}) {
  const openEsc = escalations[0];
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 md:px-6 md:py-5">
        <a
          href="/inbox"
          className="mb-2 inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary md:hidden"
        >
          ← Back to inbox
        </a>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="a3-label mb-1 text-a3-fog">Thread</div>
            <h1 className="text-[18px] font-extrabold leading-snug tracking-tight text-foreground md:text-[22px]">
              {thread.subject || "(no subject)"}
            </h1>
            {thread.labels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {thread.labels.map((l) => (
                  <Badge key={l} variant="outline" className="font-medium">
                    <Tag className="mr-1 h-2.5 w-2.5" />
                    {l}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {thread.isVip ? <Badge>VIP</Badge> : null}
            <PriorityBadge priority={thread.priority} />
            <CategoryBadge category={thread.category} />
          </div>
        </div>

        {/* Action bar — assignment, snooze, follow-up, archive */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <AssignmentControl
            threadId={thread.id}
            assignments={assignments}
            teammates={teammates}
            onChange={refresh}
          />
          <SnoozeControl
            threadId={thread.id}
            snoozedUntil={thread.snoozedUntil}
            followUpAt={thread.followUpAt}
            onChange={refresh}
          />
          <StatusControl threadId={thread.id} onChange={refresh} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {openEsc ? <EscalationBanner esc={openEsc} onChange={refresh} /> : null}
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

        {/* ── Internal Comments ──────────────────────────────────────── */}
        <InternalComments
          threadId={thread.id}
          comments={comments}
          currentUserId={currentUserId}
          onChange={refresh}
        />
      </div>

      {draft ? <DraftPanel draft={draft} /> : <NoDraftPanel threadId={thread.id} />}
    </div>
  );
}

// ─── Assignment ─────────────────────────────────────────────────────────────

function AssignmentControl({
  threadId,
  assignments,
  teammates,
  onChange,
}: {
  threadId: string;
  assignments: Assignment[];
  teammates: Teammate[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function assign(userId: string) {
    setOpen(false);
    const res = await fetch(`/api/threads/${threadId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast.success("Assigned");
      onChange();
    } else {
      toast.error("Could not assign");
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="h-8">
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        {assignments.length === 0 ? (
          <span className="text-muted-foreground">Assign</span>
        ) : (
          <span className="flex items-center gap-1">
            {assignments.slice(0, 3).map((a) => (
              <Avatar key={a.id} className="h-5 w-5 ring-1 ring-card">
                <AvatarFallback className="bg-primary/15 text-[9px] font-bold text-primary">
                  {(a.user.name ?? a.user.email).split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            <span className="ml-1 text-[12px] font-medium text-foreground">
              {assignments.length === 1
                ? (assignments[0].user.name ?? assignments[0].user.email).split(" ")[0]
                : `${assignments.length} assignees`}
            </span>
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-border bg-popover p-1 shadow-raised">
          <div className="a3-label px-2 py-1.5 text-a3-fog">Assign to</div>
          {teammates.map((t) => {
            const already = assignments.some((a) => a.user.id === t.id);
            return (
              <button
                key={t.id}
                disabled={already}
                onClick={() => assign(t.id)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-secondary disabled:opacity-50"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                    {(t.name ?? t.email).split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{t.name ?? t.email}</div>
                  <div className="text-[10px] uppercase tracking-wider text-a3-fog">{t.role.replace(/_/g, " ").toLowerCase()}</div>
                </div>
                {already && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Snooze + Follow-up ─────────────────────────────────────────────────────

function SnoozeControl({
  threadId,
  snoozedUntil,
  followUpAt,
  onChange,
}: {
  threadId: string;
  snoozedUntil: string | null;
  followUpAt: string | null;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function setSnooze(hours: number | null) {
    setOpen(false);
    const snoozedUntil = hours === null ? null : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const status = hours === null ? "INBOX" : "SNOOZED";
    const res = await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snoozedUntil, status }),
    });
    if (res.ok) {
      toast.success(hours === null ? "Un-snoozed" : `Snoozed ${hours}h`);
      onChange();
    } else toast.error("Snooze failed");
  }

  async function setFollowup(hours: number | null) {
    setOpen(false);
    const followUpAt = hours === null ? null : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const res = await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt }),
    });
    if (res.ok) {
      toast.success(hours === null ? "Reminder cleared" : `Reminder set ${hours}h`);
      onChange();
    } else toast.error("Reminder failed");
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="h-8">
        {snoozedUntil ? (
          <>
            <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-medium">Snoozed · {relativeTime(snoozedUntil).replace(" ago", "")}</span>
          </>
        ) : followUpAt ? (
          <>
            <Bell className="mr-1.5 h-3.5 w-3.5 text-primary" />
            <span className="text-[12px] font-medium">Reminder · {relativeTime(followUpAt).replace(" ago", "")}</span>
          </>
        ) : (
          <>
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            <span className="text-muted-foreground">Snooze</span>
          </>
        )}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-raised">
          <div className="a3-label px-2 py-1.5 text-a3-fog">Snooze until</div>
          {[
            ["Later today", 4],
            ["Tomorrow morning", 16],
            ["This weekend", 48],
            ["Next week", 168],
          ].map(([label, hours]) => (
            <button
              key={label}
              onClick={() => setSnooze(hours as number)}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-secondary"
            >
              <span>{label}</span>
              <span className="font-mono text-[10px] text-a3-fog">+{hours}h</span>
            </button>
          ))}
          {snoozedUntil && (
            <button
              onClick={() => setSnooze(null)}
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-primary hover:bg-secondary"
            >
              Un-snooze
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <div className="a3-label px-2 py-1.5 text-a3-fog">Remind me</div>
          {[
            ["In 1 hour", 1],
            ["In 4 hours", 4],
            ["Tomorrow", 24],
          ].map(([label, hours]) => (
            <button
              key={label}
              onClick={() => setFollowup(hours as number)}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-secondary"
            >
              <span>{label}</span>
              <span className="font-mono text-[10px] text-a3-fog">+{hours}h</span>
            </button>
          ))}
          {followUpAt && (
            <button
              onClick={() => setFollowup(null)}
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-primary hover:bg-secondary"
            >
              Clear reminder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Status (archive / done) ────────────────────────────────────────────────

function StatusControl({ threadId, onChange }: { threadId: string; onChange: () => void }) {
  async function patch(status: "ARCHIVED" | "DONE" | "INBOX") {
    const res = await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === "ARCHIVED" ? "Archived" : status === "DONE" ? "Marked done" : "Returned to inbox");
      onChange();
    } else toast.error("Action failed");
  }
  return (
    <div className="ml-auto flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => patch("DONE")} className="h-8" title="Mark done">
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
        <span className="text-[12px]">Done</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => patch("ARCHIVED")} className="h-8" title="Archive">
        <Archive className="mr-1.5 h-3.5 w-3.5" />
        <span className="text-[12px]">Archive</span>
      </Button>
    </div>
  );
}

// ─── AI Summary ─────────────────────────────────────────────────────────────

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

// ─── Escalation banner w/ inline ack/resolve ────────────────────────────────

function EscalationBanner({ esc, onChange }: { esc: Escalation; onChange: () => void }) {
  const actions = parseList<string>(esc.recommendedActions);
  const [pending, setPending] = useState<string | null>(null);

  async function act(status: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED") {
    setPending(status);
    const res = await fetch(`/api/escalations/${esc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(null);
    if (res.ok) {
      toast.success(status === "RESOLVED" ? "Marked resolved" : status === "ACKNOWLEDGED" ? "Acknowledged" : "Dismissed");
      onChange();
    } else toast.error("Action failed");
  }

  return (
    <div className="border-b border-red-500/40 bg-red-500/[0.07] px-6 py-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-red-700 dark:text-red-300">
        <AlertTriangle className="h-4 w-4" />
        <span className="uppercase tracking-wider">Escalation</span>
        <Badge variant="critical">{esc.kind.replace(/_/g, " ")}</Badge>
        <Badge variant={esc.status === "OPEN" ? "destructive" : "secondary"}>{esc.status.toLowerCase()}</Badge>
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
      <div className="mt-3 flex gap-2">
        {esc.status === "OPEN" && (
          <Button variant="outline" size="sm" onClick={() => act("ACKNOWLEDGED")} disabled={!!pending}>
            Acknowledge
          </Button>
        )}
        {esc.status !== "RESOLVED" && esc.status !== "DISMISSED" && (
          <Button size="sm" onClick={() => act("RESOLVED")} disabled={!!pending}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Mark resolved
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => act("DISMISSED")} disabled={!!pending}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ─── Internal comments ──────────────────────────────────────────────────────

function InternalComments({
  threadId,
  comments,
  currentUserId,
  onChange,
}: {
  threadId: string;
  comments: Comment[];
  currentUserId: string;
  onChange: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const res = await fetch(`/api/threads/${threadId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setPending(false);
    if (res.ok) {
      setBody("");
      toast.success("Comment posted");
      onChange();
    } else toast.error("Could not post comment");
  }

  return (
    <div className="border-t border-border bg-secondary/40 px-6 py-5">
      <div className="a3-label mb-3 flex items-center gap-1.5 text-a3-fog">
        <MessageSquare className="h-3.5 w-3.5" />
        Internal notes
        {comments.length > 0 && <span className="text-foreground">· {comments.length}</span>}
      </div>
      {comments.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => {
            const initials = (c.user.name ?? c.user.email)
              .split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
            return (
              <li key={c.id} className="flex gap-3 text-[13px]">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-foreground">{c.user.name ?? c.user.email}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 leading-relaxed text-foreground/90">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add an internal note — your team sees this, the customer doesn't."
          className="text-[13px]"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending || !body.trim()}>
            {pending ? "Posting…" : "Post note"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Draft panel ────────────────────────────────────────────────────────────

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
    const res = await fetch(`/api/drafts/${draft.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);
    if (res.ok) {
      toast.success(action === "send" ? "Sent" : action === "approve" ? "Approved" : "Rejected");
      setTimeout(() => location.reload(), 300);
    } else {
      toast.error("Action failed");
    }
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
    const res = await fetch(`/api/threads/${threadId}/process`, { method: "POST" });
    setPending(false);
    if (res.ok) {
      toast.success("A3 AI ran — refreshing…");
      setTimeout(() => location.reload(), 600);
    } else toast.error("AI run failed");
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
