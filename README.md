# Mochi Timer

A PWA time tracker built for contractors. Start a timer, log sessions, generate invoices, and export data — all with offline support and an invite-only auth model.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 — flat/brutalist design |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Auth | Supabase Auth — invite-only, no public sign-up |
| Offline | IndexedDB via `idb`, auto-syncs on reconnect |
| PWA | `next-pwa` + Workbox service worker |
| Export | jsPDF (invoice PDF), csv-stringify (CSV) |
| Email | Resend (weekly summary via Vercel cron) |
| Charts | Recharts |
| Testing | Playwright |
| Deployment | Vercel |

---

## Features

### Timer
- One-tap start/stop
- Notes field with suggestions from recent sessions
- Active session persists across page refresh (Supabase + IndexedDB)
- Greeting clock showing local time (timezone configurable per user)
- UUID-based sessions with UTC timestamps

### Offline Support
- Sessions stored in IndexedDB when offline
- Auto-syncs to Supabase when reconnected
- Offline/sync status indicators in the UI

### Calendar View
- Monthly calendar with sessions per day
- Tap any day to see session list, total hours, estimated pay
- Future dates non-selectable

### Stats Dashboard
- Hours this week and this pay period
- Estimated earnings at configured hourly rate
- Daily average, longest session
- Bar chart (Recharts)

### Export
- PDF invoice with client info, invoice number (UUID), and two layout modes:
  - **Hours Summary** — one row per day
  - **Detailed Log** — every session with IN/OUT times
- CSV export with full session data
- Custom date range

### Profile & Settings
- Hourly rate, pay period start day, timezone
- Weekly summary email toggle
- **Admin tab** (admins only): invite users, view pending invites, revoke access

### Auth
- Invite-only — admin sends invite via Supabase
- Password login or magic link
- Row Level Security on all tables
- Admin role via `user_metadata.role === 'admin'`

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=
CRON_SECRET=
```

> `DATABASE_URL` is your Supabase Postgres connection string (with `?pgbouncer=true&connection_limit=1` for pooled connections).

---

## Setup

```bash
# Install dependencies
npm install

# Push database schema and generate Prisma client
npx prisma db push

# Run in development (uses webpack for next-pwa compatibility)
npm run dev
```

---

## Database

Schema is defined in `prisma/schema.prisma`. To apply changes:

```bash
npx prisma db push        # sync schema to DB
npx prisma generate       # regenerate Prisma client (runs automatically with db push)
npx prisma studio         # visual DB browser
```

Key models: `User` (settings + rate + timezone), `Session` (timer data + notes + sync status).

---

## Build & Deploy

```bash
npm run build    # production build (webpack mode for next-pwa)
npm run start    # start production server locally
```

Deploy to Vercel by pushing to the connected GitHub branch. Set all environment variables in the Vercel dashboard before first deploy.

**Vercel cron** — add this to `vercel.json` for the weekly email job:

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

The cron endpoint requires an `Authorization: Bearer <CRON_SECRET>` header (Vercel sends this automatically when the secret is configured).

---

## Project Structure

```
/app
  /(auth)/login        — login page (password + magic link)
  /(protected)         — all authenticated routes
    /timer             — main timer + today's sessions
    /calendar          — monthly session calendar
    /stats             — earnings + hours dashboard
    /export            — PDF/CSV export
    /profile           — settings + admin (tabbed)
  /api                 — API routes (sessions, export, settings, admin, cron)
/components
  /timer               — ActiveTimer, TimerClock, TimerButton, SessionList
  /calendar            — CalendarView, DayModal
  /stats               — StatsCard, HoursChart
  /export              — ExportForm
  /profile             — ProfileTabs
  /admin               — InviteForm, UserList
  /settings            — SettingsForm
  /shared              — NavBar, DarkModeToggle, LoadingSpinner, ErrorBoundary
/lib
  /db                  — Prisma query functions (users, sessions)
  /hooks               — useTimer (start/stop + IndexedDB + sync)
  /indexeddb           — IndexedDB client
  /supabase            — server + client + service role Supabase clients
  /utils               — time, format, logger helpers
  /constants           — timezone list
  /types               — shared TypeScript types
/prisma
  schema.prisma
/tests
  *.spec.ts            — Playwright tests per feature
/plan
  plan.md              — implementation plan + bug log
/prompts
  initial.md           — original project prompt
```

---

## Testing

```bash
npx playwright test              # run all tests
npx playwright test timer        # run a single spec
npx playwright test --ui         # open Playwright UI
```

Tests live in `/tests`. Each feature has its own spec file. Tests use a dedicated Supabase test environment — never run against production.
