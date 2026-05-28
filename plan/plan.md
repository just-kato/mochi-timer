# Implementation Plan — Time Tracker PWA

> This file is created by Claude Code before any application code is written.
> It is a living document. Never delete content — append and annotate only.
> Last updated: 2026-05-27

---

## What We Are Building

A PWA time tracking app for contractors. Sessions are legal documentation — immutable once stopped, stored with UUID + UTC timestamps, synced to Supabase with offline fallback via IndexedDB.

---

## Implementation Order

### Phase 0 — Project Scaffolding
1. Initialize Next.js 14 App Router project with TypeScript strict mode
2. Configure Tailwind CSS (flat design only)
3. Set up Prisma schema + initial migration
4. Configure Supabase client (browser + server + middleware)
5. Configure next-pwa (service worker, manifest)
6. Set up Playwright test runner
7. Create `.env.local` template

### Phase 1 — Auth (invite-only)
1. Supabase auth configuration (disable public signups — manual step)
2. Login page (`/app/(auth)/login/page.tsx`)
3. Auth callback handler (`/app/auth/callback/route.ts`)
4. Middleware — protect all routes under `/(protected)`
5. Admin role check middleware
6. `POST /api/admin/invite` route
7. Tests: `auth.spec.ts`

### Phase 2 — Core Timer
1. Timer page (`/app/(protected)/timer/page.tsx`)
2. `TimerButton` component — start/stop, one tap
3. Session creation API (`POST /api/sessions`)
4. Session stop API (`PATCH /api/sessions/[id]/stop`)
5. Immutability enforcement — API rejects edits to stopped sessions
6. Active session persistence (load on page refresh from Supabase)
7. Notes field per session
8. Tests: `timer.spec.ts`

### Phase 3 — Offline Support
1. IndexedDB schema + client (`/lib/indexeddb/client.ts`)
2. Sync queue logic (`/lib/indexeddb/sync.ts`)
3. Online/offline detection hook (`/lib/hooks/useOnlineStatus.ts`)
4. `OfflineIndicator` component
5. Active session stored in IndexedDB when offline
6. Sync-on-reconnect logic
7. Tests: `offline.spec.ts`

### Phase 4 — Calendar View
1. Calendar page (`/app/(protected)/calendar/page.tsx`)
2. `CalendarGrid` component — monthly grid, past only
3. `DayDetail` component — session list, hours total, pay total
4. API: `GET /api/sessions?date=YYYY-MM-DD`
5. Tests: `calendar.spec.ts`

### Phase 5 — Stats Dashboard
1. Stats page (`/app/(protected)/stats/page.tsx`)
2. `StatsCard` components
3. `HoursChart` component (Recharts bar chart)
4. Pay period selector
5. API: `GET /api/stats?period=week|custom&start=&end=`
6. Tests: `stats.spec.ts`

### Phase 6 — Export
1. Export page (`/app/(protected)/export/page.tsx`)
2. Date range picker
3. PDF export — jsPDF (`/lib/export/pdf.ts`)
4. CSV export — csv-stringify (`/lib/export/csv.ts`)
5. API: `GET /api/export?format=pdf|csv&start=&end=`
6. Tests: `export.spec.ts`

### Phase 7 — User Settings
1. Settings page (`/app/(protected)/settings/page.tsx`)
2. Hourly rate field
3. Pay period start day selector
4. Email toggle
5. API: `PATCH /api/settings`
6. Tests: `settings.spec.ts`

### Phase 8 — Admin Panel
1. Admin layout + guard (`/app/(protected)/admin/layout.tsx`)
2. Admin page — user list (`/app/(protected)/admin/page.tsx`)
3. Invite user form + API (`POST /api/admin/invite`)
4. Revoke access API (`POST /api/admin/revoke`)
5. View user stats (read-only)
6. Tests: `admin.spec.ts`

### Phase 9 — Weekly Summary Email
1. Resend email template (`/lib/email/templates.tsx`)
2. Email sender (`/lib/email/sender.ts`)
3. Cron route (`/app/api/cron/weekly-email/route.ts`)
4. CRON_SECRET validation
5. Manual trigger from admin panel
6. Tests: `email.spec.ts`

---

## File Structure

```
/plan
  plan.md

/prompts
  initial.md

/app
  layout.tsx                          ← root layout, PWA meta tags
  page.tsx                            ← redirects to /timer if authed, else /login
  globals.css

  (auth)/
    login/
      page.tsx                        ← login form (email magic link or password)
    callback/
      route.ts                        ← Supabase auth callback handler

  (protected)/
    layout.tsx                        ← session guard, wraps all protected pages
    timer/
      page.tsx
    calendar/
      page.tsx
    stats/
      page.tsx
    export/
      page.tsx
    settings/
      page.tsx
    admin/
      layout.tsx                      ← admin role guard
      page.tsx

  api/
    sessions/
      route.ts                        ← GET (list), POST (create)
      [id]/
        stop/route.ts                 ← PATCH (stop session, set endTime + duration)
    stats/
      route.ts                        ← GET (aggregated stats)
    export/
      route.ts                        ← GET (PDF or CSV download)
    settings/
      route.ts                        ← GET, PATCH
    admin/
      invite/route.ts                 ← POST (Supabase inviteUserByEmail)
      users/route.ts                  ← GET (all users)
      revoke/
        [id]/route.ts                 ← POST (disable user)
    cron/
      weekly-email/route.ts           ← POST (protected by CRON_SECRET)

/components
  timer/
    TimerButton.tsx
    ActiveTimer.tsx
    SessionList.tsx
    SessionItem.tsx
  calendar/
    CalendarGrid.tsx
    CalendarDay.tsx
    DayDetail.tsx
  stats/
    StatsCard.tsx
    HoursChart.tsx
    PayPeriodSelector.tsx
  export/
    ExportForm.tsx
    DateRangePicker.tsx
  admin/
    UserList.tsx
    UserRow.tsx
    InviteForm.tsx
  settings/
    SettingsForm.tsx
  shared/
    LoadingSpinner.tsx
    ErrorMessage.tsx
    EmptyState.tsx
    OfflineIndicator.tsx
    SyncIndicator.tsx
    NavBar.tsx

/lib
  supabase/
    client.ts                         ← browser client (createBrowserClient)
    server.ts                         ← server client (createServerClient)
    middleware.ts                     ← session refresh middleware helper
  prisma/
    client.ts                         ← singleton PrismaClient
  db/
    sessions.ts                       ← all session DB queries
    users.ts                          ← all user DB queries
  indexeddb/
    client.ts                         ← idb schema + open()
    sync.ts                           ← sync queue, push-to-supabase logic
  export/
    pdf.ts                            ← jsPDF export logic
    csv.ts                            ← csv-stringify export logic
  email/
    templates.tsx                     ← Resend React email template
    sender.ts                         ← Resend API call
  hooks/
    useTimer.ts                       ← timer state + start/stop logic
    useOnlineStatus.ts                ← navigator.onLine + event listeners
    useSessions.ts                    ← fetch + cache sessions
  utils/
    time.ts                           ← duration math, UTC helpers
    format.ts                         ← display formatting (hours, currency)
    logger.ts                         ← structured logger (no console.log in prod)

/prisma
  schema.prisma
  migrations/

/tests
  auth.spec.ts
  timer.spec.ts
  offline.spec.ts
  calendar.spec.ts
  stats.spec.ts
  export.spec.ts
  email.spec.ts
  settings.spec.ts
  admin.spec.ts
  fixtures/
    seed.ts                           ← test data seeder + cleanup
    helpers.ts                        ← shared test utilities (login, etc.)

/public
  manifest.json                       ← PWA manifest
  icons/                              ← PWA icons (192x192, 512x512)
  sw.js                               ← generated by next-pwa (do not edit)
```

---

## Auth Flow (text diagram)

```
ADMIN INVITE FLOW
─────────────────
Admin (logged in) → /admin → "Invite User" form
  ↓ POST /api/admin/invite { email }
  ↓ Validates: caller has role === 'admin' (from user_metadata)
  ↓ Calls Supabase Admin API: supabase.auth.admin.inviteUserByEmail(email)
  ↓ Supabase sends magic link email to invited address
  ↓ Returns 200 OK

Invited User → clicks email link → /auth/callback?token_hash=xxx&type=invite
  ↓ route.ts calls supabase.auth.verifyOtp({ token_hash, type: 'invite' })
  ↓ Session established
  ↓ Upsert user row in DB (Prisma) with defaults
  ↓ Redirect → /timer

LOGIN FLOW
──────────
User → /login → submits email
  ↓ supabase.auth.signInWithOtp({ email }) — magic link
  ↓ User clicks link → /auth/callback?token_hash=xxx&type=magiclink
  ↓ Session established
  ↓ Redirect → /timer

MIDDLEWARE PROTECTION
─────────────────────
Every request to /(protected)/*:
  middleware.ts
  ↓ supabase.auth.getUser()
  ↓ No session → redirect /login
  ↓ Valid session → pass through

  For /admin/* additionally:
  ↓ Check session.user.user_metadata.role === 'admin'
  ↓ Not admin → redirect /timer
  ↓ Admin → pass through

SESSION REFRESH
───────────────
middleware.ts calls updateSession() on every request
  ↓ Refreshes access token if near expiry
  ↓ Sets updated cookies
```

---

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  role           String    @default("user")   // "admin" | "user"
  hourlyRate     Float     @default(0)
  payPeriodStart Int       @default(1)         // day of week: 0=Sun, 6=Sat
  emailSummary   Boolean   @default(true)
  sessions       Session[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Session {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  startTime DateTime
  endTime   DateTime?
  duration  Int?      // seconds; null while running
  notes     String?
  synced    Boolean   @default(false)
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([userId, startTime])
}
```

**Supabase RLS Policies (to be applied via SQL migration):**

```sql
-- Users table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own row" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own row" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Sessions table
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own sessions" ON "Session"
  FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own sessions" ON "Session"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own sessions" ON "Session"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Admin bypass (using service role key in API routes — bypasses RLS)
-- No additional policies needed; service role always bypasses RLS
```

---

## Test Plan

| Feature | Spec File | Tests | Status |
|---------|-----------|-------|--------|
| Auth | auth.spec.ts | invited user logs in; non-invited rejected; admin invites user | 🔄 |
| Timer | timer.spec.ts | start/verify running; stop/verify saved+UUID+UTC; persists refresh; stopped is immutable | 🔄 |
| Offline | offline.spec.ts | offline: timer stored in IndexedDB; reconnect: synced; no duplicate; correct endTime | 🔄 |
| Calendar | calendar.spec.ts | past day with sessions; empty day zero state; future not selectable | 🔄 |
| Stats | stats.spec.ts | stats reflect sessions; pay calculates correctly; chart renders | 🔄 |
| Export | export.spec.ts | PDF downloads with correct data; CSV correct columns; date range filter | 🔄 |
| Email | email.spec.ts | cron rejects wrong secret; cron accepts correct secret; toggle persists | 🔄 |
| Settings | settings.spec.ts | hourly rate saves+reflects in stats; pay period start persists | 🔄 |
| Admin | admin.spec.ts | admin views user list; admin invites user; admin revokes access; user blocked from admin | 🔄 |

Status key: ⬜ not started | 🔄 in progress | ✅ passing | ❌ failing

---

## Dependencies & Install Order

```bash
# 1. Bootstrap Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. Supabase
npm install @supabase/supabase-js @supabase/ssr

# 3. Prisma
npm install prisma @prisma/client
npx prisma init

# 4. PWA
npm install next-pwa

# 5. IndexedDB
npm install idb

# 6. Charts
npm install recharts
npm install --save-dev @types/recharts  # if needed

# 7. Export
npm install jspdf csv-stringify
npm install --save-dev @types/jspdf @types/csv-stringify

# 8. Email
npm install resend

# 9. Testing
npm install --save-dev @playwright/test
npx playwright install

# 10. Dev tooling
npm install --save-dev @types/node
```

---

## Known Risks & Complexity Areas

### 1. IndexedDB + Supabase sync race condition
**Risk:** If the user starts a timer offline and then comes back online, the active session in IndexedDB must win over any stale state from Supabase. A naive "sync everything" could overwrite or duplicate.
**Mitigation:** Sync uses upsert (`ON CONFLICT DO UPDATE`). Active (no `endTime`) sessions in IndexedDB always take precedence. Sync only pushes sessions with `synced: false`.

### 2. Prisma bypasses RLS
**Risk:** Server-side Prisma uses `DATABASE_URL` with full access (or service role), bypassing Supabase RLS.
**Mitigation:** Every API route manually validates `session.user.id === record.userId` before any read/write. Never trust client-provided userId — always derive from auth session server-side.

### 3. Session immutability
**Risk:** Stopped sessions must never be editable — this is a legal documentation requirement.
**Mitigation:** The `PATCH /api/sessions/[id]/stop` route checks `session.endTime !== null` and returns 409 if already stopped. The DB schema allows null `endTime` (running) and non-null (stopped). No UPDATE route exists for session data — only the stop route exists.

### 4. next-pwa in development
**Risk:** Service workers behave differently in dev vs prod. Caching can cause stale assets.
**Mitigation:** next-pwa is configured to disable service worker in development (`disable: process.env.NODE_ENV === 'development'`). All offline testing done against production builds (`next build && next start`).

### 5. Client-side UUID generation
**Risk:** UUID collisions between IndexedDB-generated IDs and server-generated IDs.
**Mitigation:** All UUIDs generated client-side using `crypto.randomUUID()` (available in all modern browsers). Server accepts the client UUID on creation — never generates its own. Upsert on sync is keyed by this UUID.

### 6. PDF export performance
**Risk:** jsPDF runs client-side. Very large exports (100+ sessions) may be slow.
**Mitigation:** PDF is generated in the browser via a Web Worker if possible, or with a loading indicator. Document this limitation in `/plan/plan.md` if it becomes an issue.

### 7. Vercel cron route security
**Risk:** The weekly email cron route is a public HTTP endpoint if not protected.
**Mitigation:** Route validates `Authorization: Bearer ${CRON_SECRET}` header. Returns 401 if missing or mismatched. `CRON_SECRET` is a long random string set in Vercel env vars.

---

## Manual Setup Steps Required

- [ ] Disable public signups in Supabase dashboard: Authentication → Settings → "Enable email signup" OFF
- [ ] Create initial admin user manually in Supabase dashboard: Authentication → Users → "Invite user"
- [ ] Set `role: 'admin'` in user_metadata for admin: via Supabase dashboard or SQL update
- [ ] Run Prisma migration against Supabase Postgres: `npx prisma migrate deploy`
- [ ] Apply RLS policies via Supabase SQL editor (see schema section above)
- [ ] Add environment variables to `.env.local` (never commit this file)
- [ ] Configure Vercel cron job in `vercel.json` for weekly email (admin does this before deploy)
- [ ] Install nvm if not already installed: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- [ ] Install and use correct Node version: `nvm install 20.18.0 && nvm use 20.18.0`
- [ ] Verify Node version: `node --version` should output `v20.18.0`
- [ ] Re-run `npm install` after switching Node versions
- [ ] Verify server starts: `npm run dev`

---

## Phases Summary

| Phase | Description | Features |
|-------|-------------|----------|
| 0 | Scaffolding | Next.js, Tailwind, Prisma, Supabase, next-pwa, Playwright |
| 1 | Auth | Invite-only login, middleware, admin role |
| 2 | Timer | Start/stop, sessions, immutability, persist on refresh |
| 3 | Offline | IndexedDB, sync queue, indicators |
| 4 | Calendar | Monthly grid, day detail |
| 5 | Stats | Dashboard, charts, pay period |
| 6 | Export | PDF, CSV, date range |
| 7 | Settings | Hourly rate, pay period, email toggle |
| 8 | Admin | User list, invite, revoke |
| 9 | Email | Resend template, cron, manual trigger |

---

## Bugs

> Document every bug here. Never delete bugs. Format:
> ### Bug [number]: [short description]
> **Discovered:** [when]
> **Cause:** [what caused it]
> **Fix:** [how it was resolved]
> **Test:** [which test now covers it]

### Bug 001: Node v25 incompatibility
**Discovered:** Phase 0 scaffolding — first `npm run dev` attempt
**Cause:** Next.js does not support Node v25. The `require-hook` module cannot be resolved on Node v25.
**Fix:** Pin project to Node 20 LTS via `.nvmrc` and `.node-version`. Added `engines` constraint to `package.json`.
**Test:** Server starts successfully with `npm run dev` on Node 20.
**User action required:** See Bug 002 and Bug 003 below.

### Bug 002: Corrupted node_modules from scaffold copy
**Discovered:** Phase 0 — `npm run dev` still fails with `Cannot find module '../server/require-hook'` after switching to Node 20.18.0
**Cause:** The initial `node_modules` were physically copied from a temp scaffold directory (`/tmp/mochi-timer-scaffold`) rather than installed fresh in the project. Copied `node_modules` contain pre-built native binaries and `.bin` stubs compiled under the Node version active at copy time. Switching Node versions and running `npm install` on top of a copied tree does not fully replace these stale artifacts.
**Fix:** Delete `node_modules` and `package-lock.json` entirely, then do a clean `npm install` under Node 20.18.0.
**Commands:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```
**Test:** `npm run dev` starts the Next.js dev server without errors on Node 20.18.0.

### Bug 003: Wrong Node LTS patch version pinned — Prisma 7 requires >=20.19.0
**Discovered:** Clean `npm install` under Node 20.18.0 fails — Prisma 7.8.0, chokidar 5, readdirp 5, and eslint-visitor-keys all require Node `>=20.19.0`.
**Cause:** I pinned `.nvmrc` to 20.18.0 without checking the `engines` fields of the installed dependency versions. Prisma 7 (latest at install time) requires `^20.19 || ^22.12 || >=24.0`. Node 20.18.0 does not satisfy this.
**Fix:** Updated `.nvmrc`, `.node-version`, and `package.json` engines to `20.19.0` / `>=20.19.0 <21.0.0`.
**Test:** `npm install` completes without EBADENGINE errors on Node 20.19.0.
**User action required:**
```bash
nvm install 20.19.0 && nvm use 20.19.0
npm install
npm run dev
```

---

## Environment & Infrastructure

### Environment Variables

| Variable | Visibility | Purpose | Where to find |
|----------|-----------|---------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project API URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key for browser client | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private** | Service role key — bypasses RLS, server-side admin ops only | Supabase dashboard → Settings → API |
| `DATABASE_URL` | **Private** | Prisma runtime connection (pgBouncer, port 6543) | Supabase dashboard → Settings → Database |
| `DIRECT_URL` | **Private** | Prisma migration connection (direct, port 5432) | Supabase dashboard → Settings → Database |
| `RESEND_API_KEY` | **Private** | Resend API key for sending emails | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | **Private** | Verified sender address | Must be a domain verified in Resend |
| `CRON_SECRET` | **Private** | Bearer token that Vercel sends with cron requests | Generated locally: `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL of app (no trailing slash) | Set manually (`http://localhost:3000` in dev) |

**Rules:**
- Variables prefixed `NEXT_PUBLIC_` are bundled into the browser — never put secrets there.
- `SUPABASE_SERVICE_ROLE_KEY` must ONLY be used in server-side API routes, never imported in any component or client-side code.
- `.env.local` is gitignored and never committed. `.env.local.template` (with placeholder values) is committed.
- `supabase/.env` is gitignored. `supabase/.env.template` (with placeholders) is committed.

### Local Dev vs Production

| Variable | Local dev | Production (Vercel) |
|----------|-----------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase cloud project | Same (or local Supabase CLI) |
| `DATABASE_URL` | Supabase cloud project | Vercel env var |
| `CRON_SECRET` | Any random string | Must match Vercel cron job config |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |

### Supabase CLI Setup (in order)

1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login: `supabase login` (opens browser, saves access token)
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Pull remote schema if needed: `supabase db pull`
5. Run migrations: `npx prisma migrate deploy` (uses `DIRECT_URL`)
6. Apply RLS policies: `supabase db push` or paste into Supabase SQL editor

### Prisma + Supabase Connection Setup

- Supabase uses pgBouncer (connection pooler) in front of Postgres.
- Prisma Client at runtime must use the pgBouncer URL (port 6543) with `?pgbouncer=true` to avoid connection exhaustion on serverless (Vercel).
- Prisma Migrate (`prisma migrate deploy`) must use the DIRECT URL (port 5432) because DDL statements (CREATE TABLE, ALTER) are not compatible with pgBouncer's transaction mode.
- Both URLs live in `.env.local`: `DATABASE_URL` (pooler) and `DIRECT_URL` (direct).
- The `prisma/schema.prisma` datasource block references both:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```

---

## Plan Review Fixes Required

> Added 2026-05-27 after reviewing prompts/02_env_setup.md. These fixes must be applied before or during their respective phases.

### Fix 1: Admin API routes must always use the service role client

All routes under `/api/admin/*` must use `createClient(supabaseUrl, supabaseServiceRoleKey)` — never the anon client. The anon client respects RLS and cannot read other users' data. Document this explicitly in every admin API route as a comment at the top of the file.

**Applies to:** Phase 8 (Admin Panel) — all routes under `/app/api/admin/`

---

### Fix 2: Additional offline sync tests

Add these two tests to `offline.spec.ts` in addition to the two originally planned:

- Start timer offline → reconnect → verify no duplicate session created in Supabase (upsert must be idempotent)
- Start timer online → go offline → stop timer → reconnect → verify correct `endTime` is synced (not overwritten with null)

**Updated offline.spec.ts test count: 4 tests**

---

### Fix 3: Add ErrorBoundary to /components/shared/ and wrap Timer

Add `ErrorBoundary.tsx` to `/components/shared/`. The Timer page must be wrapped in this boundary so a React rendering error cannot destroy an active in-progress session. On error, the boundary must show a fallback UI that tells the user their timer is still running and to refresh.

**Applies to:** File structure (add to Phase 0), Phase 2 (wrap TimerButton/ActiveTimer in ErrorBoundary)

---

### Fix 4: Remove @types/recharts and @types/jspdf from install order

Both `recharts` and `jspdf` ship their own TypeScript type definitions. Installing `@types/recharts` or `@types/jspdf` separately would install outdated community types that conflict with the bundled ones.

**Corrected install command:**
```bash
npm install recharts jspdf csv-stringify
# No @types needed for recharts or jspdf — they ship their own types
# csv-stringify may need: npm install --save-dev @types/csv-stringify
```

---

### Fix 5: Add vercel.json to file structure with cron config

Add `vercel.json` to the project root. This file configures the Vercel cron job for the weekly email.

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-email",
      "schedule": "0 22 * * 0"
    }
  ]
}
```

Schedule `0 22 * * 0` = Sunday at 22:00 UTC (Sunday night).
The route must validate `Authorization: Bearer ${CRON_SECRET}` before processing.

---

### Fix 6: Add /prisma/migrations/rls.sql — RLS policies in source control

RLS policies must not be applied manually through the Supabase dashboard. They must live in `/prisma/migrations/rls.sql` and be tracked in git. This file is applied via `supabase db push` or run directly in the SQL editor during initial setup.

**Add to file structure:**
```
/prisma
  schema.prisma
  migrations/
    rls.sql               ← RLS policies — must be in source control
```

---

### Fix 7: synced field behavior — online vs offline sessions

The `synced` field on the `Session` model must reflect actual sync state:

- Sessions created **offline** (via IndexedDB first): `synced: false` — must be pushed to Supabase on reconnect
- Sessions created **online** (directly via `POST /api/sessions`): `synced: true` — already in Supabase, no sync needed

The `POST /api/sessions` route must create sessions with `synced: true`.
The IndexedDB sync queue must only process sessions where `synced === false`.

---

### Fix 8: Rate limiting on POST /api/admin/invite

Add rate limiting to `POST /api/admin/invite`: max 10 invites per hour per admin.

**Implementation approach:**
- Use an in-memory map (keyed by `userId`) tracking invite timestamps for the current process.
- On serverless (Vercel), each invocation is stateless — use a lightweight Redis-compatible store or Supabase table for persistence.
- Simpler alternative for v1: store invite count + window start in the `User` table with columns `inviteCount` and `inviteWindowStart`. Reset on each new hour window. Document this as a known limitation (not distributed-safe, but sufficient for a low-volume admin tool).
- Return HTTP 429 with a clear error message if limit exceeded.

---

### Fix 9: Wrap Timer page in ErrorBoundary — Phase 2 update

The Phase 2 implementation plan for the Timer page must explicitly include:
- Import and wrap `<TimerButton />` and `<ActiveTimer />` inside `<ErrorBoundary fallback={<TimerCrashFallback />}>`.
- `TimerCrashFallback` must display: "Your timer is still running. Refresh to recover." with a refresh button.
- This prevents a React rendering bug from silently stopping a session mid-run.

---

### Fix 10: Auth method decision — magic link only vs password

**Decision required before Phase 1:**

Magic link (OTP email) pros: no password to forget, simpler for contractors.
Magic link cons: requires email access to log in each time; if the inbox is slow or filtered, user is locked out.

Password auth pros: immediate login after first setup, works offline (cached session), better for daily use.
Password auth cons: password resets add complexity.

**Decision (2026-05-27):** Offer **both**. The invite email sets up the account via magic link. After first login, the user is prompted to set a password in settings. Subsequent logins can use either method. This is Supabase's default behavior — `signInWithPassword` and `signInWithOtp` both work once the account exists.

Document this in the Phase 1 login page implementation: show both "Send magic link" and "Sign in with password" options on the login form.

---

## Progress Log

> Append entries as features are completed. Never delete entries.

- 2026-05-27: Plan created. Directory structure initialized. prompts/initial.md copied to correct location. Starting Phase 0 scaffolding.
- 2026-05-27: Added `.env.local.template`, `supabase/.env.template`, `supabase/config.toml`. Appended Environment & Infrastructure section and Plan Review Fixes Required section per prompts/02_env_setup.md.
- 2026-05-28: Fixed DIRECT_URL in .env.local to use true Supabase direct connection (`db.PROJECT_REF.supabase.co:5432`). Successfully ran `prisma db push` — User and Session tables created. Applied RLS policies via psql. Prisma client regenerated. Admin user alexzandra.hawkins@proton.me seeded with role=admin.
- 2026-05-28: Neo-brutalist design system applied per prompts/04_neo_brutalist_design.md. All 22 components and pages rebuilt. See ## Design System section below.
- 2026-05-28: All 9 phases implemented. Full directory structure created. All Playwright spec files written (auth, timer, offline, calendar, stats, export, email, settings, admin). Tests marked 🔄 — need to run against live Supabase env to confirm passing.

---

## Design System

> Applied 2026-05-28 per prompts/04_neo_brutalist_design.md. Replaces all previous flat/minimal styles.

### Color Palette

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| Black | `#000000` | `text-black`, `bg-black`, `border-black` | Base foreground, borders, text |
| White | `#FFFFFF` | `bg-white` | Base background |
| Yellow | `#FFFF00` | `bg-brutalist-yellow` | Active timer, active nav, focused inputs, primary CTA |
| Red-orange | `#FF3B00` | `bg-brutalist-red` | Errors, destructive actions, offline banner |
| Blue | `#0000FF` | `bg-brutalist-blue` | Links, info states |
| Green | `#00FF00` | `bg-brutalist-green` | Synced, saved, confirmed states |

Defined in `lib/design/tokens.ts` (TypeScript constants) and `app/globals.css` (`@theme` block as `--color-*` variables).

### Shadow Utilities

| Class | Value | Usage |
|---|---|---|
| `.shadow-brutal-sm` | `4px 4px 0px #000000` | Buttons, small cards |
| `.shadow-brutal` | `6px 6px 0px #000000` | Cards, panels, timer display |
| `.shadow-brutal-lg` | `8px 8px 0px #000000` | Large feature elements |

Defined in `app/globals.css` under `@layer utilities`.

### Button Interaction Pattern

The `.btn-brutal` CSS class provides the shadow-shift interaction:
- **Default**: no transform
- **Hover**: `translate(2px, 2px)` + shadow reduces to `2px 2px 0px #000`
- **Active/Press**: `translate(4px, 4px)` + shadow collapses to `0px 0px 0px #000`
- **Disabled**: `opacity: 0.4`, cursor not-allowed

Transition: `80ms ease-out` for both transform and box-shadow.

### Typography

| Font | Variable | Tailwind Class | Usage |
|---|---|---|---|
| Space Grotesk | `--font-space-grotesk` | `font-grotesk` (default) | All UI text, labels, nav |
| Space Mono | `--font-space-mono` | `font-mono-brutal` | Numbers, times, durations |

Loaded via `next/font/google` in `app/layout.tsx`. Space Grotesk is set as the default `--font-sans`.
All labels and nav items use `uppercase tracking-widest font-bold text-xs`.

### Components Updated

- `components/shared/NavBar.tsx` — full-width black bar, yellow active state, all-caps links
- `components/shared/LoadingSpinner.tsx` — replaced spinner with pulsing black block cursor
- `components/shared/ErrorMessage.tsx` — red-orange bg, black border, all-caps bold text
- `components/shared/EmptyState.tsx` — large bold all-caps title, dashed black border
- `components/shared/OfflineIndicator.tsx` — red-orange full-width banner
- `components/shared/SyncIndicator.tsx` — yellow full-width banner
- `components/timer/TimerButton.tsx` — 176×176px square, yellow when running, btn-brutal interaction
- `components/timer/ActiveTimer.tsx` — massive 7xl Space Mono display, yellow bg when running
- `components/timer/SessionItem.tsx` — Space Mono times, bold uppercase labels
- `components/timer/SessionList.tsx` — black 3px border container
- `components/stats/StatsCard.tsx` — black border, hard shadow, 3xl Space Mono value
- `components/stats/HoursChart.tsx` — yellow bars for today, black bars for others, black axes
- `components/stats/PayPeriodSelector.tsx` — black border button group, yellow hover
- `components/calendar/CalendarGrid.tsx` — black gap grid, yellow selected day, black today
- `components/calendar/DayDetail.tsx` — black border panel, hard shadow
- `components/export/ExportForm.tsx` — brutalist date inputs, btn-brutal export buttons
- `components/settings/SettingsForm.tsx` — black border inputs, ON/OFF toggle button
- `components/admin/InviteForm.tsx` — brutalist input + black CTA button
- `components/admin/UserList.tsx` — black border list, red-orange revoke button
- `app/(auth)/login/page.tsx` — large 5xl "MOCHI TIMER" heading, yellow CTA
- All protected pages — 2xl uppercase headings, section labels, consistent spacing
