-- RLS policies for Time Tracker PWA
-- Apply via: supabase db push OR paste into Supabase SQL editor
-- These policies must be in source control — do not apply manually without committing

-- ============================================================
-- User table
-- ============================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row
CREATE POLICY "Users can read own row"
  ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can only update their own row
CREATE POLICY "Users can update own row"
  ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- User row is created by the server (service role) on first login — no INSERT policy for anon/authed role

-- ============================================================
-- Session table
-- ============================================================

ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
CREATE POLICY "Users can read own sessions"
  ON "Session"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Users can only insert sessions for themselves
CREATE POLICY "Users can insert own sessions"
  ON "Session"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Users can only update their own sessions
-- Note: stopping a session (setting endTime) is the only permitted update
CREATE POLICY "Users can update own sessions"
  ON "Session"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- ============================================================
-- Notes
-- ============================================================
-- Admin API routes use the Supabase service role key (SUPABASE_SERVICE_ROLE_KEY)
-- which bypasses RLS entirely. No additional admin policies are needed.
-- Never use the service role key in browser/client code.
