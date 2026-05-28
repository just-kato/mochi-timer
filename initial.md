# Initial Prompt — Time Tracker PWA

## Before You Write Any Code

1. Read `CLAUDE.md` in full
2. Read all files in `/prompts/`
3. Create `/plan/plan.md` with your full implementation plan
4. Do not write a single line of application code until `/plan/plan.md` exists

---

## What You Are Building

A PWA time tracking app for contractors who need independent, tamper-proof records of their hours worked. This is not a toy project. The data this app stores is legal documentation of work performed. Treat it accordingly.

---

## The App

Build a full-stack PWA time tracker with the following:

- Next.js (App Router) + TypeScript
- Tailwind CSS — flat design, mobile first
- Supabase (auth + database) + Prisma ORM
- Invite-only auth — admin invites users, no self-registration
- Role-based access — admin and user roles with RLS on all tables
- Start/stop timer with UUID session IDs and UTC timestamps
- Immutable session records — once stopped, a session cannot be edited
- IndexedDB offline support — sessions stored locally when offline, synced to Supabase on reconnect
- Calendar view — tap any past day to see hours and estimated pay
- Stats dashboard — hours, estimated pay, daily average, longest session, bar chart
- CSV and PDF export by date range
- Weekly summary emails via Resend (Vercel cron)
- User settings — hourly rate, pay period start, email toggle
- Admin panel — invite users, revoke access, view all user stats
- PWA — installable on mobile via next-pwa and service worker

---

## Your Workflow

For every feature:

1. Plan it in `/plan/plan.md` first
2. Write the code
3. Write the Playwright test
4. Run the test — it must pass
5. Document any bugs fixed in `/plan/plan.md` under `## Bugs`
6. Only then move to the next feature

---

## What You Must Never Do

- Never push to git
- Never deploy
- Never delete buggy code and call it fixed — fix it properly
- Never skip a test
- Never use `any` in TypeScript
- Never mark a feature complete if its test is failing
- Never duplicate logic — reusable code goes in `/lib`
