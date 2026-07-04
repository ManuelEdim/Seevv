-- ─────────────────────────────────────────────────────────────
-- Seevv — Application settings table (AI provider config, etc.)
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Seed defaults
INSERT INTO app_settings (key, value) VALUES
  ('ai_provider', 'gemini'),
  ('ai_enabled',  'true')
ON CONFLICT (key) DO NOTHING;

-- No RLS — this table is only accessed by the server using SERVICE_ROLE_KEY
