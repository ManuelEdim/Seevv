import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// ─── GET /api/user/export — GDPR data export ─────────────────
router.get("/export", async (req, res) => {
  const userId = req.user.id;

  try {
    const [profile, cvs, cvVersions, jobTargets, coverLetters, evidence, tracker] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("cvs").select("*").eq("user_id", userId),
      supabase.from("cv_versions").select("id, version_name, match_score, ats_score, tone, created_at").eq("user_id", userId),
      supabase.from("job_targets").select("*").eq("user_id", userId),
      supabase.from("cover_letters").select("id, content, tone, created_at").eq("user_id", userId),
      supabase.from("cv_evidence").select("*").eq("user_id", userId),
      supabase.from("job_targets").select("id, job_title, company_name, status, applied_at, interview_date").eq("user_id", userId).not("status", "is", null),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data,
      cvs: cvs.data || [],
      cv_versions: cvVersions.data || [],
      job_targets: jobTargets.data || [],
      cover_letters: coverLetters.data || [],
      cv_evidence: evidence.data || [],
      application_tracker: tracker.data || [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="seevv-data-export-${Date.now()}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/user/request-deletion ─────────────────────────
router.post("/request-deletion", async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", userId);

    res.json({ success: true, deleteAt: new Date(Date.now() + 14 * 86400_000).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/user/cancel-deletion ────────────────────────
router.delete("/cancel-deletion", async (req, res) => {
  const userId = req.user.id;
  try {
    await supabase
      .from("profiles")
      .update({ deletion_requested_at: null })
      .eq("id", userId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/user/mfa-status ────────────────────────────────
router.get("/mfa-status", async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(req.user.id);
    if (error) throw error;

    const factors = data?.user?.factors || [];
    const totpFactor = factors.find((f) => f.factor_type === "totp" && f.status === "verified");

    res.json({ enabled: !!totpFactor, factorId: totpFactor?.id || null });
  } catch (err) {
    // If admin API unavailable, return status based on token claims
    res.json({ enabled: false, factorId: null });
  }
});

// ─── GET /api/user/referral ───────────────────────────────────
router.get("/referral", async (req, res) => {
  const userId = req.user.id;

  try {
    // Get or generate referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .single();

    let code = profile?.referral_code;

    if (!code) {
      // Generate unique code from user id
      code = `SEV${userId.slice(0, 6).toUpperCase()}`;
      await supabase.from("profiles").update({ referral_code: code }).eq("id", userId);
    }

    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, status, converted_at, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const converted = (referrals || []).filter((r) => r.status === "converted").length;

    res.json({
      code,
      referralUrl: `${process.env.FRONTEND_URL || "https://seevv.io"}/signup?ref=${code}`,
      stats: { total: (referrals || []).length, converted },
      referrals: referrals || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
