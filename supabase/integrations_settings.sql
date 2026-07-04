-- ─────────────────────────────────────────────────────────────
-- Seevv — Integration settings: payment gateways, email providers
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

-- app_settings table must already exist (from app_settings.sql)
-- Run app_settings.sql first if you haven't already.

-- Payment gateway settings
INSERT INTO app_settings (key, value) VALUES
  ('payment_gateway', 'paystack'),
  ('payment_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Email provider settings
INSERT INTO app_settings (key, value) VALUES
  ('email_provider', 'resend'),
  ('email_enabled',  'true')
ON CONFLICT (key) DO NOTHING;
