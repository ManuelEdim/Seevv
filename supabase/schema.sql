-- ─────────────────────────────────────────────────────────────
-- Seevv — Core application tables
-- Run this FIRST, before indexes.sql and any other migration.
-- Safe to re-run (all statements use IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────

-- ── job_targets ───────────────────────────────────────────────
-- Must be created before cv_versions (FK dependency)
CREATE TABLE IF NOT EXISTS job_targets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_title        text        NOT NULL,
  company_name     text        NOT NULL,
  job_description  text,
  location         text,
  salary_range     text,
  job_url          text,
  status           text        NOT NULL DEFAULT 'saved'
                               CHECK (status IN ('saved','applied','interview','offer','rejected')),
  notes            text,
  applied_at       timestamptz,
  interview_date   timestamptz,
  interview_notes  text,
  contact_name     text,
  contact_email    text,
  salary_discussed text,
  match_score      numeric(5,2),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── cvs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cvs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name       text,
  file_type       text,
  file_url        text,
  raw_text        text,
  parsed_sections jsonb       DEFAULT '{}',
  is_active       boolean     NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── cv_versions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_id           uuid        NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  job_target_id   uuid        REFERENCES job_targets(id) ON DELETE SET NULL,
  version_name    text,
  tailored_content jsonb      DEFAULT '{}',
  match_score     numeric(5,2),
  ats_score       numeric(5,2),
  tone            text        DEFAULT 'balanced',
  is_active       boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── cover_letters ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cover_letters (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_target_id uuid        REFERENCES job_targets(id) ON DELETE SET NULL,
  content       text,
  tone          text        DEFAULT 'formal',
  word_count    int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── verification_requests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type   text        NOT NULL CHECK (badge_type IN ('identity','employment','education','skills')),
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (user_id, badge_type)
);

-- ── cv_evidence ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_evidence (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim       text        NOT NULL,
  proof_type  text,
  proof_url   text,
  proof_notes text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
