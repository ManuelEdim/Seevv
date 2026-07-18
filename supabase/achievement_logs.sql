-- Achievement logs — daily/weekly/monthly career wins that feed into CV sections
CREATE TABLE IF NOT EXISTS achievement_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  description   text,
  date          date        NOT NULL DEFAULT CURRENT_DATE,
  category      text        NOT NULL DEFAULT 'career',   -- skill | career | project | certification | other
  period        text        NOT NULL DEFAULT 'daily',    -- daily | weekly | monthly
  impact_score  int         DEFAULT 5,                   -- 1–10 self-rated
  cv_sections   text[],                                  -- CV sections this feeds (experience, skills, etc.)
  tags          text[],
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievement_logs_user_date
  ON achievement_logs(user_id, date DESC);

ALTER TABLE achievement_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'achievement_logs'
    AND policyname = 'Users manage own achievement logs'
  ) THEN
    CREATE POLICY "Users manage own achievement logs"
      ON achievement_logs FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
