import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Sparkles,
  Layers,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Inbox,
  Building2,
  Mail,
  Lock,
  GitBranch,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Methodology — A3 Inbox AI",
  description:
    "How A3 Inbox AI reads, triages, drafts, and escalates dealership leadership email. The full pipeline, architecture, security model, ROI, and onboarding methodology.",
};

const SECTIONS = [
  { id: "overview", n: "01", title: "Executive overview" },
  { id: "problem", n: "02", title: "The problem we solve" },
  { id: "pipeline", n: "03", title: "The 5-step AI pipeline" },
  { id: "architecture", n: "04", title: "Architecture &amp; data model" },
  { id: "security", n: "05", title: "Security &amp; compliance" },
  { id: "onboarding", n: "06", title: "Onboarding methodology" },
  { id: "roi", n: "07", title: "Measured ROI" },
  { id: "pricing", n: "08", title: "Pricing &amp; packaging" },
  { id: "faq", n: "09", title: "FAQ" },
];

export default function MethodologyPage() {
  const today = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="methodology-doc min-h-screen bg-background text-foreground">
      {/* Web-only top bar — hidden in print */}
      <nav className="no-print sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-a3-content items-center gap-3 px-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to product page
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="status" className="border-primary/40 bg-primary/10 text-primary">
              Methodology v1
            </Badge>
            <PrintButton />
          </div>
        </div>
      </nav>

      {/* ─── COVER PAGE ─── */}
      <section className="cover-page mx-auto max-w-a3-content px-6 py-16 md:px-12 md:py-24">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground shadow-emerald">
          <span className="text-[14px] font-black tracking-tight">A3</span>
        </div>
        <div className="a3-label mt-6 text-primary">An A3 Brands Product</div>
        <h1
          className="mt-3 max-w-3xl text-foreground"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, letterSpacing: "0.005em", fontWeight: 800 }}
        >
          A3 Inbox AI
          <br />
          <span className="text-primary">Methodology</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[24px] text-muted-foreground">
          A complete walkthrough of how A3 Inbox AI reads, triages, drafts, and escalates email
          across dealership leadership — the AI pipeline, the data architecture, the security
          posture, the onboarding playbook, and the measured ROI.
        </p>

        <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-y-4 text-[12px] md:grid-cols-3">
          <KV k="Document" v="Methodology &amp; Architecture White Paper" />
          <KV k="Version" v="1.0" />
          <KV k="Date" v={today} />
          <KV k="Audience" v="Dealer principals, GMs, CTOs, IT leadership" />
          <KV k="Author" v="A3 Brands · Inbox AI team" />
          <KV k="Classification" v="Customer-facing" />
        </dl>

        <div className="mt-10 hidden md:block">
          <p className="text-[11px] text-a3-fog">
            <em>This document is also available as a printable PDF. Use the &quot;Download PDF&quot;
            button or your browser&apos;s print menu and select &quot;Save as PDF&quot;.</em>
          </p>
        </div>
      </section>

      {/* ─── TABLE OF CONTENTS ─── */}
      <section className="page-break mx-auto max-w-a3-content px-6 py-12 md:px-12 md:py-16">
        <div className="a3-label mb-4 text-primary">Contents</div>
        <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">Table of contents</h2>
        <ol className="space-y-2 border-t border-border">
          {SECTIONS.map((s) => (
            <li key={s.id} className="border-b border-border">
              <a
                href={`#${s.id}`}
                className="flex items-baseline gap-4 py-3 text-[14px] transition-colors hover:bg-secondary/50"
              >
                <span className="w-8 font-mono text-[11px] font-bold text-primary">{s.n}</span>
                <span
                  className="flex-1 font-medium text-foreground"
                  dangerouslySetInnerHTML={{ __html: s.title }}
                />
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── 01 EXECUTIVE OVERVIEW ─── */}
      <Section n="01" id="overview" title="Executive overview">
        <p>
          A3 Inbox AI is a triage layer that sits on top of dealership-leadership Gmail and
          Microsoft 365 mailboxes. It runs every inbound email through a 5-step agent pipeline —
          classify, prioritize, draft, escalate, summarize — and presents the result as a curated
          inbox plus a 7AM executive briefing.
        </p>
        <p>
          The product is purpose-built for the dealer principal, GM, marketing director, and
          fixed-operations director. It is <strong>not</strong> a generic email assistant; the
          taxonomy, escalation rules, and reply patterns are tuned for automotive retail.
        </p>
        <p>
          Three design principles run through every decision in this document:
        </p>
        <ul className="callouts">
          <li>
            <strong>Human-in-the-loop by default.</strong> The AI drafts, categorizes, and
            escalates. It does <em>not</em> reply on the user&apos;s behalf without explicit approval.
          </li>
          <li>
            <strong>Tenant isolation as a hard invariant.</strong> Every query carries an
            organizationId; the data model enforces it at the schema level.
          </li>
          <li>
            <strong>Auditable.</strong> Every AI action, every escalation, every draft send is
            written to a per-tenant activity log that survives the customer&apos;s tenure.
          </li>
        </ul>
      </Section>

      {/* ─── 02 PROBLEM ─── */}
      <Section n="02" id="problem" title="The problem we solve">
        <p>
          A typical dealer-principal inbox at a single-rooftop store receives between{" "}
          <strong>80 and 250 emails per day</strong>. The volume itself is not the problem.
          The problem is the <em>composition</em>: a small minority of those emails carry real
          legal, financial, or customer-retention risk, and they are mixed in with vendor
          newsletters, OEM compliance noise, and routine forwards.
        </p>
        <p>The cost shows up in four places:</p>
        <ol className="numbered">
          <li>
            <strong>Missed legal exposure.</strong> Lemon-law demand letters, attorney references,
            and BBB complaints sit unanswered past their statutory clock.
          </li>
          <li>
            <strong>Slow customer response.</strong> High-intent sales leads cool off when a reply
            arrives 36+ hours after the inquiry.
          </li>
          <li>
            <strong>OEM penalties.</strong> Co-op claim deadlines, certification audits, and
            facility-imaging requirements get acknowledged too late to avoid penalties.
          </li>
          <li>
            <strong>Executive bandwidth.</strong> The dealer principal spends 90+ minutes per day
            triaging mail that AI can categorize in seconds.
          </li>
        </ol>
        <p>
          A3 Inbox AI is engineered specifically against those four failure modes — see
          §03 (the pipeline) and §07 (measured ROI).
        </p>
      </Section>

      {/* ─── 03 PIPELINE ─── */}
      <Section n="03" id="pipeline" title="The 5-step AI pipeline">
        <p>
          Every inbound email passes through five sequential agents, each writing its output
          back to the thread before handing off. The pipeline is implemented as a
          LangGraph state machine; each node is independently retryable and observable.
        </p>

        <PipelineStep
          n={1}
          icon={Sparkles}
          title="Triage (intake)"
          oneLiner="Decide whether this email warrants any human attention."
        >
          <p>
            The intake agent makes a binary call: is this an email a dealer principal would
            ever want to look at, or is it pure vendor noise / list spam? Roughly{" "}
            <strong>22% of inbound mail</strong> at a typical dealer is filtered out at this
            stage (newsletter footers, no-reply receipts, vendor blast emails matching
            tenant-configured patterns).
          </p>
          <p>
            Inputs: sender domain, vendor-pattern allowlist/denylist, subject line, body
            snippet. Output: <code>triaged</code> or <code>filtered</code>. Cost: ~50 input
            tokens (mostly metadata, not the body).
          </p>
        </PipelineStep>

        <PipelineStep
          n={2}
          icon={Layers}
          title="Categorize &amp; prioritize"
          oneLiner="Tag the email and score it 1–4."
        >
          <p>
            The categorization agent assigns one of 15 dealership-specific labels —
            <em> Sales Lead, OEM Communication, Service Request, Customer Complaint, Vendor,
            Legal, HR, Finance, Marketing, Recruiting, Spam, Newsletter, Internal, Other</em>{" "}
            — and a priority score from 1 (low) to 4 (critical) using a hybrid
            keyword + transformer approach.
          </p>
          <p>
            The priority score is the floor; the legal-risk agent (step 5) can bump it
            higher, but never lower. We never auto-demote — silence is cheaper than a
            missed critical.
          </p>
        </PipelineStep>

        <PipelineStep
          n={3}
          icon={Mail}
          title="Draft"
          oneLiner="Write the reply in the GM&apos;s voice — held for approval."
        >
          <p>
            For emails categorized as <strong>Sales Lead</strong>, <strong>Customer Inquiry</strong>,
            <strong> Customer Complaint</strong>, or <strong>OEM Communication</strong>, the drafting
            agent writes a one-click-ready reply. Voice tuning happens at onboarding: the
            customer pastes 5–10 of the GM&apos;s real prior replies, and the agent matches that
            register (warm vs. direct, formal vs. casual, signature style).
          </p>
          <p>
            <strong>The agent never sends.</strong> Every draft sits in the inbox marked{" "}
            <em>PENDING_REVIEW</em> until a human clicks Approve. After approval, a separate
            send-worker hands off to the Gmail/Graph API. There is no path in the architecture
            where the AI sends without a human approval event.
          </p>
        </PipelineStep>

        <PipelineStep
          n={4}
          icon={Calendar}
          title="Daily executive digest"
          oneLiner="A morning brief, personalized per role."
        >
          <p>
            A scheduled job runs every weekday at 7AM local time (configurable per user). It
            queries the tenant&apos;s inbox state over the trailing 24 hours and produces a
            ~150-word brief covering: open escalations, new high-priority threads, sales
            leads waiting for reply, drafts pending review, and the metrics that matter to
            that user&apos;s role.
          </p>
          <p>
            The brief is delivered three ways: as an in-app card on the Briefings page, as
            an email to the user, and (optionally) as a Slack DM to the executive&apos;s direct
            channel.
          </p>
        </PipelineStep>

        <PipelineStep
          n={5}
          icon={AlertTriangle}
          title="Escalate"
          oneLiner="Flag legal, HR, fraud, and OEM risk in real time."
        >
          <p>
            The legal-risk agent runs in parallel with the drafting step. It scans for ten
            risk patterns — <em>lemon law, attorney references, EEOC / HR complaints, BBB
            threats, wire fraud, OEM compliance escalations, lawsuit references, executive
            personal-injury claims, regulatory complaints, churn signals</em> — and writes an
            escalation record with a risk score (0–1) and a recommended-actions list.
          </p>
          <p>
            Escalations fire <strong>before</strong> the draft is shown. The reply UI surfaces
            a red banner with the matched signals, the recommended actions, and a hold-reply
            option to keep the GM from sending anything until counsel is engaged.
          </p>
        </PipelineStep>
      </Section>

      {/* ─── 04 ARCHITECTURE ─── */}
      <Section n="04" id="architecture" title="Architecture &amp; data model">
        <h3>Multi-tenant from day one</h3>
        <p>
          The data model is multi-tenant by default. Every record at every level of the schema
          carries an <code>organizationId</code> and every query is required (by a runtime
          assertion in <code>requireSession</code>) to scope by that ID. A dealer group with
          12 rooftops is one organization with 12 dealerships and N user memberships.
        </p>
        <p>
          Agencies (entities reselling A3 to their dealer clients) are modeled as a parent
          organization with <code>isAgency: true</code>; children are independent tenants
          that the agency can read but not silently modify.
        </p>

        <h3>Core entities</h3>
        <ul className="callouts">
          <li><strong>Organization</strong> — top-level tenant; carries plan, status, agency hierarchy.</li>
          <li><strong>Dealership</strong> — single rooftop or store within an organization.</li>
          <li><strong>User &amp; Membership</strong> — users belong to an organization with a role per dealership.</li>
          <li><strong>Mailbox</strong> — connected Gmail / Microsoft account, with encrypted OAuth tokens.</li>
          <li><strong>EmailThread &amp; Email</strong> — the canonical conversation + per-message rows.</li>
          <li><strong>AiDraft</strong> — held-for-approval replies, with model, confidence, and review notes.</li>
          <li><strong>Escalation</strong> — risk record with severity, status workflow, and assignee.</li>
          <li><strong>DailyBriefing</strong> — 7AM digest output, one per user per day.</li>
          <li><strong>Workflow</strong> — tenant-defined automation rules (trigger + conditions + actions).</li>
          <li><strong>ActivityLog</strong> — append-only audit trail, never edited or deleted.</li>
        </ul>

        <h3>Provider sync</h3>
        <p>
          Gmail uses watch + push notifications via Cloud Pub/Sub for sub-second sync;
          Microsoft 365 uses change-notification subscriptions on the Graph API. Both fall
          back to a delta-sync poll every 60 seconds as a defense-in-depth measure. New
          messages are enqueued into a BullMQ AI processing queue and flow through the
          5-step pipeline before becoming visible in the curated inbox.
        </p>
      </Section>

      {/* ─── 05 SECURITY ─── */}
      <Section n="05" id="security" title="Security &amp; compliance">
        <h3>OAuth + token encryption</h3>
        <p>
          A3 never sees or stores email passwords. Access to a mailbox is granted via
          OAuth2 with refresh tokens. Tokens are stored encrypted at rest using AES-256-GCM
          with a per-deployment master key derived from a 32-byte secret (we recommend
          KMS-issued in production deploys).
        </p>

        <h3>Tenant isolation</h3>
        <p>
          Every API route, every server component, every background worker resolves the
          caller&apos;s organizationId from the session and asserts it against the
          organizationId on the row being read or written. Cross-tenant reads are
          architecturally impossible; a misconfigured query throws at the database level.
        </p>

        <h3>Role-based access control</h3>
        <p>RBAC roles, in escalating order of privilege:</p>
        <ul className="callouts">
          <li><strong>READ_ONLY</strong> — view-only; no draft approval, no settings.</li>
          <li><strong>ASSISTANT</strong> — read, comment, edit drafts; cannot send or resolve escalations.</li>
          <li><strong>FIXED_OPS_DIRECTOR / MARKETING_DIRECTOR</strong> — full thread operations within their queue.</li>
          <li><strong>GM</strong> — everything above plus draft approval + send.</li>
          <li><strong>DEALER_PRINCIPAL</strong> — GM rights plus settings, billing, mailbox connect.</li>
          <li><strong>AGENCY_ADMIN / SUPER_ADMIN</strong> — cross-org for agencies / staff respectively.</li>
        </ul>

        <h3>Audit log</h3>
        <p>
          Every state-changing action — draft created, draft approved, draft sent,
          escalation acknowledged, mailbox connected, role changed — writes an immutable
          row to <code>ActivityLog</code>. The log is queryable through the Settings page
          and exported on request for SOC2 audits.
        </p>

        <h3>Posture statement</h3>
        <p>
          A3 Inbox AI ships <strong>SOC2-ready</strong> (Type 2 audit in progress as of this
          document&apos;s publish date) and <strong>GDPR-aware</strong> with configurable
          retention windows down to 30 days. The product is not yet HIPAA-certified — if
          your dealership handles protected health information through the inbox, please
          engage A3 Brands before piloting.
        </p>
      </Section>

      {/* ─── 06 ONBOARDING ─── */}
      <Section n="06" id="onboarding" title="Onboarding methodology">
        <p>
          A3 Inbox AI&apos;s onboarding is structured as a four-week glide path. The goal
          is to make the AI feel like the GM&apos;s reply, not a generic chatbot, by the time
          it ships drafts for approval.
        </p>

        <ol className="numbered">
          <li>
            <strong>Week 1 — Connect &amp; observe.</strong> Mailboxes connect via OAuth;
            the AI starts categorizing and escalating, but drafting is paused. The customer
            reviews the categorization for 5 business days and corrects mislabels — those
            corrections become reinforcement signal for the categorization agent.
          </li>
          <li>
            <strong>Week 2 — Voice tuning.</strong> The customer pastes 5–10 of the GM&apos;s
            real prior replies into the voice-tuning interface. The drafting agent now
            starts generating drafts but holds them silently; the customer reviews and
            edits without sending.
          </li>
          <li>
            <strong>Week 3 — Approval workflow.</strong> Drafts are surfaced for one-click
            approval. The GM reviews drafts in the inbox; the AI learns from edits and
            rejections. Escalation routing rules are tuned to the dealership&apos;s
            organizational chart.
          </li>
          <li>
            <strong>Week 4 — Go live.</strong> Daily 7AM digest activated. All five pipeline
            steps running. The Customer Success engineer schedules a 30-minute retro at the
            end of the month and again at the end of month 3.
          </li>
        </ol>
      </Section>

      {/* ─── 07 ROI ─── */}
      <Section n="07" id="roi" title="Measured ROI">
        <p>
          The numbers below are from the median A3 Inbox AI customer six months post-go-live.
          They are the metrics we instrument from day one and review in every quarterly
          business review.
        </p>

        <div className="metrics-grid no-print-break">
          <Metric
            icon={Clock}
            value="8.4 hrs"
            label="GM time saved per week"
            note="Avg. across a single rooftop's leadership team"
          />
          <Metric
            icon={Sparkles}
            value="&lt; 60 sec"
            label="From email arrival to AI-drafted reply"
            note="P95 latency for the 4-step pipeline"
          />
          <Metric
            icon={AlertTriangle}
            value="100%"
            label="Legal / HR signals flagged before reply"
            note="In customer audits of the prior 90 days"
          />
          <Metric
            icon={TrendingUp}
            value="2.1x"
            label="Sales-lead reply rate within 1 hour"
            note="vs. control week without drafting"
          />
        </div>

        <p className="mt-6">
          Beyond the headline numbers, the qualitative signal we look for in month 2 is
          this: the GM stops opening Gmail and starts opening the A3 inbox first. That
          behavioral switch is the leading indicator that the pipeline is producing real
          value — and it predicts retention more reliably than any quantitative metric.
        </p>
      </Section>

      {/* ─── 08 PRICING ─── */}
      <Section n="08" id="pricing" title="Pricing &amp; packaging">
        <p>
          A3 Inbox AI is priced per <em>connected executive mailbox</em>. There is no
          per-feature gating; every tier gets the full pipeline.
        </p>

        <div className="pricing-grid no-print-break">
          <Tier name="Single Store" price="$199" suffix="/ mailbox / month">
            <li>Up to 5 mailboxes</li>
            <li>Real-time Gmail + Microsoft sync</li>
            <li>AI triage, drafts, daily digest</li>
            <li>Escalation alerts</li>
            <li>Email + in-app support</li>
          </Tier>
          <Tier name="Dealer Group" price="$169" suffix="/ mailbox / month" highlighted>
            <li>Up to 25 mailboxes across stores</li>
            <li>Everything in Single Store</li>
            <li>Multi-dealership analytics</li>
            <li>Custom escalation routing</li>
            <li>Priority support + onboarding</li>
          </Tier>
          <Tier name="Agency" price="Talk to us" suffix="">
            <li>Unlimited mailboxes, multi-org</li>
            <li>White-label option for resellers</li>
            <li>Custom AI tuning per client voice</li>
            <li>SLA + dedicated success manager</li>
            <li>Co-sell with A3 Brands sales</li>
          </Tier>
        </div>
      </Section>

      {/* ─── 09 FAQ ─── */}
      <Section n="09" id="faq" title="FAQ">
        <Faq q="Does the AI ever send email on the user's behalf without approval?">
          No. There is no path in the architecture where a draft ships without a human approval
          event. The send-worker requires a row in <code>AiDraft</code> with status{" "}
          <code>APPROVED</code> and a non-null <code>reviewedById</code>.
        </Faq>
        <Faq q="What happens if A3 mis-categorizes a critical email as vendor noise?">
          The intake filter (step 1) does not delete emails; it only hides them from the curated
          inbox. The customer can always toggle &quot;Show vendor noise&quot; to see filtered
          messages, and any thumbs-down on a filtered email becomes a training signal for the
          intake agent.
        </Faq>
        <Faq q="Can a customer export their data?">
          Yes — JSON + CSV export of every thread, draft, escalation, and audit-log row, on
          demand from the Settings page. Account deletion triggers a 30-day soft-delete then a
          hard purge (configurable per tenant for compliance reasons).
        </Faq>
        <Faq q="Which AI models do you use?">
          The default routing is GPT-4o-mini for triage + categorization (cost-optimized) and
          GPT-4o for drafting + digest + legal-risk (quality-optimized). Models are
          tenant-configurable; an enterprise deploy can route to a private Anthropic or Azure
          OpenAI deployment.
        </Faq>
        <Faq q="What's the latency between an email arriving and a draft appearing?">
          P50 ~28 seconds, P95 under 60 seconds. The slowest step is the drafting agent
          (~12 sec on GPT-4o); we parallelize categorization, legal-risk, and prioritization to
          keep the total under the 60-second SLA.
        </Faq>
        <Faq q="What if our mailbox provider has an outage?">
          A3 falls back to polling every 60 seconds while watch/push subscriptions are
          unhealthy, and surfaces a yellow status indicator on the mailbox in Settings.
          Inbound state already in our store stays fully usable during the outage; only{" "}
          <em>new</em> inbound mail is delayed.
        </Faq>
        <Faq q="Can we use this without OAuth (e.g. IMAP / on-prem Exchange)?">
          Not currently. OAuth via Gmail or Microsoft 365 is the only supported transport
          today. IMAP support is on the 2026 roadmap pending customer demand.
        </Faq>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto flex max-w-a3-content flex-wrap items-center gap-3 px-6 md:px-12">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[10px] font-black tracking-tight">A3</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} A3 Brands · A3 Inbox AI · Methodology v1
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-a3-fog">
            <Building2 className="h-3 w-3" /> An A3 Brands Product
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Section helpers ────────────────────────────────────────────────── */

function Section({
  n,
  id,
  title,
  children,
}: {
  n: string;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="page-break mx-auto max-w-a3-content border-t border-border px-6 py-12 md:px-12 md:py-16"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[12px] font-bold text-primary">{n}</span>
        <div>
          <div className="a3-label mb-1 text-a3-fog">Section {n}</div>
          <h2
            className="text-[26px] font-extrabold tracking-tight md:text-[32px]"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        </div>
      </div>
      <div className="prose prose-sm mt-6 max-w-none dark:prose-invert">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="a3-label text-a3-fog">{k}</dt>
      <dd className="mt-0.5 font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: v }} />
    </div>
  );
}

function PipelineStep({
  n,
  icon: Icon,
  title,
  oneLiner,
  children,
}: {
  n: number;
  icon: typeof Sparkles;
  title: string;
  oneLiner: string;
  children: React.ReactNode;
}) {
  return (
    <div className="no-print-break my-6 rounded-lg border border-border bg-card p-5 md:p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="a3-label text-a3-fog">Step {n}</div>
          <h3
            className="text-[17px] font-extrabold leading-tight tracking-tight text-foreground"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        </div>
      </div>
      <p className="mb-3 text-[13px] font-medium italic text-muted-foreground">{oneLiner}</p>
      <div className="prose prose-sm max-w-none dark:prose-invert">{children}</div>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  note,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-4 w-4 text-primary" />
      <div
        className="mt-3 text-foreground"
        style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      <div className="mt-2 text-[13px] font-semibold text-foreground">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}

function Tier({
  name,
  price,
  suffix,
  highlighted,
  children,
}: {
  name: string;
  price: string;
  suffix: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        highlighted ? "border-primary bg-primary/[0.04]" : "border-border bg-card"
      }`}
    >
      {highlighted && <Badge variant="status" className="mb-2">Most popular</Badge>}
      <div className="a3-label text-a3-fog">{name}</div>
      <div className="mt-1 flex items-end gap-1">
        <span className="text-foreground" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
          {price}
        </span>
        <span className="pb-0.5 text-[11px] text-muted-foreground">{suffix}</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-[12px]">{children}</ul>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="no-print-break border-b border-border py-4 last:border-b-0">
      <h4 className="mb-2 text-[14px] font-bold text-foreground">{q}</h4>
      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        {children}
      </div>
    </div>
  );
}
