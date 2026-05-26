/**
 * Single source of truth for the methodology slide deck.
 *
 * Used by both:
 *   - src/app/methodology/page.tsx — the interactive web slides
 *   - src/app/methodology/pptx.ts  — the real PowerPoint export
 *
 * Keep this file the *only* place slide copy lives so the web preview and the
 * downloaded .pptx never drift.
 */

export type Slide =
  | { kind: "title"; eyebrow: string; title: string; subtitle: string; meta: string }
  | { kind: "agenda"; title: string; items: string[] }
  | { kind: "split"; eyebrow: string; title: string; lead: string; bullets: { bold: string; body: string }[] }
  | { kind: "pipeline"; step: number; eyebrow: string; title: string; oneLiner: string; body: string; chips: string[] }
  | { kind: "stats"; eyebrow: string; title: string; metrics: { value: string; label: string; note: string }[] }
  | { kind: "timeline"; eyebrow: string; title: string; lead: string; steps: { week: string; title: string; body: string }[] }
  | { kind: "pricing"; eyebrow: string; title: string; tiers: { name: string; price: string; suffix: string; bullets: string[]; highlighted?: boolean }[] }
  | { kind: "cta"; eyebrow: string; title: string; subtitle: string; bullets: string[] };

export const DECK: Slide[] = [
  {
    kind: "title",
    eyebrow: "An A3 Brands Product",
    title: "A3 Inbox AI",
    subtitle: "The methodology behind the GM's triaged inbox.",
    meta: "Methodology v1 · A3 Brands · 2026",
  },
  {
    kind: "agenda",
    title: "Agenda",
    items: [
      "The problem we solve",
      "The 5-step AI pipeline",
      "Architecture & tenant isolation",
      "Security & compliance posture",
      "Onboarding methodology (4-week glide path)",
      "Measured ROI",
      "Pricing & packaging",
    ],
  },
  {
    kind: "split",
    eyebrow: "01 · The problem",
    title: "Dealer leadership inboxes break for four reasons.",
    lead:
      "A typical dealer-principal inbox sees 80–250 emails per day. Volume isn't the problem — composition is.",
    bullets: [
      { bold: "Missed legal exposure", body: "Lemon-law demand letters and BBB complaints sit unanswered past their statutory clock." },
      { bold: "Slow customer response", body: "High-intent sales leads cool off when a reply arrives 36+ hours after the inquiry." },
      { bold: "OEM penalties", body: "Co-op deadlines and certification audits get acknowledged too late to avoid fines." },
      { bold: "Executive bandwidth", body: "The principal spends 90+ minutes per day on triage that AI handles in seconds." },
    ],
  },
  {
    kind: "pipeline",
    step: 1,
    eyebrow: "02 · The pipeline",
    title: "Triage",
    oneLiner: "Decide whether this email warrants any human attention.",
    body:
      "A binary intake call: keep or filter. Roughly 22% of inbound mail at a typical dealer gets filtered out at this stage (newsletter footers, no-reply receipts, vendor blasts matching the tenant's allowlist).",
    chips: ["GPT-4o-mini", "~50 input tokens", "P95 < 800ms"],
  },
  {
    kind: "pipeline",
    step: 2,
    eyebrow: "02 · The pipeline",
    title: "Categorize & prioritize",
    oneLiner: "Tag the email and score it 1–4.",
    body:
      "Hybrid keyword + transformer model assigns one of 15 dealership-specific labels — Sales Lead, OEM, Legal, Customer Complaint, etc. — and a priority score 1–4. The priority is the floor; legal-risk can bump it higher, never lower.",
    chips: ["15 categories", "4 priority tiers", "Floor, not ceiling"],
  },
  {
    kind: "pipeline",
    step: 3,
    eyebrow: "02 · The pipeline",
    title: "Draft",
    oneLiner: "Write the reply in the GM's voice — held for approval.",
    body:
      "The drafting agent writes a one-click-ready reply for inbound that needs one. Voice tuning happens at onboarding from the GM's real prior replies. The agent never sends — every draft sits in PENDING_REVIEW until a human approves.",
    chips: ["GPT-4o", "Held for approval", "Voice-tuned per dealer"],
  },
  {
    kind: "pipeline",
    step: 4,
    eyebrow: "02 · The pipeline",
    title: "Daily digest",
    oneLiner: "A 7AM brief, personalized per role.",
    body:
      "A scheduled job produces a ~150-word morning brief covering open escalations, new high-priority threads, leads waiting for reply, drafts pending review, and the metrics that matter to that user's role. Delivered in-app, by email, and (optional) to Slack.",
    chips: ["7AM local time", "150 words", "In-app · email · Slack"],
  },
  {
    kind: "pipeline",
    step: 5,
    eyebrow: "02 · The pipeline",
    title: "Escalate",
    oneLiner: "Flag legal, HR, fraud, and OEM risk in real time.",
    body:
      "The legal-risk agent runs in parallel with drafting and scans for ten risk patterns: lemon law, attorney references, EEOC/HR, BBB threats, wire fraud, OEM compliance, lawsuit references, exec personal injury, regulatory, churn. Escalations fire before drafts are shown.",
    chips: ["10 risk patterns", "Fires pre-draft", "Recommended actions"],
  },
  {
    kind: "split",
    eyebrow: "03 · Architecture",
    title: "Multi-tenant by design. Auditable by default.",
    lead:
      "Every record at every level of the schema carries an organizationId. Cross-tenant reads are architecturally impossible.",
    bullets: [
      { bold: "Tenant isolation", body: "Every query is scoped by organizationId at the database level via a runtime assertion in requireSession()." },
      { bold: "Agency hierarchy", body: "Resellers are modeled as a parent org with isAgency=true; child tenants stay independent." },
      { bold: "Provider sync", body: "Gmail watch + push (Cloud Pub/Sub); Microsoft Graph change-notifications; 60s delta-sync fallback." },
      { bold: "Append-only audit log", body: "Every state change writes an immutable ActivityLog row. Never edited, never deleted." },
    ],
  },
  {
    kind: "split",
    eyebrow: "04 · Security",
    title: "Posture that passes dealership IT review.",
    lead:
      "A3 never sees email passwords. OAuth tokens stored AES-256-GCM-encrypted. SOC2 Type 2 audit in progress; GDPR-aware retention.",
    bullets: [
      { bold: "OAuth + AES-256-GCM", body: "Tokens encrypted at rest with a per-deployment KMS-issued master key." },
      { bold: "Role-based access control", body: "7 roles from READ_ONLY → DEALER_PRINCIPAL → AGENCY_ADMIN, enforced at every route." },
      { bold: "Human in the loop", body: "No code path lets the AI send a reply without a non-null reviewedById on the draft." },
      { bold: "Retention controls", body: "Configurable retention windows down to 30 days; on-demand JSON + CSV export." },
    ],
  },
  {
    kind: "timeline",
    eyebrow: "05 · Onboarding",
    title: "Four weeks from kickoff to go-live.",
    lead:
      "The onboarding methodology is structured so the AI feels like the GM's reply — not a generic chatbot — by week 4.",
    steps: [
      { week: "Week 1", title: "Connect & observe", body: "Mailboxes connect via OAuth. AI categorizes + escalates; drafting paused. Customer corrects mislabels — those become training signal." },
      { week: "Week 2", title: "Voice tuning", body: "Customer pastes 5–10 of the GM's real prior replies. Drafting agent generates silently for review without sending." },
      { week: "Week 3", title: "Approval workflow", body: "Drafts surface for one-click approval. GM reviews + edits. Escalation routing tuned to the org chart." },
      { week: "Week 4", title: "Go live", body: "Daily 7AM digest activated. All 5 pipeline steps running. 30-day retro scheduled." },
    ],
  },
  {
    kind: "stats",
    eyebrow: "06 · ROI",
    title: "The numbers we instrument from day one.",
    metrics: [
      { value: "8.4 hrs", label: "GM time saved per week", note: "Single rooftop leadership team average" },
      { value: "< 60 sec", label: "Email → AI-drafted reply", note: "P95 latency for the 4-step pipeline" },
      { value: "100%", label: "Legal/HR signals flagged before reply", note: "In customer audits of the prior 90 days" },
      { value: "2.1×", label: "Sales-lead reply rate within 1 hour", note: "vs. control week without drafting" },
    ],
  },
  {
    kind: "pricing",
    eyebrow: "07 · Pricing",
    title: "Per-mailbox pricing. No feature gating.",
    tiers: [
      {
        name: "Single Store",
        price: "$199",
        suffix: "/ mailbox / mo",
        bullets: ["Up to 5 mailboxes", "Real-time Gmail + Microsoft sync", "AI triage, drafts, daily digest", "Escalation alerts"],
      },
      {
        name: "Dealer Group",
        price: "$169",
        suffix: "/ mailbox / mo",
        highlighted: true,
        bullets: ["Up to 25 mailboxes across stores", "Multi-dealership analytics", "Custom escalation routing", "Priority support + onboarding"],
      },
      {
        name: "Agency",
        price: "Talk to us",
        suffix: "",
        bullets: ["Unlimited mailboxes, multi-org", "White-label option for resellers", "Custom AI tuning per voice", "Dedicated success manager"],
      },
    ],
  },
  {
    kind: "cta",
    eyebrow: "Get started",
    title: "Let's run the demo.",
    subtitle: "Click through a real dealer inbox in 60 seconds — sample data, no setup, no commitment.",
    bullets: ["Live demo: principal@a3brands.test", "Methodology white paper available on request", "Pilot programs start within 7 days"],
  },
];
