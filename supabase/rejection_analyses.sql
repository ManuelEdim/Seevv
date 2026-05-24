-- ─────────────────────────────────────────────────────────────
-- Seevv — Rejection Intelligence table
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rejection_analyses (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_target_id uuid REFERENCES job_targets(id) ON DELETE CASCADE NOT NULL,
  analysis     jsonb NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, job_target_id)
);

CREATE INDEX IF NOT EXISTS idx_rejection_analyses_user_id
  ON rejection_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_rejection_analyses_job_target_id
  ON rejection_analyses(job_target_id);

ALTER TABLE rejection_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own rejection analyses" ON rejection_analyses;

CREATE POLICY "Users can manage own rejection analyses" ON rejection_analyses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
