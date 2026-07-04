-- ─────────────────────────────────────────────────────────────
-- Seevv — Profiles schema + Database indexes
-- Run this in: Supabase dashboard → SQL Editor → New query
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────

-- ── profiles: add app-specific columns if missing ────────────
-- The base profiles table is created automatically by Supabase auth.
-- These ALTER statements add the columns the app depends on.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role               text NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan               text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at    timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feature_overrides  jsonb DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country            text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nysc_status        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_sample       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by        text;

-- Add unique constraint on referral_code if not already there
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_referral_code_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

-- ── indexes ──────────────────────────────────────────────────

-- profiles — searched by role and plan in admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan       ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- cvs — every query filters by user_id
CREATE INDEX IF NOT EXISTS idx_cvs_user_id         ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at      ON cvs(created_at DESC);

-- cv_versions — filtered by user_id and cv_id
CREATE INDEX IF NOT EXISTS idx_cv_versions_user_id   ON cv_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id     ON cv_versions(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_created_at ON cv_versions(created_at DESC);

-- job_targets — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_job_targets_user_id ON job_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_job_targets_status  ON job_targets(status);

-- cover_letters — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);

-- verification_requests — filtered by user_id, status, and (user_id, badge_type)
CREATE INDEX IF NOT EXISTS idx_verif_user_id    ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verif_status     ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verif_user_badge ON verification_requests(user_id, badge_type);

-- cv_evidence — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_cv_evidence_user_id ON cv_evidence(user_id);
