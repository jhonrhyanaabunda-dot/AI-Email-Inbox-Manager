/**
 * In-memory demo dataset — replaces the Prisma/SQLite layer for the Vercel
 * demo. Every dashboard page reads from this via the stub in db.ts.
 *
 * Data is designed to look like a real dealership-leadership inbox so the
 * demo is defensible in sales conversations: realistic subjects, mixed
 * priorities, escalations on legal threats, AI-drafted replies pending
 * approval.
 *
 * Mutations from the UI (snooze, archive, comment, send-draft) update the
 * in-memory state for the lifetime of a single serverless function
 * instance — they vanish on cold start. Acceptable for a demo.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms);

export const DEMO_ORG = {
  id: "demo-org",
  name: "A3 Brands Demo",
  slug: "a3-brands-demo",
  plan: "GROWTH",
  isAgency: false,
  parentOrgId: null,
  createdAt: ago(180 * DAY),
  updatedAt: ago(1 * DAY),
};

export const DEMO_DEALERSHIP = {
  id: "demo-dealership",
  organizationId: "demo-org",
  name: "A3 Brands Demo Group",
  brand: "Multi-line",
  location: "Austin, TX",
  oemContacts: null,
  createdAt: ago(180 * DAY),
  updatedAt: ago(7 * DAY),
};

export const DEMO_USERS = [
  {
    id: "demo-principal",
    email: "principal@a3brands.test",
    name: "Jordan Reyes",
    image: null,
    hashedPassword: null,
    emailVerified: ago(60 * DAY),
    organizationId: "demo-org",
    role: "DEALER_PRINCIPAL",
    timezone: "America/Chicago",
    lastSeenAt: ago(5 * 60 * 1000),
    createdAt: ago(180 * DAY),
    updatedAt: ago(1 * DAY),
  },
  {
    id: "demo-gm",
    email: "gm@a3brands.test",
    name: "Sam Patel",
    image: null,
    hashedPassword: null,
    emailVerified: ago(60 * DAY),
    organizationId: "demo-org",
    role: "GM",
    timezone: "America/Chicago",
    lastSeenAt: ago(20 * 60 * 1000),
    createdAt: ago(180 * DAY),
    updatedAt: ago(1 * DAY),
  },
  {
    id: "demo-marketing",
    email: "marketing@a3brands.test",
    name: "Devon Walker",
    image: null,
    hashedPassword: null,
    emailVerified: ago(60 * DAY),
    organizationId: "demo-org",
    role: "MARKETING_DIRECTOR",
    timezone: "America/Chicago",
    lastSeenAt: ago(2 * HOUR),
    createdAt: ago(180 * DAY),
    updatedAt: ago(1 * DAY),
  },
];

export const DEMO_MEMBERSHIPS = DEMO_USERS.map((u, i) => ({
  id: `m-${i}`,
  userId: u.id,
  organizationId: u.organizationId,
  dealershipId: "demo-dealership",
  role: u.role,
  createdAt: ago(180 * DAY),
}));

export const DEMO_MAILBOX = {
  id: "demo-mailbox",
  organizationId: "demo-org",
  dealershipId: "demo-dealership",
  ownerUserId: "demo-principal",
  provider: "GMAIL",
  emailAddress: "principal@a3brands.test",
  displayName: "Jordan Reyes",
  status: "ACTIVE",
  lastSyncedAt: ago(3 * 60 * 1000),
  fullSyncCompletedAt: ago(2 * DAY),
  refreshTokenEncrypted: null,
  accessTokenEncrypted: null,
  tokenExpiresAt: null,
  watchExpiration: null,
  historyId: null,
  deltaToken: null,
  errorMessage: null,
  createdAt: ago(60 * DAY),
  updatedAt: ago(3 * 60 * 1000),
};

type ThreadSeed = {
  subject: string;
  snippet: string;
  fromName: string;
  fromEmail: string;
  category: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  priorityScore: number;
  sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
  aiSummary: string;
  actionItems: string[];
  hoursAgo: number;
  status?: string;
  isVip?: boolean;
  hasDraft?: boolean;
  hasEscalation?: boolean;
  escalationKind?: string;
  assignedTo?: string;
};

const SEEDS: ThreadSeed[] = [
  {
    subject: "URGENT: Lemon law demand letter — 2024 F-150 (VIN ...8721)",
    snippet: "Maria Sandoval's attorney is demanding a buyback within 10 business days, citing 3 unsuccessful transmission repairs.",
    fromName: "Daniel Chen, Esq.",
    fromEmail: "dchen@chenautolaw.test",
    category: "LEGAL",
    priority: "CRITICAL",
    priorityScore: 98,
    sentiment: "VERY_NEGATIVE",
    aiSummary: "Lemon law demand on 2024 F-150 — 3 failed transmission repairs. Counsel demands buyback in 10 business days or files suit.",
    actionItems: ["Engage outside counsel by EOD", "Pull all ROs for VIN ...8721", "Do NOT communicate directly with customer"],
    hoursAgo: 4,
    isVip: false,
    hasEscalation: true,
    escalationKind: "LEGAL_THREAT",
    assignedTo: "demo-principal",
  },
  {
    subject: "Q3 co-op funds — reconciliation request",
    snippet: "Ford regional rep wants the Q3 co-op claim package by Friday or the $48K advertising reimbursement is forfeit.",
    fromName: "Patricia Liu (Ford Regional)",
    fromEmail: "regional.rep@ford.test",
    category: "OEM",
    priority: "HIGH",
    priorityScore: 88,
    sentiment: "NEUTRAL",
    aiSummary: "Ford Q3 co-op deadline Friday. $48,200 in reimbursable spend pending. Need invoices + tear-sheets compiled.",
    actionItems: ["Compile Q3 invoices", "Submit via DealerSocket portal", "CC: marketing@"],
    hoursAgo: 7,
    isVip: true,
    hasDraft: true,
    assignedTo: "demo-marketing",
  },
  {
    subject: "Trade-in offer follow-up — 2022 Explorer XLT",
    snippet: "Riley Thompson is comparing our $26,400 offer against CarMax's $28,100. Wants to know if we can match by end of week.",
    fromName: "Riley Thompson",
    fromEmail: "riley.thompson@gmail.test",
    category: "SALES",
    priority: "HIGH",
    priorityScore: 76,
    sentiment: "POSITIVE",
    aiSummary: "Customer comparing trade-in offers. CarMax bid $1,700 higher. Customer is open if we can match or beat by Friday.",
    actionItems: ["Re-appraise Explorer XLT", "Counter at $27,500 + extended warranty", "Reply by Thursday 5pm"],
    hoursAgo: 11,
    hasDraft: true,
    assignedTo: "demo-gm",
  },
  {
    subject: "Service complaint — 'They charged me for tires I never approved'",
    snippet: "Customer Janet Kowalski says service advisor swapped 4 tires without verbal authorization. $1,250 dispute.",
    fromName: "Janet Kowalski",
    fromEmail: "jkowalski@kowalski-cpa.test",
    category: "COMPLAINT",
    priority: "HIGH",
    priorityScore: 81,
    sentiment: "VERY_NEGATIVE",
    aiSummary: "Unauthorized tire installation claim. Customer is a CPA with strong paper trail. Risk: chargeback + Yelp/Google review.",
    actionItems: ["Pull RO + signature record", "Refund authorization decision", "Escalate to Fixed Ops director"],
    hoursAgo: 9,
    hasEscalation: true,
    escalationKind: "CUSTOMER_THREAT",
  },
  {
    subject: "Confidential — board prep deck for Q3 review",
    snippet: "Kelly from HQ needs the Q3 dealership performance deck by Sunday EOD for Monday's executive review.",
    fromName: "Kelly Munoz (A3 Brands HQ)",
    fromEmail: "kelly@a3brands.test",
    category: "INTERNAL",
    priority: "HIGH",
    priorityScore: 84,
    sentiment: "NEUTRAL",
    aiSummary: "Executive review deck due Sunday. Need YTD revenue, gross/unit, F&I PVR, CSI scores, fixed-ops absorption.",
    actionItems: ["Pull DMS reports through 9/30", "Marketing pulls campaign attribution", "Final deck Sunday 9pm"],
    hoursAgo: 14,
    isVip: true,
    assignedTo: "demo-principal",
  },
  {
    subject: "Ford EV certification — facility imaging audit failed",
    snippet: "Q3 facility imaging audit incomplete. $5K monthly penalty starts next billing cycle if not remediated this week.",
    fromName: "Ford Brand Standards",
    fromEmail: "standards@ford.test",
    category: "OEM",
    priority: "HIGH",
    priorityScore: 79,
    sentiment: "NEGATIVE",
    aiSummary: "Ford EV cert audit found 3 imaging deficiencies. Remediation deadline is 7 days or $5K/mo penalty kicks in.",
    actionItems: ["Pull audit findings doc", "Schedule signage vendor", "Photo evidence by EOW"],
    hoursAgo: 18,
    assignedTo: "demo-gm",
  },
  {
    subject: "Compliments to your service team!",
    snippet: "Wanted to drop a note about how great Maria S in service was during my appointment yesterday. 5 stars all around.",
    fromName: "Antonio Reyes",
    fromEmail: "antonio.r@example.test",
    category: "CUSTOMER",
    priority: "LOW",
    priorityScore: 28,
    sentiment: "VERY_POSITIVE",
    aiSummary: "Positive feedback on service advisor Maria S. Customer indicates they'll leave a 5-star Google review.",
    actionItems: ["Forward to Fixed Ops for team recognition", "Reply with thanks + service coupon"],
    hoursAgo: 22,
    hasDraft: true,
  },
  {
    subject: "Halloween campaign concept — kids trick-or-treat tie-in",
    snippet: "Devon's proposal: $89 oil + tire rotation, kids get free trick-or-treat bag. Budget request $4,800.",
    fromName: "Devon Walker",
    fromEmail: "marketing@a3brands.test",
    category: "INTERNAL",
    priority: "NORMAL",
    priorityScore: 52,
    sentiment: "POSITIVE",
    aiSummary: "October service campaign concept. $4,800 spend. Geo-targeted to lapsed service customers. Requires GP approval.",
    actionItems: ["Review creative draft", "Approve or counter on budget", "Reply by Thursday"],
    hoursAgo: 26,
    assignedTo: "demo-marketing",
  },
  {
    subject: "Window sticker copy request — 2023 Explorer (purchased August)",
    snippet: "Hi, my insurance is asking for the original window sticker for the Explorer I bought in August. Can you email a copy?",
    fromName: "Priya Krishnan",
    fromEmail: "priya.k@example.test",
    category: "CUSTOMER",
    priority: "NORMAL",
    priorityScore: 44,
    sentiment: "NEUTRAL",
    aiSummary: "Customer needs original window sticker for insurance. Easy turnaround — pull from DMS deal jacket.",
    actionItems: ["Pull deal jacket", "Email Monroney label PDF"],
    hoursAgo: 30,
    hasDraft: true,
  },
  {
    subject: "Service department staffing — Tomas Rivera application",
    snippet: "HR forwarded an inbound application for the Service Advisor opening. Looks strong — 6 yrs Toyota experience.",
    fromName: "Aisha Brooks (HR)",
    fromEmail: "hr@a3brands.test",
    category: "INTERNAL",
    priority: "NORMAL",
    priorityScore: 48,
    sentiment: "POSITIVE",
    aiSummary: "Service Advisor candidate Tomas Rivera. 6 years at Toyota, strong CSI. HR recommends phone screen.",
    actionItems: ["Schedule phone screen", "Forward to Fixed Ops director"],
    hoursAgo: 34,
  },
  {
    subject: "Newsletter — weekly OEM compliance digest",
    snippet: "This week's brand-standards updates from Ford. Imaging refresh deadlines, new digital signage requirements.",
    fromName: "Dealer Compliance Weekly",
    fromEmail: "noreply@dealercomp.test",
    category: "NEWSLETTER",
    priority: "LOW",
    priorityScore: 12,
    sentiment: "NEUTRAL",
    aiSummary: "Routine OEM compliance newsletter. No action items.",
    actionItems: [],
    hoursAgo: 40,
    status: "ARCHIVED",
  },
  {
    subject: "Re: Q3 employee performance review template",
    snippet: "Per your request, here's the updated 1-page performance review template HR rolled out last quarter.",
    fromName: "Aisha Brooks (HR)",
    fromEmail: "hr@a3brands.test",
    category: "INTERNAL",
    priority: "LOW",
    priorityScore: 22,
    sentiment: "NEUTRAL",
    aiSummary: "HR template attached. No action needed unless reviews are due.",
    actionItems: [],
    hoursAgo: 50,
    status: "DONE",
  },
  {
    subject: "Toyota Financial — flooring audit notice",
    snippet: "TFS auditor will be on-site Tuesday 10/15 for flooring audit. Please have all titled inventory ready.",
    fromName: "TFS Regional Manager",
    fromEmail: "rep@toyotafinancial.test",
    category: "OEM",
    priority: "HIGH",
    priorityScore: 72,
    sentiment: "NEUTRAL",
    aiSummary: "Flooring audit scheduled 10/15. Pre-audit reconciliation required.",
    actionItems: ["Pre-reconcile titled inventory", "Pull MSO files", "Block calendar for auditor"],
    hoursAgo: 56,
    isVip: true,
  },
  {
    subject: "F&I — extended warranty rate change effective Nov 1",
    snippet: "Heads up: Zurich is updating service contract rates Nov 1. New rate cards attached.",
    fromName: "Zurich F&I",
    fromEmail: "fi@zurich.test",
    category: "VENDOR",
    priority: "NORMAL",
    priorityScore: 38,
    sentiment: "NEUTRAL",
    aiSummary: "Service contract rate change Nov 1. F&I dept needs to update menu pricing.",
    actionItems: ["Update F&I menu", "Brief F&I team"],
    hoursAgo: 62,
  },
  {
    subject: "Snoozed: Year-end inventory plan",
    snippet: "Reminder to circle back on the year-end inventory order.",
    fromName: "Jordan Reyes",
    fromEmail: "principal@a3brands.test",
    category: "INTERNAL",
    priority: "NORMAL",
    priorityScore: 40,
    sentiment: "NEUTRAL",
    aiSummary: "Self-reminder to revisit year-end inventory planning.",
    actionItems: ["Finalize order with GM"],
    hoursAgo: 100,
    status: "SNOOZED",
  },
];

export const DEMO_THREADS = SEEDS.map((s, i) => ({
  id: `thread-${i + 1}`,
  organizationId: "demo-org",
  mailboxId: "demo-mailbox",
  subject: s.subject,
  snippet: s.snippet,
  fromName: s.fromName,
  fromEmail: s.fromEmail,
  category: s.category,
  priority: s.priority,
  priorityScore: s.priorityScore,
  sentiment: s.sentiment,
  aiSummary: s.aiSummary,
  actionItems: JSON.stringify(s.actionItems),
  status: s.status ?? "INBOX",
  isVip: s.isVip ?? false,
  isVendor: s.category === "VENDOR" || s.category === "NEWSLETTER",
  isRead: i > 5, // first 6 are unread (highest priority)
  isStarred: false,
  isSpam: false,
  isMuted: false,
  isPinned: false,
  externalId: `gmail-${i + 1}`,
  threadKey: `key-${i + 1}`,
  participants: JSON.stringify([
    { name: s.fromName, email: s.fromEmail, role: "from" },
    { name: "Jordan Reyes", email: "principal@a3brands.test", role: "to" },
  ]),
  participantCount: 2,
  emailCount: 1,
  messageCount: 1,
  hasAttachment: false,
  firstMessageAt: ago(s.hoursAgo * HOUR),
  lastMessageAt: ago(s.hoursAgo * HOUR),
  snoozedUntil: s.status === "SNOOZED" ? new Date(Date.now() + 2 * DAY) : null,
  archivedAt: s.status === "ARCHIVED" ? ago(s.hoursAgo * HOUR) : null,
  completedAt: s.status === "DONE" ? ago(s.hoursAgo * HOUR) : null,
  createdAt: ago(s.hoursAgo * HOUR),
  updatedAt: ago(s.hoursAgo * HOUR),
  labels: [] as Array<{ label: { id?: string; name: string } }>,
  _seed: s, // private — used by db.ts stub to derive related records
}));

export const DEMO_DRAFTS = DEMO_THREADS.filter((t) => t._seed.hasDraft).map((t, i) => ({
  id: `draft-${i + 1}`,
  organizationId: "demo-org",
  threadId: t.id,
  emailId: `email-${t.id}`,
  status: "PENDING_REVIEW",
  body: `Hi ${t.fromName.split(" ")[0]},\n\nThanks for reaching out. ${t._seed.actionItems[0] ?? "We'll follow up shortly."}\n\nBest,\nJordan`,
  subject: `Re: ${t.subject}`,
  tone: "Professional",
  confidence: 0.78 + (i % 4) * 0.05,
  model: "gpt-4o",
  generatedAt: ago(t._seed.hoursAgo * HOUR - 5 * 60 * 1000),
  approvedAt: null,
  sentAt: null,
  rejectedAt: null,
  rejectedReason: null,
  createdAt: ago(t._seed.hoursAgo * HOUR - 5 * 60 * 1000),
  updatedAt: ago(t._seed.hoursAgo * HOUR - 5 * 60 * 1000),
}));

export const DEMO_ESCALATIONS = DEMO_THREADS.filter((t) => t._seed.hasEscalation).map((t, i) => {
  // Owner derived from the thread's assignee where present, so the
  // escalation card and the inbox row stay consistent.
  const ownerId = t._seed.assignedTo ?? null;
  const owner = ownerId ? DEMO_USERS.find((u) => u.id === ownerId) ?? null : null;
  return {
    id: `esc-${i + 1}`,
    organizationId: "demo-org",
    threadId: t.id,
    thread: { id: t.id, subject: t.subject, priority: t.priority, category: t.category },
    assigneeId: owner?.id ?? null,
    assignee: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    kind: t._seed.escalationKind ?? "LEGAL_THREAT",
    severity: t._seed.priority === "CRITICAL" ? "CRITICAL" : "HIGH",
    status: i === 0 ? "OPEN" : "ACKNOWLEDGED",
    riskScore: t._seed.priority === "CRITICAL" ? 0.94 : 0.78,
    summary: t._seed.aiSummary,
    reason: t._seed.aiSummary,
    notifiedAt: ago(t._seed.hoursAgo * HOUR),
    acknowledgedAt: i === 0 ? null : ago(t._seed.hoursAgo * HOUR - 30 * 60 * 1000),
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNotes: null,
    createdAt: ago(t._seed.hoursAgo * HOUR),
    updatedAt: ago(t._seed.hoursAgo * HOUR - 30 * 60 * 1000),
  };
});

/**
 * One briefing per day for the past 7 days. The "for today" briefing (i=0)
 * has the richest content; older days fade to lighter summaries.
 */
export const DEMO_BRIEFINGS = Array.from({ length: 7 }, (_, i) => {
  const forDate = ago(i * DAY);
  // forDate is set to 7am of that day so the briefing feels like the real
  // 7am-cron output.
  forDate.setHours(7, 0, 0, 0);

  const isToday = i === 0;
  const summary = isToday
    ? "Two items need your eyes this morning: the F-150 lemon-law thread (counsel demands buyback in 10 business days) and the Ford Q3 co-op deadline Friday — $48K at stake. Devon's Halloween campaign concept is ready for a yes/no. Riley Thompson's Explorer trade-in is comparing offers; AI drafted a $27,500 counter."
    : i === 1
      ? "Yesterday: Q3 facility imaging audit notice from Ford — $5K/mo penalty risk if not remediated this week. Tomas Rivera Service Advisor application looks strong; routed to HR. Light email day overall."
      : `${20 - i} threads triaged. ${(i % 3) + 1} escalation${(i % 3) + 1 === 1 ? "" : "s"} flagged. ${
          (i % 4) + 2
        } AI drafts shipped after your approval. Top discussion: ${
          ["Ford EV cert audit", "Toyota flooring audit", "Co-op funds", "Service complaint", "VIP intro from Kelly"][i % 5]
        }.`;

  return {
    id: `brief-${i + 1}`,
    organizationId: "demo-org",
    userId: "demo-principal",
    forDate,
    summary,
    // topThreads is JSON-stringified for SQLite-compat; demo pages parse it.
    topThreads: JSON.stringify(
      DEMO_THREADS.filter((t) => !["NEWSLETTER", "DONE"].includes(t.status))
        .slice(0, 3)
        .map((t) => ({
          threadId: t.id,
          subject: t.subject,
          priority: t.priority,
          reason:
            t.priority === "CRITICAL"
              ? "Time-critical legal exposure"
              : t.priority === "HIGH"
                ? "Action needed today"
                : "Worth your eyes",
        })),
    ),
    metrics: JSON.stringify({
      threadsTriaged: 18 + ((i * 5) % 14),
      drafts: (i % 4) + 2,
      escalations: (i % 3) + 1,
    }),
    threadsTriaged: 18 + ((i * 5) % 14),
    openEscalations: i === 0 ? 2 : (i % 3) + 1,
    newLeads: i === 0 ? 4 : (i % 4) + 1,
    pendingDrafts: i === 0 ? 4 : (i % 4) + 2,
    aiReplyRate: 0.72 + ((i * 0.03) % 0.2),
    modelUsed: i === 0 ? "gpt-4o" : "gpt-4o-mini",
    createdAt: forDate,
    updatedAt: forDate,
  };
});

export const DEMO_COMMENTS = [
  {
    id: "c-1",
    threadId: "thread-1",
    userId: "demo-gm",
    body: "Pulled all ROs for this VIN. Three different techs touched it, root cause may be valve body. Sending you the file.",
    createdAt: ago(22 * HOUR),
    updatedAt: ago(22 * HOUR),
  },
  {
    id: "c-2",
    threadId: "thread-1",
    userId: "demo-principal",
    body: "Talked to outside counsel. We do NOT acknowledge in writing yet. I'm calling Maria personally at 2pm.",
    createdAt: ago(21 * HOUR),
    updatedAt: ago(21 * HOUR),
  },
  {
    id: "c-3",
    threadId: "thread-3",
    userId: "demo-gm",
    body: "Pre-approved Riley last spring on a different deal — financing should fly.",
    createdAt: ago(4 * HOUR),
    updatedAt: ago(4 * HOUR),
  },
];

export const DEMO_ASSIGNMENTS = DEMO_THREADS.filter((t) => t._seed.assignedTo).map((t, i) => ({
  id: `a-${i + 1}`,
  threadId: t.id,
  userId: t._seed.assignedTo!,
  assignedBy: "demo-principal",
  createdAt: ago(t._seed.hoursAgo * HOUR),
}));

export const DEMO_EMAILS = DEMO_THREADS.map((t, i) => ({
  id: `email-${t.id}`,
  threadId: t.id,
  mailboxId: "demo-mailbox",
  externalId: `gmail-msg-${i + 1}`,
  direction: "INBOUND",
  fromName: t.fromName,
  fromEmail: t.fromEmail,
  toJson: JSON.stringify([{ name: "Jordan Reyes", email: "principal@a3brands.test" }]),
  ccJson: "[]",
  bccJson: "[]",
  subject: t.subject,
  bodyText: `${t.snippet}\n\n[Demo email — content abbreviated for the showcase.]`,
  bodyHtml: null,
  snippet: t.snippet,
  receivedAt: t.lastMessageAt,
  sentAt: null,
  hasAttachments: false,
  rawHeaders: null,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
}));

export const DEMO_LABELS = ["Important", "Customer", "OEM", "Legal", "VIP", "Newsletter", "Service", "Sales"].map(
  (name, i) => ({
    id: `label-${i + 1}`,
    organizationId: "demo-org",
    name,
    color: null,
    isSystem: true,
    createdAt: ago(180 * DAY),
    updatedAt: ago(180 * DAY),
  }),
);

export const DEMO_WORKFLOWS = [
  {
    id: "wf-1",
    organizationId: "demo-org",
    name: "Legal threats → escalate + assign principal",
    description: "Auto-escalate any email tagged LEGAL with sentiment <= NEGATIVE",
    enabled: true,
    trigger: "email.received",
    conditionsJson: JSON.stringify({ category: "LEGAL", sentiment_lte: "NEGATIVE" }),
    actionsJson: JSON.stringify([{ type: "escalate", severity: "CRITICAL" }, { type: "assign", userId: "demo-principal" }]),
    runCount: 12,
    lastRunAt: ago(4 * HOUR),
    createdAt: ago(45 * DAY),
    updatedAt: ago(4 * HOUR),
  },
  {
    id: "wf-2",
    organizationId: "demo-org",
    name: "OEM co-op deadlines → assign marketing",
    description: "Route Ford/Toyota co-op deadline emails to marketing director",
    enabled: true,
    trigger: "email.received",
    conditionsJson: JSON.stringify({ fromDomain: ["ford.test", "toyota.test"], keywords: ["co-op", "deadline"] }),
    actionsJson: JSON.stringify([{ type: "assign", userId: "demo-marketing" }, { type: "label", labelId: "label-3" }]),
    runCount: 4,
    lastRunAt: ago(7 * HOUR),
    createdAt: ago(45 * DAY),
    updatedAt: ago(7 * HOUR),
  },
  {
    id: "wf-3",
    organizationId: "demo-org",
    name: "Newsletters → archive automatically",
    description: "Auto-archive marketing newsletters from known vendors",
    enabled: true,
    trigger: "email.received",
    conditionsJson: JSON.stringify({ category: "NEWSLETTER" }),
    actionsJson: JSON.stringify([{ type: "archive" }]),
    runCount: 47,
    lastRunAt: ago(40 * HOUR),
    createdAt: ago(45 * DAY),
    updatedAt: ago(40 * HOUR),
  },
];

export const DEMO_API_TOKENS: any[] = [];

// ─── Attach to-many relations onto each thread row ─────────────────────────
// The stub's `include` handling just reads pre-populated arrays off the row,
// so we mutate each thread in place to glue on its emails / drafts /
// escalations / assignments / comments. Cheap — single pass, demo-sized data.
for (const t of DEMO_THREADS as any[]) {
  t.emails = DEMO_EMAILS.filter((e) => e.threadId === t.id);
  t.drafts = DEMO_DRAFTS.filter((d) => d.threadId === t.id);
  t.escalations = DEMO_ESCALATIONS.filter((e) => e.threadId === t.id);
  t.assignments = DEMO_ASSIGNMENTS.filter((a) => a.threadId === t.id).map((a) => ({
    ...a,
    user: DEMO_USERS.find((u) => u.id === a.userId) ?? null,
  }));
  t.comments = DEMO_COMMENTS.filter((c) => c.threadId === t.id).map((c) => ({
    ...c,
    user: DEMO_USERS.find((u) => u.id === c.userId) ?? null,
  }));
  // Precomputed indicator fields the ThreadList uses to show "draft pending"
  // / "escalation open" / "N comments" dots without a separate query per row.
  t.hasPendingDraft = t.drafts.some((d: any) => d.status === "PENDING_REVIEW");
  t.openEscalationCount = t.escalations.filter(
    (e: any) => e.status === "OPEN" || e.status === "ACKNOWLEDGED",
  ).length;
  t.commentCount = t.comments.length;
  // aiActionItems / followUpAt aren't on the original Prisma schema but the
  // thread-detail page reads them — provide safe defaults.
  t.aiActionItems = JSON.parse(t.actionItems ?? "[]");
  t.followUpAt = null;
}
for (const d of DEMO_DRAFTS as any[]) {
  d.bodyText = d.body;
  d.toEmails = JSON.stringify([
    (DEMO_THREADS.find((t) => t.id === d.threadId) as any)?.fromEmail,
  ]);
  d.rationale = "Drafted in the GM's voice. Tone: professional, concise, action-oriented.";
}
for (const e of DEMO_ESCALATIONS as any[]) {
  e.recommendedActions = JSON.stringify([
    "Engage outside counsel",
    "Do not respond directly to customer",
    "Internal escalation to dealer principal",
  ]);
}
