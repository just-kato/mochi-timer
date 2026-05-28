# Implementation Plan — Time Tracker PWA

> This file is created by Claude Code before any application code is written.
> It is a living document. Never delete content — append and annotate only.
> Last updated: [Claude Code fills this in]

---

## Implementation Order

[Claude Code fills this in]

---

## File Structure

[Claude Code fills this in]

---

## Auth Flow

[Claude Code fills this in — text-based diagram]

---

## Database Schema

[Claude Code fills this in]

---

## Test Plan

| Feature | Spec File | Tests | Status |
|---------|-----------|-------|--------|
| Auth | auth.spec.ts | | |
| Timer | timer.spec.ts | | |
| Offline | offline.spec.ts | | |
| Calendar | calendar.spec.ts | | |
| Stats | stats.spec.ts | | |
| Export | export.spec.ts | | |
| Email | email.spec.ts | | |
| Settings | settings.spec.ts | | |
| Admin | admin.spec.ts | | |

---

## Dependencies

[Claude Code fills this in with install order]

---

## Phases

[Claude Code fills this in]

---

## Known Risks

[Claude Code fills this in]

---

## Manual Setup Steps Required

- [ ] Disable public signups in Supabase dashboard
- [ ] Create admin user manually in Supabase
- [ ] Set `role: 'admin'` in user_metadata for admin user
- [ ] Add environment variables to Vercel before deploying
- [ ] Configure Vercel cron job for weekly email

---

## Bugs

> Document every bug here. Never delete bugs. Format:
> ### Bug [number]: [short description]
> **Discovered:** [when]
> **Cause:** [what caused it]
> **Fix:** [how it was resolved]
> **Test:** [which test now covers it]

[None yet]

---

## Progress Log

> Append entries as features are completed. Never delete entries.

[Claude Code fills this in as work progresses]
