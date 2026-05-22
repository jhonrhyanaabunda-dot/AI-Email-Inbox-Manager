import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, AlertTriangle, Calendar, Sparkles, ShieldCheck, Clock, Layers, ArrowRight, Building2, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const session = await auth();
  if (session?.user) redirect("/inbox");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-a3-shell items-center px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-emerald">
              <span className="text-[12px] font-black tracking-tight">A3</span>
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-bold">A3 Inbox AI</div>
              <div className="a3-label text-a3-fog">A3 Brands</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2 text-[14px]">
            <a href="#how" className="hidden px-3 text-foreground hover:text-primary md:inline">How it works</a>
            <a href="#flow" className="hidden px-3 text-foreground hover:text-primary md:inline">The flow</a>
            <a href="#pricing" className="hidden px-3 text-foreground hover:text-primary md:inline">Pricing</a>
            <Button asChild size="sm" className="h-10 px-5">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-a3-navy text-white">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-60 -left-20 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-a3-content px-8 py-24 lg:py-32">
          <Badge variant="status" className="border-primary/60 bg-primary/15 text-primary">
            An A3 Brands Product · Built for Dealership GMs
          </Badge>
          <h1
            className="mt-6 max-w-3xl text-white"
            style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.05, letterSpacing: "0.005em", fontWeight: 800 }}
          >
            The GM's inbox,
            <br />
            <span className="text-primary">triaged before they open it.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-[24px] text-white/75">
            A3 Inbox AI reads every email the moment it arrives in your dealer principal's,
            GM's, or fixed-ops director's inbox. It categorizes, prioritizes, drafts a reply,
            sends a daily executive digest, and escalates legal threats and angry customers
            <em> before</em> they become lawsuits.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 px-8">
              <Link href="/login">
                Try the live demo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 border-white/20 px-8 text-white hover:bg-white/5 hover:text-primary">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10 sm:gap-12">
            {[
              ["8.4 hrs", "saved per GM per week"],
              ["< 60 sec", "to AI-drafted reply"],
              ["100%", "of legal/HR risks flagged before reply"],
            ].map(([metric, label]) => (
              <div key={label}>
                <div className="text-primary" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
                  {metric}
                </div>
                <div className="mt-2 text-[12px] uppercase tracking-[0.05em] text-white/55">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5-STEP FLOW ───────────────────────────────────────────────────── */}
      <section id="flow" className="border-b border-border bg-background py-24">
        <div className="mx-auto max-w-a3-content px-8">
          <div className="mb-12 text-center">
            <div className="a3-label mb-2 text-primary">The Flow</div>
            <h2 className="text-foreground" style={{ fontSize: 35, lineHeight: "39px", fontWeight: 800, letterSpacing: "0.015em" }}>
              Five steps. Zero busywork.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              The exact pipeline Kelly pitched to Tim — running end-to-end in this demo.
            </p>
          </div>

          <ol className="grid gap-4 md:grid-cols-5">
            {[
              { num: "1", title: "Triage", body: "Every inbound email runs through the AI the second it lands" },
              { num: "2", title: "Categorize & prioritize", body: "15 dealership-tuned categories + 4 priorities" },
              { num: "3", title: "Draft", body: "AI writes the reply in the GM's voice — held for approval" },
              { num: "4", title: "Daily digest", body: "7am brief: what to act on, what shipped, what's overdue" },
              { num: "5", title: "Escalate", body: "Legal / HR / lemon-law / fraud routed before any reply" },
            ].map((s) => (
              <li key={s.num} className="relative rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-subtle">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-sm bg-primary/10 font-mono text-[14px] font-bold text-primary">
                  {s.num}
                </div>
                <div className="text-[14px] font-bold text-foreground">{s.title}</div>
                <div className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{s.body}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── PRODUCT PILLARS ───────────────────────────────────────────────── */}
      <section id="how" className="border-b border-border bg-secondary py-24">
        <div className="mx-auto max-w-a3-content px-8">
          <div className="mb-12">
            <div className="a3-label mb-2 text-primary">How A3 Inbox AI Works</div>
            <h2 className="max-w-2xl text-foreground" style={{ fontSize: 35, lineHeight: "39px", fontWeight: 800, letterSpacing: "0.015em" }}>
              Built for the way dealership leadership actually works.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Pillar
              icon={Sparkles}
              eyebrow="AI Triage"
              title="No more 200-email mornings"
              body="Every email is read, categorized into 15 dealership-specific categories (Sales Lead, OEM Comm, Service Request, Customer Complaint, Vendor noise, Legal…), prioritized 1–4, and summarized in one sentence — before the GM opens Gmail."
            />
            <Pillar
              icon={Inbox}
              eyebrow="GM-Voice Drafts"
              title="One-click replies that sound like you"
              body="The drafting agent writes the reply in the GM's voice — professional, warm, or direct depending on context. Every draft is held for review. Nothing sends without a human clicking Approve."
            />
            <Pillar
              icon={AlertTriangle}
              eyebrow="Escalation Engine"
              title="Catch the lawsuit before it files"
              body="A keyword pre-filter + the legal-risk agent flag lemon law, attorney references, HR/EEOC complaints, BBB threats, OEM escalations, and wire fraud. Each fires a red banner with recommended actions before a reply goes out."
            />
            <Pillar
              icon={Calendar}
              eyebrow="Daily Executive Digest"
              title="Your morning, summarized"
              body="At 7am every dealer principal and GM gets a personalized briefing: top threads, open escalations, sales leads waiting on reply, drafts to approve, and the metrics that matter. Generated by GPT-4-class models on your live inbox state."
            />
            <Pillar
              icon={Layers}
              eyebrow="Multi-Tenant by Design"
              title="Agency-ready from day one"
              body="A3 Brands onboards a dealership group → one organization with N stores → bill per mailbox. Role-based access for principals, GMs, marketing, fixed-ops, and EAs. Tenant isolation enforced at every query."
            />
            <Pillar
              icon={ShieldCheck}
              eyebrow="Security & Compliance"
              title="Passes dealership IT review"
              body="OAuth2 with AES-256-GCM-encrypted token storage. Full audit log of every AI action. RBAC permissions. Rate limiting + CSRF + XSS hardening. SOC2-ready architecture; GDPR-aware retention controls."
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b border-border bg-background py-24">
        <div className="mx-auto max-w-a3-content px-8">
          <div className="mb-12 text-center">
            <div className="a3-label mb-2 text-primary">Pricing</div>
            <h2 className="text-foreground" style={{ fontSize: 35, lineHeight: "39px", fontWeight: 800, letterSpacing: "0.015em" }}>
              Simple per-mailbox pricing.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] text-muted-foreground">
              No setup fees. No per-feature gating. Pay per executive inbox connected.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Tier
              name="Single Store"
              price="$199"
              suffix="/ mailbox / mo"
              features={[
                "Up to 5 connected mailboxes",
                "Real-time Gmail + Microsoft sync",
                "AI triage, drafts, daily digest",
                "Escalation alerts",
                "Email + in-app support",
              ]}
            />
            <Tier
              name="Dealer Group"
              price="$169"
              suffix="/ mailbox / mo"
              highlighted
              features={[
                "Up to 25 mailboxes across stores",
                "Everything in Single Store",
                "Multi-dealership analytics",
                "Custom escalation routing",
                "Priority support + onboarding",
              ]}
            />
            <Tier
              name="Agency"
              price="Talk to us"
              suffix=""
              features={[
                "Unlimited mailboxes, multi-org",
                "White-label option for resellers",
                "Custom AI tuning per client voice",
                "SLA + dedicated success manager",
                "Co-sell with A3 Brands sales",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-a3-navy py-24 text-white">
        <div className="mx-auto max-w-a3-content px-8 text-center">
          <div className="a3-label mb-2 text-primary">Try it now</div>
          <h2 className="text-white" style={{ fontSize: 35, lineHeight: "39px", fontWeight: 800, letterSpacing: "0.015em" }}>
            See the demo inbox in 30 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] text-white/70">
            Real seed data. The exact UI a GM uses. Click through the lemon-law thread, the OEM
            co-op deadline, and the Explorer trade-in draft.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-14 px-8">
              <Link href="/login">
                Launch demo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 border-white/25 px-8 text-white hover:bg-white/5 hover:text-primary">
              <Link href="/login">
                <Mail className="mr-2 h-4 w-4" />
                Or sign in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-background py-10">
        <div className="mx-auto flex max-w-a3-content flex-wrap items-center gap-3 px-8">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[10px] font-black tracking-tight">A3</span>
          </div>
          <div className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} A3 Brands · A3 Inbox AI · Built for automotive
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-a3-fog">
            <Building2 className="h-3 w-3" /> An A3 Brands Product
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon: Icon,
  eyebrow,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-subtle">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="a3-label mt-4 text-primary">{eyebrow}</div>
      <div className="mt-1.5 text-[18px] font-bold leading-tight tracking-tight text-foreground">{title}</div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Tier({
  name,
  price,
  suffix,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  suffix: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-7 " +
        (highlighted
          ? "border-primary bg-primary/[0.04] shadow-emerald"
          : "border-border bg-card")
      }
    >
      {highlighted && <Badge variant="status" className="mb-3">MOST POPULAR</Badge>}
      <div className="a3-label text-a3-fog">{name}</div>
      <div className="mt-2 flex items-end gap-1.5">
        <span
          className="text-foreground"
          style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}
        >
          {price}
        </span>
        <span className="pb-1 text-[12px] text-muted-foreground">{suffix}</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-[13px]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="leading-snug text-foreground">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
