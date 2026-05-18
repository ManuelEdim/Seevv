-- ─────────────────────────────────────────────────────────────
-- Seevv — Database indexes
-- Run this in: Supabase dashboard → SQL Editor → New query
-- Safe to run multiple times (all use IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────

-- profiles — searched by role and plan in admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan        ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at  ON profiles(created_at DESC);

-- cvs — every query filters by user_id
CREATE INDEX IF NOT EXISTS idx_cvs_user_id          ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at       ON cvs(created_at DESC);

-- cv_versions — filtered by user_id and cv_id
CREATE INDEX IF NOT EXISTS idx_cv_versions_user_id  ON cv_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id    ON cv_versions(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_created_at ON cv_versions(created_at DESC);

-- job_targets — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_job_targets_user_id  ON job_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_job_targets_status   ON job_targets(status);

-- cover_letters — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);

-- verification_requests — filtered by user_id, status, and (user_id, badge_type)
CREATE INDEX IF NOT EXISTS idx_verif_user_id        ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verif_status         ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verif_user_badge     ON verification_requests(user_id, badge_type);

-- proof_of_work — filtered by user_id
CREATE INDEX IF NOT EXISTS idx_proof_of_work_user_id ON proof_of_work(user_id);
