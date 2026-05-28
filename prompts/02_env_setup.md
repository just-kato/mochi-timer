# Prompt — Environment Setup & Plan Update

## Read This Before Doing Anything

1. Read `CLAUDE.md`
2. Read `prompts/initial.md`
3. Read `plan/plan.md` in full
4. Complete all tasks below
5. Update `plan/plan.md` before doing anything else

---

## Tasks

### 1. Create `.env.local.template`

Create a `.env.local.template` file in the project root.

It must include every environment variable the app needs to run, with:
- The variable name
- A comment explaining what it is and where to get it
- A placeholder value (never a real value)
- Grouped by service

Include variables for:
- Supabase (project URL, anon key, service role key)
- Supabase CLI (database URL for Prisma, direct URL for migrations)
- Resend (API key)
- Cron security (cron secret)
- Next.js (any required Next public vars)
- App config (any app-level env vars)

Do not create `.env.local` — only the template file. `.env.local` is never committed.

Add `.env.local` to `.gitignore` if not already there.

---

### 2. Create `supabase/.env` template

The Supabase CLI requires its own env file separate from Next.js.

Create `supabase/.env.template` with the variables needed for:
- Supabase CLI login and project linking
- Local Supabase development (if applicable)
- Database connection for `prisma migrate deploy`

Include comments explaining each variable and where to find it in the Supabase dashboard.

---

### 3. Create `supabase/config.toml` scaffold

Create a basic `supabase/config.toml` with:
- Project reference placeholder
- Auth settings that enforce invite-only (disable signup)
- Email template references if needed

---

### 4. Update `plan/plan.md`

Append the following to `plan/plan.md` under a new section called `## Environment & Infrastructure`:

- List every env variable with its purpose
- Document which variables are public (NEXT_PUBLIC_*) vs private
- Document which variables are needed for local dev vs production
- Document the Supabase CLI setup steps in order
- Document the Prisma + Supabase connection setup
- Note that `.env.local` is never committed — only `.env.local.template` is

Also append the following fixes identified in the plan review under a new section `## Plan Review Fixes Required`:

1. Admin panel routes must always use the Supabase service role client — never the anon client. Document this explicitly in every admin API route plan.

2. Add these missing tests to `offline.spec.ts` in the test plan table:
   - Start timer offline → reconnect → verify no duplicate session created
   - Start timer online → go offline → stop timer → reconnect → verify correct endTime synced

3. Add `ErrorBoundary.tsx` to `/components/shared/` in the file structure. The timer must be wrapped in an error boundary to protect active sessions from component crashes.

4. Remove `@types/recharts` and `@types/jspdf` from the install order — both libraries ship their own types.

5. Add `vercel.json` to the file structure with the cron config:
   - Path: `/api/cron/weekly-email`
   - Schedule: `0 22 * * 0` (Sunday 10pm UTC)

6. Add `/prisma/migrations/rls.sql` to the file structure — RLS policies must be in source control, not applied manually.

7. Add a note to the Session model in the schema: `synced` defaults to `false` only for offline-created sessions. Sessions created online via the API must be created with `synced: true`. Update the `POST /api/sessions` route plan to reflect this.

8. Add rate limiting to `POST /api/admin/invite` — maximum 10 invites per hour per admin. Document the implementation approach in the plan.

9. Add `ErrorBoundary` wrapping to the Timer page in the Phase 2 implementation plan.

10. Add a note to the login flow: evaluate whether magic link only is sufficient for daily contractor use or whether password auth should be offered. Document the decision in the plan before implementing Phase 1.

---

## Do Not

- Do not write any application code
- Do not install any packages
- Do not push to git
- Do not deploy

## When Done

Confirm in your response:
- `.env.local.template` created ✓
- `supabase/.env.template` created ✓
- `supabase/config.toml` created ✓
- `plan/plan.md` updated with Environment & Infrastructure section ✓
- `plan/plan.md` updated with Plan Review Fixes Required section ✓
