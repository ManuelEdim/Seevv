import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { FEATURES, PLAN_HIERARCHY } from "../lib/features.js";
import { PROVIDER_REGISTRY, getProviderStatus, invalidateCache, getActiveProviderName, isAIEnabled } from "../lib/aiProvider.js";
import { PAYMENT_REGISTRY, getPaymentGatewayStatus, invalidatePaymentCache, getActiveGatewayName, isPaymentEnabled } from "../lib/paymentProvider.js";
import { EMAIL_REGISTRY, getEmailProviderStatus, invalidateEmailCache, getActiveEmailProviderName, isEmailEnabled } from "../lib/emailProvider.js";
import { getApiKey, saveApiKey, invalidateKeyCache, maskKey } from "../lib/keyStore.js";
import { sendVerificationApproved, sendVerificationRejected } from "../lib/emailService.js";

const router = express.Router();
router.use(auth);
router.use(adminOnly);

// ─── GET /api/admin/stats ──────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("role, plan, created_at");

    if (error) throw error;

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: profiles.length,
      byRole: { user: 0, recruiter: 0, admin: 0 },
      byPlan: { free: 0, starter: 0, pro: 0, pro_plus: 0 },
      newThisWeek: profiles.filter((p) => new Date(p.created_at) > weekAgo).length,
    };

    profiles.forEach((p) => {
      const role = p.role || "user";
      const plan = p.plan || "free";
      if (stats.byRole[role] !== undefined) stats.byRole[role]++;
      if (stats.byPlan[plan] !== undefined) stats.byPlan[plan]++;
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users ──────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { role, plan, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, plan, plan_expires_at, feature_overrides, created_at")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (role)   query = query.eq("role", role);
    if (plan)   query = query.eq("plan", plan);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ users: data || [], total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users/:id ──────────────────────────────
router.get("/users/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "User not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/users/:id ────────────────────────────
router.patch("/users/:id", async (req, res) => {
  const { role, plan, feature_overrides } = req.body;
  const updates = {};

  if (role !== undefined) {
    if (!["user", "recruiter", "admin"].includes(role))
      return res.status(400).json({ error: "Invalid role" });
    updates.role = role;
  }

  if (plan !== undefined) {
    if (!PLAN_HIERARCHY.includes(plan))
      return res.status(400).json({ error: "Invalid plan" });
    updates.plan = plan;
    if (plan !== "free") {
      updates.plan_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  if (feature_overrides !== undefined) {
    const validKeys = Object.keys(FEATURES);
    const sanitized = {};
    for (const [k, v] of Object.entries(feature_overrides)) {
      if (validKeys.includes(k) && (v === true || v === false || v === null)) {
        sanitized[k] = v;
      }
    }
    updates.feature_overrides = sanitized;
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: "No valid fields to update" });

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/admin/users/:id ───────────────────────────
router.delete("/users/:id", async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id)
    return res.status(400).json({ error: "Cannot delete your own admin account" });

  try {
    const { error: authErr } = await supabase.auth.admin.deleteUser(targetId);
    if (authErr) throw authErr;
    await supabase.from("profiles").delete().eq("id", targetId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/features ───────────────────────────────
router.get("/features", (req, res) => {
  res.json({ features: FEATURES, planHierarchy: PLAN_HIERARCHY });
});

// ─── GET /api/admin/content/cvs ───────────────────────────
router.get("/content/cvs", async (req, res) => {
  const { userId, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabase
      .from("cv_versions")
      .select("id, user_id, version_name, match_score, ats_score, tone, created_at, job_target:job_targets(job_title, company_name), profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ cvs: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/content/cover-letters ─────────────────
router.get("/content/cover-letters", async (req, res) => {
  const { userId, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabase
      .from("cover_letters")
      .select("id, user_id, tone, word_count, created_at, job_target:job_targets(job_title, company_name), profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ letters: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/content/proof-of-work ─────────────────
router.get("/content/proof-of-work", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = supabase
      .from("cv_evidence")
      .select("id, user_id, claim, proof_type, proof_url, created_at, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/stats/extended ────────────────────────
router.get("/stats/extended", async (req, res) => {
  try {
    const [
      { data: profiles },
      { data: cvVersions },
      { data: coverLetters },
      { data: jobTargets },
    ] = await Promise.all([
      supabase.from("profiles").select("role, plan, created_at"),
      supabase.from("cv_versions").select("created_at, match_score"),
      supabase.from("cover_letters").select("created_at"),
      supabase.from("job_targets").select("created_at"),
    ]);

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const avgMatchScore = cvVersions?.length
      ? Math.round(cvVersions.filter(v => v.match_score > 0).reduce((s, v) => s + v.match_score, 0) / cvVersions.filter(v => v.match_score > 0).length)
      : 0;

    res.json({
      totalUsers:        profiles?.length || 0,
      newThisWeek:       profiles?.filter(p => new Date(p.created_at) > weekAgo).length || 0,
      totalCVVersions:   cvVersions?.length || 0,
      totalCoverLetters: coverLetters?.length || 0,
      totalJobTargets:   jobTargets?.length || 0,
      avgMatchScore,
      byRole: {
        user:      profiles?.filter(p => (p.role || "user") === "user").length || 0,
        recruiter: profiles?.filter(p => p.role === "recruiter").length || 0,
        admin:     profiles?.filter(p => p.role === "admin").length || 0,
      },
      byPlan: {
        free:     profiles?.filter(p => (p.plan || "free") === "free").length || 0,
        starter:  profiles?.filter(p => p.plan === "starter").length || 0,
        pro:      profiles?.filter(p => p.plan === "pro").length || 0,
        pro_plus: profiles?.filter(p => p.plan === "pro_plus").length || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/verification-requests ─────────────────
router.get("/verification-requests", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("user_id, badge_type, status, requested_at, profile:profiles(full_name, email)")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    if (error) throw error;
    const requests = (data || []).map((r) => ({
      ...r,
      id: `${r.user_id}::${r.badge_type}`,
    }));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/verification-requests/approve ───────
router.patch("/verification-requests/approve", async (req, res) => {
  const { userId, badgeType } = req.body;
  if (!userId || !badgeType) return res.status(400).json({ error: "userId and badgeType required" });
  try {
    await supabase
      .from("verification_requests")
      .update({ status: "approved" })
      .eq("user_id", userId)
      .eq("badge_type", badgeType);

    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_badges")
      .eq("id", userId)
      .single();

    const badges = { ...(profile?.verification_badges || {}), [badgeType]: new Date().toISOString() };
    await supabase.from("profiles").update({ verification_badges: badges }).eq("id", userId);

    res.json({ success: true });

    // Fire-and-forget — email failure must not block the admin action
    sendVerificationApproved(userId, badgeType).catch((err) =>
      console.error("Verification approval email failed:", err.message)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/verification-requests/reject ────────
router.patch("/verification-requests/reject", async (req, res) => {
  const { userId, badgeType, reason } = req.body;
  if (!userId || !badgeType) return res.status(400).json({ error: "userId and badgeType required" });
  try {
    await supabase
      .from("verification_requests")
      .update({ status: "rejected" })
      .eq("user_id", userId)
      .eq("badge_type", badgeType);

    res.json({ success: true });

    sendVerificationRejected(userId, badgeType, reason || "").catch((err) =>
      console.error("Verification rejection email failed:", err.message)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/ai-settings ────────────────────────────
router.get("/ai-settings", async (req, res) => {
  try {
    const [activeProvider, enabled, providers] = await Promise.all([
      getActiveProviderName(),
      isAIEnabled(),
      getProviderStatus(),
    ]);
    res.json({ activeProvider, enabled, providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/ai-settings ────────────────────────────
router.put("/ai-settings", async (req, res) => {
  const { provider, enabled } = req.body;

  try {
    if (provider !== undefined) {
      if (!PROVIDER_REGISTRY[provider])
        return res.status(400).json({ error: `Unknown provider: ${provider}` });

      const { configured } = (await getProviderStatus())[provider] || {};
      if (!configured)
        return res.status(400).json({ error: `Cannot activate ${PROVIDER_REGISTRY[provider].label} — no API key saved yet.` });

      await supabase.from("app_settings").upsert(
        { key: "ai_provider", value: provider, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    if (enabled !== undefined) {
      await supabase.from("app_settings").upsert(
        { key: "ai_enabled", value: String(enabled), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    invalidateCache();

    const [activeProvider, aiEnabled, providers] = await Promise.all([
      getActiveProviderName(),
      isAIEnabled(),
      getProviderStatus(),
    ]);

    res.json({ success: true, activeProvider, enabled: aiEnabled, providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/ai-settings/key ───────────────────────
router.put("/ai-settings/key", async (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: "provider and key required" });
  if (!PROVIDER_REGISTRY[provider]) return res.status(400).json({ error: "Unknown provider" });

  const dbKey = PROVIDER_REGISTRY[provider].dbKey;
  await saveApiKey(dbKey, key.trim());
  invalidateCache();

  res.json({ configured: true, keyPreview: maskKey(key.trim()) });
});

// ─── GET /api/admin/payment-settings ───────────────────────
router.get("/payment-settings", async (req, res) => {
  try {
    const [activeGateway, enabled, gateways] = await Promise.all([
      getActiveGatewayName(),
      isPaymentEnabled(),
      getPaymentGatewayStatus(),
    ]);
    res.json({ activeGateway, enabled, gateways });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/payment-settings ───────────────────────
router.put("/payment-settings", async (req, res) => {
  const { gateway, enabled } = req.body;

  try {
    if (gateway !== undefined) {
      if (!PAYMENT_REGISTRY[gateway])
        return res.status(400).json({ error: `Unknown gateway: ${gateway}` });

      const gateways = await getPaymentGatewayStatus();
      if (!gateways[gateway]?.configured)
        return res.status(400).json({ error: `Cannot activate ${PAYMENT_REGISTRY[gateway].label} — no API key saved yet.` });

      await supabase.from("app_settings").upsert(
        { key: "payment_gateway", value: gateway, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    if (enabled !== undefined) {
      await supabase.from("app_settings").upsert(
        { key: "payment_enabled", value: String(enabled), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    invalidatePaymentCache();

    const [activeGateway, payEnabled, gateways] = await Promise.all([
      getActiveGatewayName(),
      isPaymentEnabled(),
      getPaymentGatewayStatus(),
    ]);

    res.json({ success: true, activeGateway, enabled: payEnabled, gateways });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/payment-settings/key ──────────────────
router.put("/payment-settings/key", async (req, res) => {
  const { gateway, key } = req.body;
  if (!gateway || !key) return res.status(400).json({ error: "gateway and key required" });
  if (!PAYMENT_REGISTRY[gateway]) return res.status(400).json({ error: "Unknown gateway" });

  const dbKey = PAYMENT_REGISTRY[gateway].dbKey;
  await saveApiKey(dbKey, key.trim());
  invalidatePaymentCache();

  res.json({ configured: true, keyPreview: maskKey(key.trim()) });
});

// ─── GET /api/admin/integrations ───────────────────────────
router.get("/integrations", async (req, res) => {
  try {
    const [activeEmail, emailEnabled, providers] = await Promise.all([
      getActiveEmailProviderName(),
      isEmailEnabled(),
      getEmailProviderStatus(),
    ]);

    const [sentryKey, notifyFrom] = await Promise.all([
      getApiKey("sentry_dsn", "SENTRY_DSN"),
      getApiKey("notify_from_email", "NOTIFY_FROM_EMAIL"),
    ]);

    res.json({
      email: { activeProvider: activeEmail, enabled: emailEnabled, providers, notifyFromEmail: notifyFrom || "" },
      sentry: {
        configured: !!sentryKey,
        keyPreview: sentryKey ? "••••" + sentryKey.slice(-8) : null,
        label: "Sentry (Error Tracking)",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/integrations/email ─────────────────────
router.put("/integrations/email", async (req, res) => {
  const { provider, enabled } = req.body;

  try {
    if (provider !== undefined) {
      if (!EMAIL_REGISTRY[provider])
        return res.status(400).json({ error: `Unknown email provider: ${provider}` });

      const providers = await getEmailProviderStatus();
      if (!providers[provider]?.configured)
        return res.status(400).json({ error: `Cannot activate ${EMAIL_REGISTRY[provider].label} — no API key saved yet.` });

      await supabase.from("app_settings").upsert(
        { key: "email_provider", value: provider, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    if (enabled !== undefined) {
      await supabase.from("app_settings").upsert(
        { key: "email_enabled", value: String(enabled), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }

    invalidateEmailCache();

    const [activeProvider, emailEnabled, providers] = await Promise.all([
      getActiveEmailProviderName(),
      isEmailEnabled(),
      getEmailProviderStatus(),
    ]);

    res.json({ success: true, activeProvider, enabled: emailEnabled, providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/integrations/email/key ─────────────────
router.put("/integrations/email/key", async (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: "provider and key required" });
  if (!EMAIL_REGISTRY[provider]) return res.status(400).json({ error: "Unknown email provider" });

  const dbKey = EMAIL_REGISTRY[provider].dbKey;
  await saveApiKey(dbKey, key.trim());
  invalidateEmailCache();

  res.json({ configured: true, keyPreview: maskKey(key.trim()) });
});

// ─── PUT /api/admin/integrations/email/from ───────────────
router.put("/integrations/email/from", async (req, res) => {
  const { from } = req.body;
  if (!from || !from.trim()) return res.status(400).json({ error: "from address required" });

  await saveApiKey("notify_from_email", from.trim());
  res.json({ saved: true, notifyFromEmail: from.trim() });
});

// ─── PUT /api/admin/integrations/sentry/key ───────────────
router.put("/integrations/sentry/key", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "key required" });

  await saveApiKey("sentry_dsn", key.trim());
  invalidateKeyCache("sentry_dsn");

  res.json({ configured: true });
});

// ─── GET /api/admin/audit-logs ────────────────────────────
router.get("/audit-logs", async (req, res) => {
  const { action, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabase
      .from("audit_logs")
      .select("id, action, target_type, target_id, details, created_at, admin:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (action) query = query.eq("action", action);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/revenue ───────────────────────────────
router.get("/revenue", async (req, res) => {
  try {
    const [paymentsRes, promoRes, profilesRes] = await Promise.all([
      supabase.from("payment_events").select("amount, currency, plan, gateway, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("promo_redemptions").select("amount_off, plan, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("plan, created_at"),
    ]);

    const events = paymentsRes.data || [];
    const redemptions = promoRes.data || [];
    const profiles = profilesRes.data || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const totalRevenue = events.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const recentRevenue = events
      .filter((e) => new Date(e.created_at) > thirtyDaysAgo)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const byPlan = events.reduce((acc, e) => {
      if (e.plan) acc[e.plan] = (acc[e.plan] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});

    const byGateway = events.reduce((acc, e) => {
      if (e.gateway) acc[e.gateway] = (acc[e.gateway] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});

    const promosApplied = redemptions.length;
    const totalDiscount = redemptions.reduce((s, r) => s + (Number(r.amount_off) || 0), 0);

    const paidUsers = profiles.filter((p) => p.plan && p.plan !== "free").length;

    res.json({
      totalRevenue,
      recentRevenue,
      byPlan,
      byGateway,
      promosApplied,
      totalDiscount,
      paidUsers,
      recentEvents: events.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/moderation ───────────────────────────
router.get("/moderation", async (req, res) => {
  const { status = "pending", limit = 50, offset = 0 } = req.query;
  try {
    const { data, error } = await supabase
      .from("moderation_flags")
      .select("id, content_type, content_id, reason, status, created_at, reporter:profiles(full_name, email)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) throw error;
    res.json({ flags: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/moderation/:id ─────────────────────
router.patch("/moderation/:id", async (req, res) => {
  const { status, resolution } = req.body;
  const VALID = ["reviewed", "actioned", "dismissed"];
  if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(", ")}` });

  try {
    const { data, error } = await supabase
      .from("moderation_flags")
      .update({ status, resolution, reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/feature-flags ────────────────────────
router.get("/feature-flags", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw error;
    res.json({ flags: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/feature-flags/:key ─────────────────
router.patch("/feature-flags/:key", async (req, res) => {
  const { enabled, rollout_pct, applies_to } = req.body;
  try {
    const updates = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (rollout_pct !== undefined) updates.rollout_pct = Math.min(100, Math.max(0, Number(rollout_pct)));
    if (applies_to !== undefined) updates.applies_to = applies_to;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("feature_flags")
      .update(updates)
      .eq("key", req.params.key)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/organizations ────────────────────────
router.get("/organizations", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*, members:organization_members(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ organizations: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/organizations ───────────────────────
router.post("/organizations", async (req, res) => {
  const { name, domain, plan } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name, domain, plan: plan || "starter", owner_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/organizations/:id ──────────────────
router.patch("/organizations/:id", async (req, res) => {
  const { name, domain, plan, active } = req.body;
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (domain !== undefined) updates.domain = domain;
    if (plan !== undefined) updates.plan = plan;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
