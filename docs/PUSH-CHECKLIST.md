# Pre-Push & Pre-Presentation Checklist

## Before `git push`

```bash
cd "/Users/rhea/Desktop/AI Email Inbox Manager"

# 1. Confirm nothing sensitive is staged
git status --ignored | grep -E "\.env$|dev\.db$"
# Both must appear under "Ignored files" — NOT under "Changes to be committed"

# 2. Look for accidental secrets in the diff
git diff --staged | grep -iE "(sk-[a-z0-9]{20,}|password=.{8,}|secret=.{8,})"
# Should print nothing

# 3. Try a typecheck
npx tsc --noEmit

# 4. Build a production bundle (catches issues dev doesn't)
npm run build
```

## First push to GitHub

```bash
git init                                       # if not yet
git add .
git commit -m "Initial: A3 Inbox AI — sellable A3 Brands product

- Multi-tenant SaaS for dealership GMs
- LangGraph agent pipeline (triage/category/priority/legal/draft/digest)
- Gmail + Microsoft Graph sync
- A3 Brands design system (emerald + charcoal, Sora)
- 26 realistic threads + 5 escalations + 7 briefings in seed
- Demo-mode fallbacks (zero-dep local run)"

git branch -M main
git remote add origin git@github.com:<your-org>/a3-inbox-ai.git
git push -u origin main
```

## Before presenting to your boss

### One day before

- [ ] `npm install && npm run prisma:migrate && npm run prisma:seed` to confirm a clean build
- [ ] Walk through `docs/PITCH.md` end-to-end **twice**
- [ ] Click every button at least once — make sure nothing throws
- [ ] Confirm the `DEMO` badge shows top-right when signed in (proves honesty about mock data)
- [ ] Charge laptop. Bring charger.
- [ ] Have backup tab open at `http://localhost:3000/login` already signed in as `principal@a3brands.test`

### Five minutes before

```bash
cd "/Users/rhea/Desktop/AI Email Inbox Manager"
npm run dev               # starts on http://localhost:3000
```

- [ ] Open `http://localhost:3000` in a fresh window (so she sees the landing page first)
- [ ] Have `docs/PITCH.md` open in a second monitor / on your phone
- [ ] Close anything sensitive — Slack DMs, email, other browser tabs
- [ ] Increase browser font size 1 notch if she's reading off the screen

### If something goes wrong mid-demo

| Problem | Fix |
|---|---|
| Page won't load | `npm run dev` may have crashed — restart it |
| Inbox is empty | Re-seed: `npm run prisma:seed` |
| Login redirects in a loop | Clear cookies for localhost; re-sign in |
| "Approve & Send" hangs | Check `DEMO` badge is showing; if not, OpenAI key is set but Redis isn't running |
| Dark mode looks weird | Toggle back to light in the top-right (she may prefer light for projector) |

### Don't accidentally

- ❌ Click "Connect Gmail" / "Connect Microsoft" → they're intentionally disabled; the tooltip explains why
- ❌ Open the `/escalations/[id]/route.ts` files mid-pitch — show the product, not the code
- ❌ Apologize for what's "missing" — everything in the demo works. Production gaps are in the README under "Status" if she asks.

## After the pitch

If she gives the green light to pilot:

1. Get a real OpenAI API key (`platform.openai.com`) — set in production `.env`
2. Register a Google Cloud OAuth client + Pub/Sub topic for Gmail push
3. Register an Azure AD app for Microsoft Graph
4. Spin up production Postgres (Neon, Supabase, RDS) + Redis (Upstash, Elasticache)
5. Deploy app to Vercel; deploy worker to Render/Fly/Railway (see `docs/DEPLOYMENT.md`)
6. Onboard the first pilot dealership: create their `Organization`, invite the GM, connect their mailbox
