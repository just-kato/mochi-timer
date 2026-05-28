# Time Tracker PWA — Claude Code Instructions

## FIRST THING — Before Writing Any Code

1. Read this entire file before doing anything
2. Create `/plan/plan.md` with your full implementation plan (see Plan Requirements below)
3. Wait — do not write any code until the plan file exists
4. Read `/prompts/` directory for any prompt files and follow them

---

## Plan Requirements

When you create `/plan/plan.md` it must include:

- Full feature list with implementation order
- File structure you will create
- Database schema
- Auth flow diagram (text-based)
- Test plan — every feature mapped to its Playwright test
- Dependencies and install order
- Known risks or complexity areas
- Estimated phases (Phase 1, Phase 2, etc.)

Update `/plan/plan.md` as you go. It is a living document. Never delete content from it — append and annotate only.

---

## Folder Structure — Required From Day One

```
/plan
  plan.md              ← Claude creates this before writing any code
/prompts
  initial.md           ← Starting prompt lives here
  [any future prompts] ← Additional prompts added here over time
/app
/components
/lib
/tests
/prisma
```

---

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS — flat design only
- **Database:** Supabase + Prisma ORM
- **Auth:** Supabase Auth — invite-only
- **Deployment:** Vercel
- **Email:** Resend
- **Offline:** IndexedDB via idb, syncs to Supabase when reconnected
- **PWA:** next-pwa with service worker
- **Charts:** Recharts
- **Export:** jsPDF (PDF), csv-stringify (CSV)
- **Testing:** Playwright

---

## Critical Rules — Non-Negotiable

1. **Read CLAUDE.md and all files in /prompts before starting**
2. **Create /plan/plan.md before writing any code**
3. **Git push is allowed** — run `git push` when the user explicitly asks to push or deploy. Always confirm the branch and summarize what is being pushed before running.
4. **Vercel deploy is allowed** — run `vercel --prod` when the user explicitly asks to deploy. Confirm the environment and verify the build is clean first.
5. **Every major feature must have a Playwright test before it is considered complete**
6. **Do not skip tests** — if you build it, you test it immediately
7. **Write optimal code** — no shortcuts, no lazy implementations, no placeholder logic
8. **Never delete bugs and call them fixed** — if a bug exists, fix it properly or document it in `/plan/plan.md` under a Bugs section with full context. Deleting buggy code and pretending the feature works is not acceptable
9. **Do not use `any` in TypeScript** — proper types always
10. **Flat design only** — no gradients, no heavy shadows, no decorative elements
11. **Never mark a feature complete if its test is failing**

---

## Bug Handling Protocol

When you encounter a bug:

1. Do not delete the code
2. Do not comment it out and move on
3. Fix it properly
4. Write or update the test to cover it
5. Document it in `/plan/plan.md` under `## Bugs` with:
   - What the bug was
   - What caused it
   - How it was fixed
   - Which test now covers it

---

## Code Quality Standards

- TypeScript strict mode — no `any`, no implicit types
- Every function must have explicit return types
- Every API route must validate input
- Every database query must handle errors
- Every component must handle loading and error states
- No console.log left in production code — use a proper logger
- Reusable logic goes in `/lib` — never duplicate code across components

---

## User Roles & Permissions

### Admin
- Full access to all features
- Can invite new users via email (Supabase invite flow)
- Can view all users and their activity
- Can revoke user access
- Can export any user's data

### User (Contractor)
- Can only access their own data
- Cannot see other users
- Cannot invite others
- Can set their own hourly rate in settings
- Can export their own data (CSV, PDF)
- Must be invited by admin — self-registration is disabled

### Auth Rules
- Disable public signups in Supabase dashboard (manual step — document this in plan.md)
- Use Supabase `invite_user_by_email` for all new accounts
- Row Level Security (RLS) enabled on ALL tables — no exceptions
- Users can only read/write their own rows
- Admin role checked via `user_metadata.role === 'admin'`

---

## Features & Required Playwright Tests

### 1. Auth — Invite Only
- Admin invites user by email
- User receives email, sets password, logs in
- Non-invited users cannot create accounts

**Tests:**
- `auth.spec.ts` — invited user can log in
- `auth.spec.ts` — non-invited email is rejected
- `auth.spec.ts` — admin can invite a new user

---

### 2. Timer
- Start/stop timer with one tap
- Active timer persists across page refresh (stored in Supabase + IndexedDB)
- Notes field per session
- Each session gets a UUID and UTC timestamp on creation
- Sessions are immutable once stopped — no editing, only annotation

**Tests:**
- `timer.spec.ts` — start timer, verify it is running
- `timer.spec.ts` — stop timer, verify session saved with UUID and UTC timestamp
- `timer.spec.ts` — timer persists after page refresh
- `timer.spec.ts` — stopped session cannot be edited

---

### 3. Offline Support
- If user loses connection, IndexedDB stores the active session locally
- When connection restores, pending sessions sync to Supabase automatically
- UI shows offline indicator when disconnected
- UI shows sync status when reconnected

**Tests:**
- `offline.spec.ts` — simulate offline, start/stop timer, verify stored in IndexedDB
- `offline.spec.ts` — simulate reconnect, verify session synced to Supabase

---

### 4. Calendar View
- Full calendar showing past days
- Tap any day to see: sessions list, total hours, total estimated pay
- Current day highlighted
- Days with logged hours visually marked
- No future date selection

**Tests:**
- `calendar.spec.ts` — past day with sessions shows correct hours and pay
- `calendar.spec.ts` — empty day shows zero state
- `calendar.spec.ts` — future dates are not selectable

---

### 5. Stats Dashboard
- Total hours this week
- Total hours this pay period
- Estimated pay (hours x hourly rate)
- Daily average hours
- Longest single session
- Bar chart of hours per day (Recharts)
- Pay period selector (weekly default)

**Tests:**
- `stats.spec.ts` — stats reflect actual logged sessions
- `stats.spec.ts` — estimated pay calculates correctly against hourly rate
- `stats.spec.ts` — chart renders with correct data points

---

### 6. Export
- Export by custom date range
- PDF export: sessions list, daily totals, grand total hours, estimated pay
- CSV export: raw session data with UUID, start time, end time, duration, notes

**Tests:**
- `export.spec.ts` — PDF downloads with correct data
- `export.spec.ts` — CSV downloads with correct columns and data
- `export.spec.ts` — date range filter works correctly

---

### 7. Weekly Summary Email (Resend)
- Sent every Sunday night automatically via Vercel cron job
- Contains: total hours that week, estimated pay, day-by-day breakdown
- User can toggle on/off in settings
- Admin can trigger manually

**Tests:**
- `email.spec.ts` — verify Resend API call is made with correct payload
- `email.spec.ts` — email toggle in settings persists

---

### 8. User Settings
- Set hourly rate
- Set pay period start day
- Toggle weekly summary email on/off
- Display timezone (UTC stored, local displayed)

**Tests:**
- `settings.spec.ts` — hourly rate saves and reflects in stats
- `settings.spec.ts` — pay period start day updates stats correctly

---

### 9. Admin Panel
- View all users
- Invite new user by email
- Revoke user access
- View any user's stats (read only)

**Tests:**
- `admin.spec.ts` — admin can view user list
- `admin.spec.ts` — admin can invite user
- `admin.spec.ts` — admin can revoke access
- `admin.spec.ts` — regular user cannot access admin panel

---

## Database Schema (Prisma)

```prisma
model User {
  id             String    @id @default(uuid())
  email          String    @unique
  role           String    @default("user") // "admin" | "user"
  hourlyRate     Float     @default(0)
  payPeriodStart Int       @default(1) // day of week 0-6
  emailSummary   Boolean   @default(true)
  sessions       Session[]
  createdAt      DateTime  @default(now())
}

model Session {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  startTime DateTime
  endTime   DateTime?
  duration  Int?      // seconds
  notes     String?
  synced    Boolean   @default(false)
  createdAt DateTime  @default(now())
}
```

---

## Playwright Setup

- Use `@playwright/test`
- Tests live in `/tests` directory
- One spec file per feature
- Use `test.describe` to group related tests
- Use Supabase test environment — never run tests against production
- Seed test data before each test, clean up after
- Run with `npx playwright test`
- No CI config — never auto-run on push

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=
CRON_SECRET=
```

---

## Design Rules

- Flat design — no gradients, no heavy shadows, no decorative elements
- Tailwind utility classes only
- Mobile first — this is a PWA used on phones
- Every interactive element must have a clear tap target (minimum 44px)
- Loading states on every async action
- Error states on every form and data fetch
- Empty states on every list and calendar view
