# Deploying to Vercel

The repo builds cleanly on Vercel **with zero environment variables set** — it
will deploy and serve the landing page + login page out of the box.

To make the live demo functional on the deployed URL (signed-in inbox, drafts,
escalations) you need at minimum a working database. Everything else is optional
and the app gracefully degrades to demo-mode when keys are missing.

---

## Minimum to get a working demo on a public URL

These are the secrets that let people actually sign in and see the inbox.

| Var | Why it's needed | How to get it |
|---|---|---|
| `DATABASE_URL` | Stores users, threads, drafts, etc. | Free Postgres on [Neon](https://neon.tech) — copy the `postgres://…` string |
| `AUTH_SECRET` | Signs NextAuth JWTs. **Without this every deploy invalidates sessions.** | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Encrypts OAuth tokens at rest. 64 hex chars (32 bytes). | `openssl rand -hex 32` |

> ⚠️ The SQLite dev database (`prisma/dev.db`) **does not work on Vercel** — Vercel's
> filesystem is read-only at runtime. You must use Postgres (or another network DB)
> for any deployed environment.

### Switching to Postgres for the deployed version

The local schema uses SQLite. For Vercel you'll want to:

1. Provision a Neon (or Supabase, RDS) Postgres instance
2. In Neon's dashboard, copy the connection string into Vercel as `DATABASE_URL`
3. Update `prisma/schema.prisma`:
   ```diff
   datasource db {
   -  provider = "sqlite"
   +  provider = "postgresql"
      url      = env("DATABASE_URL")
   }
   ```
4. Regenerate migrations:
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   ```
5. Commit & push — Vercel will run `prisma generate` on build

A future commit can include a `prisma/schema.postgres.prisma` so you can swap
without losing the local SQLite dev path.

---

## Optional — enable real AI (instead of demo-mode)

| Var | What it enables |
|---|---|
| `OPENAI_API_KEY` | Real LangGraph agents fire (vs. canned demo responses). Without it, the **DEMO** badge stays in the topbar and `Run A3 AI` / `Generate Now` use simulated outputs. |
| `OPENAI_MODEL` | Default `gpt-4o-mini` for fast agents |
| `OPENAI_MODEL_HEAVY` | Default `gpt-4o` for legal-risk + digest |

---

## Optional — enable real Gmail / Microsoft sync

For the **Connect Gmail** / **Connect Microsoft 365** buttons in Settings →
Mailboxes to work, register OAuth apps and set:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://<your-vercel-domain>/api/mailboxes/connect/gmail/callback
GOOGLE_PUBSUB_TOPIC=          # for push notifications (optional)
GOOGLE_PUBSUB_VERIFICATION_TOKEN=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://<your-vercel-domain>/api/mailboxes/connect/microsoft/callback
MICROSOFT_WEBHOOK_CLIENT_STATE=   # any random string
```

---

## Optional — enable BullMQ workers (real-time sync + scheduled digests)

Workers can't run on Vercel (no long-lived processes). Deploy `Dockerfile.worker`
to **Render**, **Fly.io**, or **Railway**, pointing at the same `DATABASE_URL`
and `REDIS_URL`.

For Redis itself, **Upstash** free tier works:
```
REDIS_URL=rediss://default:<password>@<region>.upstash.io:<port>
```

Without a worker, the demo still works — daily briefings won't auto-generate at
7am, but the "Generate Now" button on `/briefings` still produces one inline
(demo-mode) or via direct OpenAI call (when key is set).

---

## Step-by-step Vercel deploy

1. Connect the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Next.js** (auto-detected)
3. Build command: leave default (`next build`)
4. Install command: leave default — Vercel runs `npm install` which triggers `prisma generate`
5. Set env vars in **Settings → Environment Variables**:
   - At minimum: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`
6. Deploy → wait ~2 min → visit your `*.vercel.app` URL
7. Sign in as `principal@a3brands.test` (the seed user)

> If you didn't seed the production database, sign-in will succeed but the inbox
> will be empty. Either re-run `npx prisma db seed` against the production
> `DATABASE_URL`, or use the **Generate Now** button + dummy data flow.
