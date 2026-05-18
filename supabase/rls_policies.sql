-- ─────────────────────────────────────────────────────────────
-- Seevv — Row Level Security policies
-- Run this in: Supabase dashboard → SQL Editor → New query
--
-- The server uses SERVICE_ROLE_KEY so it bypasses RLS entirely.
-- These policies only protect against direct client-side queries
-- (components and hooks that call Supabase directly from the browser).
-- ─────────────────────────────────────────────────────────────

-- ─── profiles ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── cvs ──────────────────────────────────────────────────
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CVs"   ON cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;

CREATE POLICY "Users can view own CVs" ON cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CVs" ON cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs" ON cvs
  FOR DELETE USING (auth.uid() = user_id);

-- ─── cv_versions ──────────────────────────────────────────
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CV versions"   ON cv_versions;
DROP POLICY IF EXISTS "Users can insert own CV versions" ON cv_versions;
DROP POLICY IF EXISTS "Users can delete own CV versions" ON cv_versions;

CREATE POLICY "Users can view own CV versions" ON cv_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV versions" ON cv_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CV versions" ON cv_versions
  FOR DELETE USING (auth.uid() = user_id);

-- ─── job_targets ──────────────────────────────────────────
ALTER TABLE job_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job targets"   ON job_targets;
DROP POLICY IF EXISTS "Users can insert own job targets" ON job_targets;
DROP POLICY IF EXISTS "Users can update own job targets" ON job_targets;
DROP POLICY IF EXISTS "Users can delete own job targets" ON job_targets;

CREATE POLICY "Users can view own job targets" ON job_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job targets" ON job_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job targets" ON job_targets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job targets" ON job_targets
  FOR DELETE USING (auth.uid() = user_id);

-- ─── cover_letters ────────────────────────────────────────
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cover letters"   ON cover_letters;
DROP POLICY IF EXISTS "Users can insert own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can delete own cover letters" ON cover_letters;

CREATE POLICY "Users can view own cover letters" ON cover_letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letters" ON cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters" ON cover_letters
  FOR DELETE USING (auth.uid() = user_id);

-- ─── verification_requests ────────────────────────────────
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification requests"   ON verification_requests;
DROP POLICY IF EXISTS "Users can insert own verification requests" ON verification_requests;

CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification requests" ON verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── proof_of_work ────────────────────────────────────────
ALTER TABLE proof_of_work ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own proof of work"   ON proof_of_work;
DROP POLICY IF EXISTS "Users can insert own proof of work" ON proof_of_work;
DROP POLICY IF EXISTS "Users can delete own proof of work" ON proof_of_work;

CREATE POLICY "Users can view own proof of work" ON proof_of_work
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proof of work" ON proof_of_work
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proof of work" ON proof_of_work
  FOR DELETE USING (auth.uid() = user_id);
