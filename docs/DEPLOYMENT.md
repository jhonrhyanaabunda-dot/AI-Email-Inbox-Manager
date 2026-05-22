# Deployment

## Environments

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (`?schema=public`). |
| `REDIS_URL` | Redis instance — BullMQ, rate limit, OAuth state. |
| `AUTH_SECRET` | NextAuth JWT signing key (`openssl rand -base64 32`). |
| `ENCRYPTION_KEY` | 32-byte hex used for AES-256-GCM token encryption. **Never rotate without re-encrypting.** |
| `OPENAI_API_KEY` | OpenAI key. `OPENAI_MODEL` / `OPENAI_MODEL_HEAVY` to choose model tiers. |
| `GOOGLE_*` | Google Cloud OAuth client + Pub/Sub topic for push. |
| `MICROSOFT_*` | Azure AD app registration + redirect URI + webhook clientState. |

See `.env.example`.

## Local (docker compose)

```bash
docker compose up -d postgres redis app worker
```

Health: `curl http://localhost:3000/api/health` → `{ ok: true }`.

## Vercel + managed Postgres/Redis + separate worker

The Next.js app deploys cleanly to Vercel. Workers must run **outside** Vercel (long-running
processes are not supported on serverless). Options:

- **Fly.io / Railway / Render**: deploy `Dockerfile.worker` as a long-running service, point at the
  same Postgres + Redis.
- **Kubernetes**: standard Deployment with `command: ["npx", "tsx", "workers/index.ts"]` and
  `replicas: 2+`. Liveness probe: `node -e "console.log('ok')"` (or wrap with a tiny HTTP server).

## Gmail push notifications

1. Create a Pub/Sub topic, e.g. `projects/<proj>/topics/inbox-gmail`.
2. Grant `gmail-api-push@system.gserviceaccount.com` the `Pub/Sub Publisher` role on the topic.
3. Set `GOOGLE_PUBSUB_TOPIC` and add a Push subscription pointing at
   `https://<your-host>/api/webhooks/gmail?token=<GOOGLE_PUBSUB_VERIFICATION_TOKEN>`.
4. The worker calls `users.watch` automatically after the first historical sync; renewal job runs
   every 12h.

## Microsoft Graph subscriptions

1. Register an app in Azure AD with `Mail.ReadWrite`, `Mail.Send`, `offline_access`, `User.Read`.
2. Set `MICROSOFT_REDIRECT_URI` to `https://<your-host>/api/mailboxes/connect/microsoft/callback`.
3. The webhook URL must be HTTPS and reachable from Microsoft. Graph performs a validation
   handshake — we echo the `validationToken` in `app/api/webhooks/microsoft/route.ts`.
4. Subscriptions expire after 3 days for mail — the 12h renewal job extends them.

## Database migrations

```bash
npm run prisma:migrate         # dev: generate + apply
npm run prisma:deploy          # prod: apply pending migrations
```

Run `prisma:deploy` before starting the app/worker. Containers wait on Postgres healthcheck via
`docker-compose.yml`.

## Observability

- Pino structured logs (`LOG_LEVEL=info` in prod). Pipe to your aggregator of choice.
- BullMQ provides per-queue dashboards via `bull-board` if you want to add it.
- Errors in agent runs are persisted into `ActivityLog.meta.trace` so they're queryable by org.

## Hardening checklist

- [ ] Run behind a TLS terminator (Cloudflare, ALB, etc.) — HSTS at the edge.
- [ ] Postgres in a private subnet; never expose 5432 publicly.
- [ ] Rotate `OPENAI_API_KEY` quarterly; restrict by IP allowlist where possible.
- [ ] Backups: nightly logical (`pg_dump`) + 7d PITR if your provider supports.
- [ ] Verify `ENCRYPTION_KEY` is the same across app + worker, and rotated via
  re-encryption (read with old key, write with new key) — there is no
  forward-compatibility path otherwise.
- [ ] Webhook secrets: `GOOGLE_PUBSUB_VERIFICATION_TOKEN`, `MICROSOFT_WEBHOOK_CLIENT_STATE`.
