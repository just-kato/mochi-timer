# Prompt — Fix Node Version & Verify Environment

## Context

`npm run dev` is failing with `Cannot find module '../server/require-hook'` because the project is running on Node v25.3.0. Next.js 14 does not support Node v25. This must be fixed before any other work continues.

---

## Tasks

### 1. Create `.nvmrc` in the project root

Create a `.nvmrc` file in the project root containing:

```
20.18.0
```

This pins the project to Node 20 LTS which is fully supported by Next.js 14.

---

### 2. Create `.node-version` in the project root

Create a `.node-version` file containing the same value for tools that use this format:

```
20.18.0
```

---

### 3. Update `package.json` engines field

Add or update the `engines` field in `package.json` to enforce the correct Node version:

```json
"engines": {
  "node": ">=20.0.0 <21.0.0"
}
```

---

### 4. Update `plan/plan.md`

Append under `## Bugs`:

### Bug 001: Node v25 incompatibility
**Discovered:** Phase 0 scaffolding — first `npm run dev` attempt
**Cause:** Next.js 14 does not support Node v25. The `require-hook` module cannot be resolved on Node v25.
**Fix:** Pin project to Node 20 LTS via `.nvmrc` and `.node-version`. Added `engines` constraint to `package.json`.
**Test:** Server starts successfully with `npm run dev` on Node 20.
**User action required:** Run `nvm install 20.18.0 && nvm use 20.18.0` then `npm install` again before retrying `npm run dev`.

---

### 5. Update `plan/plan.md`

Append under `## Manual Setup Steps Required`:

- [ ] Install nvm if not already installed: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- [ ] Install and use correct Node version: `nvm install 20.18.0 && nvm use 20.18.0`
- [ ] Verify Node version: `node --version` should output `v20.18.0`
- [ ] Re-run `npm install` after switching Node versions
- [ ] Verify server starts: `npm run dev`

---

### 6. Verify setup checklist

After the files are created, confirm the following are all present in the project. Do not create anything missing — just report what is there and what is not so the user can review:

- [ ] `.nvmrc` exists with `20.18.0`
- [ ] `.node-version` exists with `20.18.0`
- [ ] `package.json` has `engines` field
- [ ] `.env.local.template` exists with all required variables
- [ ] `supabase/.env.template` exists
- [ ] `supabase/config.toml` exists
- [ ] `prisma/schema.prisma` exists
- [ ] `prisma/migrations/rls.sql` exists
- [ ] `plan/plan.md` exists and is updated
- [ ] `.gitignore` includes `.env.local`

Report each item as present or missing.

---

## Do Not

- Do not run `npm run dev`
- Do not run `nvm use` or `nvm install` — the user will do this
- Do not push to git
- Do not deploy
- Do not write any application code

## When Done

Output the full checklist results so the user can see exactly what is in place before they switch Node versions and retry.
