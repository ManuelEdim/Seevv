-- ─────────────────────────────────────────────────────────────
-- Seevv — RLS policy for app_settings API key rows
-- Run this in: Supabase dashboard → SQL Editor → New query
-- Safe to re-run (uses DROP IF EXISTS + CREATE)
-- ─────────────────────────────────────────────────────────────
-- The server reads ALL app_settings rows via SERVICE_ROLE_KEY
-- which bypasses RLS entirely — no change needed for server reads.
--
-- For client-side safety, ensure the existing RLS on app_settings
-- does NOT expose rows whose key ends in '_key' or '_dsn' to
-- non-admin users.

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only read for sensitive key rows; anyone can read non-key rows
DROP POLICY IF EXISTS "app_settings_select"       ON app_settings;
DROP POLICY IF EXISTS "app_settings_admin_write"  ON app_settings;
-- also drop any legacy permissive policy that may exist
DROP POLICY IF EXISTS "allow_read_app_settings"   ON app_settings;

CREATE POLICY "app_settings_select" ON app_settings
  FOR SELECT USING (
    (key NOT LIKE '%_key' AND key NOT LIKE '%_dsn')
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "app_settings_admin_write" ON app_settings
  FOR ALL
  USING  ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
