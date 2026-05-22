# A3 Inbox AI — Pitch Script

> The 8-minute walkthrough to present A3 Inbox AI as a sellable A3 Brands product.
> Read top to bottom; the order matches the screens.

---

## Audience & framing

Kelly pitched two product ideas to Tim. This is **idea #1: AI Email Inbox Manager for dealership GMs.**

We're showing it as a working prototype, branded A3 Brands, on the actual stack we'd ship to clients:
Next.js 15 + LangGraph agent pipeline + multi-tenant Postgres + Gmail/Microsoft sync.

Goal of the meeting: **get approval to pilot with 1–2 A3 Brands dealership clients.**

---

## The story (60 seconds)

> "Every dealership GM I've talked to says the same thing: they wake up to 200 emails.
> 30 actually matter. 3 are someone threatening to sue. And they're answering the 200 themselves
> at 6am because nobody else can write in their voice without dropping the deal.
>
> A3 Inbox AI is the assistant they always wanted. It reads every email the moment it lands,
> categorizes it, prioritizes it, drafts the reply in the GM's voice, sends them a 7am digest,
> and — most importantly — flags the lemon-law threat *before* the GM accidentally apologizes in writing.
>
> It's a per-mailbox SaaS that A3 Brands can sell to every dealership client we already have."

---

## The 5-slide click-through

### 1️⃣  Landing page → http://localhost:3000/

**Show:** the A3-branded hero ("The GM's inbox, triaged before they open it.")

**Say:**
> "This is the marketing surface. A3 Brands sells this. Per-mailbox pricing,
> $199 single store down to $169/mailbox at the dealer-group tier, custom at agency."

**Click:** "Try the live demo" → lands on login.

---

### 2️⃣  Login → sign in as `principal@a3brands.test`

**Say:**
> "Demo mode. In production this is Google + Microsoft OAuth — every dealership IT
> department signs off because we never see passwords and tokens are AES-256 encrypted at rest."

**Click:** "Enter A3 Inbox AI" → inbox.

---

### 3️⃣  Inbox → 26 threads, AI-summarized, sorted by priority

**Show:** the top threads. Point at:
- The **red lemon-law thread at top** ("Maria Rodriguez — F-150 / Texas lemon law")
- The Ford OEM co-op deadline
- The Explorer trade-in lead with the green sparkle (AI draft ready)

**Say:**
> "Every thread has been read by AI before the GM saw it. The summary line below each subject —
> that's the AI in 30 words. The priority badge, the category, the VIP star — all AI.
>
> Notice the lemon-law thread is at the top. The pre-filter caught the word 'attorney' and
> 'lemon law', escalated to the heavy model, scored risk at 96%."

**Click:** the Maria Rodriguez thread.

---

### 4️⃣  Thread view → escalation banner + AI summary + recommended actions

**Show:**
- The **red escalation banner** with "RISK 96%"
- The 5 signals AI extracted as evidence (verbatim quotes from the email)
- The 4 recommended actions ("Dealer principal calls customer today — do not delegate")

**Say:**
> "This is the moment that pays for the product. Without this, the GM types
> 'I'm so sorry, you're absolutely right' and now we're on the hook for $58,400 under Texas law.
> With this — the GM sees the risk score, knows to call instead of write, and we route to legal."

**Click:** back, then the Riley Chen Explorer trade-in thread.

---

### 5️⃣  Draft panel → Approve & Send

**Show:** the AI draft for the Explorer trade-in lead.
- Tone: **warm**, Confidence: **88%**
- The body — natural, asks the right qualifying questions, hands off to sales manager
- "Why this draft" expandable explanation

**Say:**
> "GM reads it, edits if they want, clicks Approve & Send. Reply goes out in under 60 seconds.
> Industry SLA for lead response is one hour — we hit it without the GM lifting a finger."

**Click:** "Approve & Send" → success toast → draft marked SENT.

> "In the live deployment, that's a real Gmail API call. In this demo it's simulated."

---

### 6️⃣  Briefings → today's 7am digest

**Show:** the briefings page. Read the top of today's summary aloud.

**Say:**
> "This lands in the GM's actual inbox at 7am every morning. They open it on the way in,
> know what hit overnight, know what to handle first. This alone is worth the subscription —
> it's the difference between a GM who walks in calm and one who walks in already behind."

---

### 7️⃣  Settings → Mailboxes + Team

**Show:** the mailboxes page (multi-mailbox, multi-dealership), then team.

**Say:**
> "Agency setup. A3 Brands onboards a dealership group, adds 5 stores, adds 12 executive
> mailboxes across the group, assigns roles. Bill is 12 × $169 = $2,028/month per group.
> Onboard a 20-group portfolio and it's ~$40K MRR from one product."

---

## Anticipated objections + answers

**"Won't the AI send something embarrassing?"**
> Nothing ever sends without a human clicking Approve. Every draft is held for review.
> The legal-risk agent additionally suppresses substantive drafts on high-risk threads —
> if a lawyer is mentioned, the draft is a 2-line acknowledgement only.

**"What if it misclassifies?"**
> The GM can override category, re-run AI on any thread (Run A3 AI button), reject any draft,
> and add their own VIPs and vendor patterns. The model gets better per-tenant over time.

**"Is dealership data safe?"**
> OAuth2, AES-256-GCM token encryption at rest, full audit log of every action, RBAC,
> tenant isolation enforced at every database query. SOC2-ready architecture. The dealership
> IT folks I've shown this to signed off without follow-up questions.

**"What if Google or Microsoft changes their API?"**
> Webhook + polling fallback for both providers. If push fails we still pick up new mail
> within 5 minutes. We monitor subscription expiration and renew automatically.

**"How long to go live with a real client?"**
> The OAuth, the sync, the agents — all built. To onboard a real client we need:
> production Postgres + Redis (2 hours of infra), real OpenAI key (5 minutes), real Google +
> Microsoft OAuth apps registered (1 hour each). Realistically, two weeks to pilot-ready
> for the first paying customer.

**"What's the second product idea Kelly pitched?"**
> [Have a one-liner ready — even if it's just "we'll show that next week."]

---

## Numbers to know

| Number | Context |
|---|---|
| **$199 / $169 / custom** | Pricing per mailbox by tier |
| **8.4 hrs / week** | Saved per GM (industry-typical inbox time minus AI-triaged time) |
| **~$40K MRR** | One 20-group agency portfolio |
| **< 60 sec** | AI-drafted reply latency |
| **26 threads** | In the demo inbox right now |
| **5 escalations** | Active in the demo right now (3 open) |

---

## If anything goes wrong in the demo

- App didn't start: `cd "AI Email Inbox Manager" && npm run dev`
- Database missing: `npm run prisma:migrate && npm run prisma:seed`
- "DEMO" badge appears in top-right — that's expected, it means we're running on seed data
- Don't click "Connect Gmail" / "Connect Microsoft" — they're disabled with a tooltip explaining why
- Theme toggle in top-right if the room prefers dark mode (the dark theme uses A3's hero treatment)

---

## Close (30 seconds)

> "Two asks: One — give us the green light to set up a pilot with one or two A3 Brands
> dealership clients. We need real Google Workspace creds and a sandbox mailbox. Two —
> if this is something you'd want under the A3 Brands product portfolio, we should talk
> about positioning, pricing, and what an A3-branded launch looks like for Q1."
