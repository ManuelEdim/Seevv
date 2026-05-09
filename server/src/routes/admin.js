import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { FEATURES, PLAN_HIERARCHY } from "../lib/features.js";

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
// Query params: role, plan, search, limit, offset
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
// Allowed fields: role, plan, feature_overrides
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
    // Validate keys are known features
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
    // Delete from auth.users (cascades to profiles via FK if set up)
    const { error: authErr } = await supabase.auth.admin.deleteUser(targetId);
    if (authErr) throw authErr;

    // Also delete profile row in case there's no cascade
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
// All CV versions across all users (paginated)
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
      .from("proof_of_work")
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
      totalUsers:       profiles?.length || 0,
      newThisWeek:      profiles?.filter(p => new Date(p.created_at) > weekAgo).length || 0,
      totalCVVersions:  cvVersions?.length || 0,
      totalCoverLetters: coverLetters?.length || 0,
      totalJobTargets:  jobTargets?.length || 0,
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
    // Attach a synthetic id for client keying
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/verification-requests/reject ────────
router.patch("/verification-requests/reject", async (req, res) => {
  const { userId, badgeType } = req.body;
  if (!userId || !badgeType) return res.status(400).json({ error: "userId and badgeType required" });
  try {
    await supabase
      .from("verification_requests")
      .update({ status: "rejected" })
      .eq("user_id", userId)
      .eq("badge_type", badgeType);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
