# Architecture

## High-level

```
                 ┌──────────────────────────┐
                 │   Gmail / Microsoft 365  │
                 └────┬────────────┬────────┘
       OAuth + sync   │            │  push notifications
                      ▼            ▼
       ┌──────────────────────────────────────┐
       │   Next.js 15 app (RSC + API)         │
       │   ─ /api/webhooks/gmail              │  ───► Redis (BullMQ)
       │   ─ /api/webhooks/microsoft          │
       │   ─ /api/threads, /drafts, /esc…     │
       │   ─ /inbox dashboard, escalations…   │
       └──────┬────────────────────────┬──────┘
              │ Prisma                 │ enqueue
              ▼                        ▼
       ┌──────────────┐         ┌────────────────────────┐
       │  PostgreSQL  │ ◀────── │  Worker process(es)    │
       └──────────────┘         │  ─ sync.incremental    │
                                │  ─ sync.historical     │
                                │  ─ ai.process_thread   │
                                │  ─ ai.digest           │
                                │  ─ draft.send          │
                                └─────────┬──────────────┘
                                          │ OpenAI + LangGraph
                                          ▼
                                ┌──────────────────────────┐
                                │  Agents: intake,         │
                                │  categorize, priority,   │
                                │  legal-risk, drafting,   │
                                │  daily-digest            │
                                └──────────────────────────┘
```

## Tenancy

Every domain row carries `organizationId`. Agencies (`Organization.isAgency=true`) sit at the top of
a `parentOrgId` hierarchy; agency admins can read child orgs. Per-user, per-dealership scope is
modeled via `Membership(userId, organizationId, dealershipId, role)` so a user can hold different
roles at different stores.

All API routes call `requireSession()` → `assertSameOrg()` before returning data. Server components
read the session inside the layout and pass `organizationId` into queries directly.

## Roles

`SUPER_ADMIN > AGENCY_ADMIN > DEALER_PRINCIPAL > GM > MARKETING_DIRECTOR / FIXED_OPS_DIRECTOR / ASSISTANT > READ_ONLY`

Permission map: [`src/lib/permissions.ts`](../src/lib/permissions.ts).

## Sync pipeline

1. **OAuth connect** (`/api/mailboxes/connect/{gmail|microsoft}`) — exchanges code, stores
   AES-256-GCM encrypted access/refresh tokens, enqueues `sync.historical`.
2. **Historical backfill** — `workers/sync-worker.ts` walks message ids (90d window for Gmail,
   delta endpoint for Graph), upserts via `upsertEmail()` (idempotent on
   `(mailboxId, providerMessageId)`), enqueues `ai.process_thread` per newly created message.
3. **Push notifications** — `users.watch` for Gmail (Pub/Sub) and `/subscriptions` for Graph.
   Webhook routes verify shared secrets/clientState, look up the mailbox, enqueue
   `sync.incremental`. Subscription renewal runs on a 12h cron.
4. **Incremental polling** — every 5 min, scheduler fans out one `sync.incremental` per ACTIVE
   mailbox. This is the failover if push delivery hiccups.
5. **Persistence normalization** — `src/lib/sync/normalizer.ts` is the provider-agnostic shape;
   `persist.ts` upserts thread + email + attachments inside a single Prisma write.

Idempotency: `(mailboxId, providerMessageId)` and `(mailboxId, providerThreadId)` are unique
indexes. Job ids are deterministic (`ai:<threadId>`, `inc:<mailboxId>:<cursor>`) so retries
don't double-process.

## LangGraph orchestrator

```
              ┌──────────┐
              │  START   │
              └────┬─────┘
       fan out      │
       ┌────────┬───┴──┬──────────┐
       ▼        ▼      ▼          ▼
   intake  category priority   legal
       │        │      │          │
       └────┬───┴──────┴──────────┘
            ▼
         ┌──────┐
         │draft │
         └──┬───┘
            ▼
          END
```

- `intake / category / priority / legal` run in **parallel** — each calls OpenAI with a strict
  JSON-schema response. `legal-risk` runs the heavier model when a keyword pre-filter fires.
- `drafting` waits for all four so it can incorporate sentiment, priority, and escalation status —
  high-risk threads get a deferential acknowledgement only, never substantive replies.
- Results persist atomically in one Prisma transaction (`persistResult`): thread metadata,
  optional `Escalation`, optional `AiDraft`, and an `ActivityLog` row with the trace.
- See [`src/lib/agents/orchestrator.ts`](../src/lib/agents/orchestrator.ts).

## Workflow / approval

Drafts land in `AiDraft.status = PENDING_REVIEW`. Only `draft:approve` roles (GM+) can approve;
only `draft:send` roles can dispatch. `/api/drafts/[id]` `POST {action}` handles the state
machine: `approve | reject | send`. Sending enqueues `draft.send`, which calls the right provider
API (`gmail.users.messages.send` or `/me/sendMail`) and writes back `sentMessageId`.

## Security

- OAuth tokens encrypted at rest (AES-256-GCM with random IV + auth tag, see `encryption.ts`).
- API tokens stored as SHA-256 hash; raw value shown once at creation.
- `middleware.ts` enforces auth on every non-public route and sets hardening headers.
- Audit log written for all sensitive state changes (`audit.ts`).
- Pino redacts token / cookie / authorization paths from logs.
- Rate limit helper (Redis fixed-window) for inbound webhook/API endpoints.

## Daily briefings

A repeatable BullMQ job fires at `DIGEST_CRON` and fans out one `ai.digest` per user. The agent
aggregates inbox volume, top threads, open escalations, pending drafts, and new leads, then asks
the heavy model for a 4-6 sentence summary plus a ranked thread list. Stored in `DailyBriefing`,
one row per `(user, date)`.

## Extension points

- Add a new agent: drop a file in `src/lib/agents/`, expose it from `orchestrator.ts`, add a node
  and edge. The state graph fans in automatically.
- Add a new workflow trigger: extend `Workflow.trigger` enum and add evaluation in a new worker.
- Add a new provider: implement the `historical / incremental / send / subscribe` quartet under
  `src/lib/sync/`, switch on `mailbox.provider` in `workers/sync-worker.ts` and `send-worker.ts`.
