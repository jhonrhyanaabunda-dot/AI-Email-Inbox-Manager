# A3 Inbox AI

> An **A3 Brands** product — AI email inbox manager for dealership GMs.
> Sold to dealership clients as a per-mailbox SaaS.

[**📋 Pitch script & talking points →**](docs/PITCH.md)
[**🏗️ Architecture →**](docs/ARCHITECTURE.md)
[**🚀 Deployment →**](docs/DEPLOYMENT.md)

---

## The product flow

1. **AI triages** the GM's inbox the moment email arrives
2. **Categorizes & prioritizes** — 15 dealership categories, 4 priority tiers, VIP & vendor aware
3. **Drafts responses** in the GM's voice — held for one-click approval before send
4. **Daily 7am digest** — top threads, escalations, leads, drafts to approve
5. **Escalation alerts** for legal threats, BBB complaints, lemon law, HR/EEOC, OEM risks, fraud

```
                  GM's Gmail / Microsoft 365
                            │
                            ▼  push notifications
              ┌──────────────────────────────┐
              │   A3 Inbox AI sync workers   │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  LangGraph agent pipeline    │
              │  intake → category →         │
              │  priority → legal → draft    │
              └──────────────┬───────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
       Categorized     AI Drafts        Escalations
        Inbox UI    (PENDING_REVIEW)   (red banner +
                          │            risk score)
                          ▼
                  GM clicks Approve & Send
                          │
                          ▼
                     Real Gmail send
```

## Stack

- **Next.js 15** (App Router, React 19, RSC)
- **TypeScript** strict, **Tailwind**, **shadcn/ui**
- **Prisma** → PostgreSQL in prod, SQLite for local dev
- **Redis** (BullMQ queues + rate limit + OAuth state)
- **NextAuth v5** — Google, Microsoft, dev credentials
- **OpenAI** + **LangGraph** agent orchestration
- **Dockerized** app + worker, runs on Vercel or self-hosted

## Quick start (local — zero install beyond Node)

```bash
npm install
cp .env.example .env

# Generate secrets (already set in your local .env)
openssl rand -hex 32      # → ENCRYPTION_KEY
openssl rand -base64 32   # → AUTH_SECRET

# SQLite database with realistic A3 Brands seed
npm run prisma:migrate
npm run prisma:seed

npm run dev
# open http://localhost:3000
```

**Demo accounts:**
- `principal@a3brands.test` (Dealer Principal — sees everything)
- `gm@a3brands.test` (GM — can approve drafts)
- `marketing@a3brands.test` (Marketing Director — read+comment)

> Without an `OPENAI_API_KEY`, the app runs in **demo mode**: AI process / draft send / digest
> generation are simulated locally so the click-through works end-to-end. A `DEMO` badge appears
> in the top bar.

## Production deployment

For Postgres + Redis + workers, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
For the architecture deep-dive, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repo layout

```
prisma/             Schema + realistic seed (26 threads, 5 escalations, 7 briefings)
src/
  app/
    page.tsx        Public marketing landing page (A3 hero)
    login/          NextAuth sign-in
    (app)/          Authenticated dashboard
      inbox/        Triaged inbox + thread view + draft approve/send
      escalations/  Risk-ranked escalation list
      briefings/    Daily digests
      analytics/    7-day metrics
      settings/     Mailboxes, team, dealerships, API tokens
    api/            REST + webhooks
  components/       shadcn UI + A3-styled product components
  lib/
    agents/         LangGraph: intake, categorize, priority, legal, drafting, digest
    sync/           Gmail history + Microsoft Graph delta + normalizer + persistence
    queue/          BullMQ producers
    demo-mode.ts    Demo-mode detection + canned AI responses
    auth.ts, db.ts, redis.ts, encryption.ts, permissions.ts, audit.ts, …
  middleware.ts     Auth gate + hardening headers
workers/            BullMQ workers (sync, AI, digest, send) — separate process
docs/
  PITCH.md          ← Open this before the demo
  ARCHITECTURE.md
  DEPLOYMENT.md
```

## Status

| | Local demo | Production-ready |
|---|---|---|
| Multi-tenant schema + RBAC + audit log | ✅ | ✅ |
| LangGraph agent orchestration | ✅ (simulated) | ✅ (needs OpenAI key) |
| Gmail historical + incremental + webhook | ✅ scaffolded | ✅ (needs Google OAuth + Pub/Sub) |
| Microsoft Graph delta + subscription | ✅ scaffolded | ✅ (needs Azure app reg) |
| Inbox UI + draft approve/send | ✅ | ✅ |
| Escalation detection + banners | ✅ | ✅ |
| Daily digest | ✅ (simulated) | ✅ (needs OpenAI key + worker) |
| Analytics dashboard | ✅ | ✅ |
| BullMQ workers | – | ✅ (needs Redis) |
| Demo-mode fallbacks | ✅ | – |

## License

Proprietary — © 2026 A3 Brands LLC. See [LICENSE](LICENSE).
