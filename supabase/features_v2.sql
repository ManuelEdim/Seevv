-- ═══════════════════════════════════════════════════════════════
--  Seevv Features v2 — all new tables for product expansion
--  Run this in Supabase SQL Editor (safe to re-run)
--  Note: policies use DROP IF EXISTS + CREATE (IF NOT EXISTS is
--  invalid for policies in PostgreSQL)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Referral system ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code             text NOT NULL UNIQUE,
  referred_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  referred_email   text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','converted','rewarded')),
  reward_days      int  NOT NULL DEFAULT 30,
  converted_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx     ON referrals(code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_own" ON referrals;
CREATE POLICY "referrals_own" ON referrals
  USING (referrer_id = auth.uid());

-- ── 2. Promo codes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,
  description    text,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric(10,2) NOT NULL,
  applies_to     text,
  max_uses       int,
  used_count     int NOT NULL DEFAULT 0,
  valid_from     timestamptz,
  valid_until    timestamptz,
  active         boolean NOT NULL DEFAULT true,
  created_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan        text,
  amount_off  numeric(10,2),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

-- Rename is_active → active if this table was created by an older migration
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE promo_codes RENAME COLUMN is_active TO active;
  END IF;
END $$;

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_admin_write" ON promo_codes;
CREATE POLICY "promo_admin_write" ON promo_codes
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "promo_read_active" ON promo_codes;
CREATE POLICY "promo_read_active" ON promo_codes
  FOR SELECT USING (active = true);

ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_redemptions_own" ON promo_redemptions;
CREATE POLICY "promo_redemptions_own" ON promo_redemptions
  USING (user_id = auth.uid());

-- ── 3. Candidate shortlists (recruiter) ─────────────────────
CREATE TABLE IF NOT EXISTS candidate_shortlists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shortlists_recruiter_idx ON candidate_shortlists(recruiter_id);

CREATE TABLE IF NOT EXISTS shortlist_candidates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid NOT NULL REFERENCES candidate_shortlists(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note         text,
  rating       int CHECK (rating BETWEEN 1 AND 5),
  added_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shortlist_id, candidate_id)
);

ALTER TABLE candidate_shortlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shortlists_own" ON candidate_shortlists;
CREATE POLICY "shortlists_own" ON candidate_shortlists
  USING (recruiter_id = auth.uid());

ALTER TABLE shortlist_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shortlist_candidates_own" ON shortlist_candidates;
CREATE POLICY "shortlist_candidates_own" ON shortlist_candidates
  USING ((SELECT recruiter_id FROM candidate_shortlists WHERE id = shortlist_id) = auth.uid());

-- ── 4. Audit logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  details     jsonb DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_admin_idx   ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_admin_read" ON audit_logs;
CREATE POLICY "audit_admin_read" ON audit_logs
  FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ── 5. Saved job searches ────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  query           text,
  filters         jsonb DEFAULT '{}',
  alert_enabled   boolean NOT NULL DEFAULT false,
  last_alerted_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_searches_own" ON saved_searches;
CREATE POLICY "saved_searches_own" ON saved_searches
  USING (user_id = auth.uid());

-- ── 6. CV sharing (collaborative review) ────────────────────
CREATE TABLE IF NOT EXISTS cv_shares (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES cv_versions(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  title      text,
  expires_at timestamptz,
  active     boolean NOT NULL DEFAULT true,
  view_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cv_shares_user_idx  ON cv_shares(user_id);
CREATE INDEX IF NOT EXISTS cv_shares_token_idx ON cv_shares(token);

CREATE TABLE IF NOT EXISTS cv_share_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id   uuid NOT NULL REFERENCES cv_shares(id) ON DELETE CASCADE,
  author     text NOT NULL,
  content    text NOT NULL,
  section    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cv_share_comments_share_idx ON cv_share_comments(share_id);

ALTER TABLE cv_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cv_shares_own" ON cv_shares;
CREATE POLICY "cv_shares_own" ON cv_shares
  USING (user_id = auth.uid());

ALTER TABLE cv_share_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cv_share_comments_read" ON cv_share_comments;
CREATE POLICY "cv_share_comments_read" ON cv_share_comments
  FOR SELECT USING (true);

-- ── 7. User webhooks ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_webhooks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url           text NOT NULL,
  events        text[] NOT NULL DEFAULT ARRAY['cv.created','application.updated'],
  secret        text NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  active        boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  failure_count int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_webhooks_user_idx ON user_webhooks(user_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id   uuid NOT NULL REFERENCES user_webhooks(id) ON DELETE CASCADE,
  event        text NOT NULL,
  payload      jsonb DEFAULT '{}',
  status_code  int,
  success      boolean,
  error        text,
  delivered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_idx ON webhook_deliveries(webhook_id);

ALTER TABLE user_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_webhooks_own" ON user_webhooks;
CREATE POLICY "user_webhooks_own" ON user_webhooks
  USING (user_id = auth.uid());

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_deliveries_own" ON webhook_deliveries;
CREATE POLICY "webhook_deliveries_own" ON webhook_deliveries
  USING ((SELECT user_id FROM user_webhooks WHERE id = webhook_id) = auth.uid());

-- ── 8. Organizations (team accounts) ────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan       text NOT NULL DEFAULT 'pro',
  seats      int NOT NULL DEFAULT 5,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS org_members_user_idx ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_org_idx  ON organization_members(org_id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgs_member_read" ON organizations;
CREATE POLICY "orgs_member_read" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_own_read" ON organization_members;
CREATE POLICY "org_members_own_read" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR (SELECT owner_id FROM organizations WHERE id = org_id) = auth.uid()
  );

-- ── 9. Feature flags ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  description text,
  enabled     boolean NOT NULL DEFAULT false,
  rollout_pct int NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  applies_to  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_flags_admin" ON feature_flags;
CREATE POLICY "feature_flags_admin" ON feature_flags
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "feature_flags_read" ON feature_flags;
CREATE POLICY "feature_flags_read" ON feature_flags
  FOR SELECT USING (true);

-- ── 10. Content moderation ───────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_flags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id   text NOT NULL,
  reporter_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason       text,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  resolution   text,
  reviewed_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_status_idx  ON moderation_flags(status);
CREATE INDEX IF NOT EXISTS moderation_created_idx ON moderation_flags(created_at DESC);

ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "moderation_admin" ON moderation_flags;
CREATE POLICY "moderation_admin" ON moderation_flags
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "moderation_reporter_read" ON moderation_flags;
CREATE POLICY "moderation_reporter_read" ON moderation_flags
  FOR SELECT USING (reporter_id = auth.uid());

-- ── 11. Payment events (revenue dashboard) ───────────────────
CREATE TABLE IF NOT EXISTS payment_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  gateway     text NOT NULL,
  event_type  text NOT NULL,
  plan        text,
  amount      numeric(12,2),
  currency    text,
  gateway_ref text,
  raw_payload jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_events_user_idx    ON payment_events(user_id);
CREATE INDEX IF NOT EXISTS payment_events_created_idx ON payment_events(created_at DESC);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_events_admin" ON payment_events;
CREATE POLICY "payment_events_admin" ON payment_events
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "payment_events_own" ON payment_events;
CREATE POLICY "payment_events_own" ON payment_events
  FOR SELECT USING (user_id = auth.uid());

-- ── 12. Interview fields on job_targets ──────────────────────
ALTER TABLE job_targets ADD COLUMN IF NOT EXISTS interview_date   timestamptz;
ALTER TABLE job_targets ADD COLUMN IF NOT EXISTS interview_notes  text;
ALTER TABLE job_targets ADD COLUMN IF NOT EXISTS contact_name     text;
ALTER TABLE job_targets ADD COLUMN IF NOT EXISTS contact_email    text;
ALTER TABLE job_targets ADD COLUMN IF NOT EXISTS salary_discussed text;

-- ── 13. Profile extensions ───────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code         text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id                uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- ── 14. White-label config ───────────────────────────────────
CREATE TABLE IF NOT EXISTS whitelabel_configs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  custom_domain text UNIQUE,
  brand_name    text,
  logo_url      text,
  accent_color  text DEFAULT '#1d9e75',
  nav_color     text DEFAULT '#0d1f3c',
  support_email text,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whitelabel_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whitelabel_admin" ON whitelabel_configs;
CREATE POLICY "whitelabel_admin" ON whitelabel_configs
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ── 15. ATS integration registry ────────────────────────────
CREATE TABLE IF NOT EXISTS ats_integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ats_type     text NOT NULL CHECK (ats_type IN ('greenhouse','lever','workday','ashby','teamtailor')),
  api_key      text,
  subdomain    text,
  webhook_url  text,
  active       boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ats_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ats_integrations_own" ON ats_integrations;
CREATE POLICY "ats_integrations_own" ON ats_integrations
  USING (
    user_id = auth.uid()
    OR (SELECT owner_id FROM organizations WHERE id = org_id) = auth.uid()
  );

-- ── 16. RPC: increment promo used_count ─────────────────────
CREATE OR REPLACE FUNCTION increment_promo_count(promo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = promo_id;
$$;

-- ── Seed: default feature flags ──────────────────────────────
INSERT INTO feature_flags (key, description, enabled, rollout_pct, applies_to) VALUES
  ('cv_comparison',       'Side-by-side CV version comparison',           true,  100, 'all'),
  ('collaborative_review','Share CV for reviewer comments',               true,  100, 'starter'),
  ('bulk_outreach',       'Recruiter bulk messaging',                     true,  100, 'all'),
  ('ai_match_score',      'AI candidate ranking for recruiters',          true,  100, 'all'),
  ('webhook_delivery',    'Outbound webhook events for API users',        true,  100, 'pro_plus'),
  ('saved_searches',      'Save and alert on job board searches',         true,  100, 'all'),
  ('org_accounts',        'Multi-seat organization accounts',             false, 0,   'pro_plus'),
  ('ats_integrations',    'Push candidates to Greenhouse/Lever/Workday',  false, 0,   'pro_plus')
ON CONFLICT (key) DO NOTHING;
