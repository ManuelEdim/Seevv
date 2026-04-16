import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { generateAnalyticsInsight } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// GET /api/analytics/applications
// Return application performance stats across all CV versions
router.get("/applications", async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: versions, error } = await supabase
      .from("cv_versions")
      .select(`
        id, version_name, match_score, ats_score, tone, created_at,
        job_target:job_targets(job_title, company_name, status, updated_at)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Derive stats from versions
    const stats = (versions || []).map((v) => ({
      id: v.id,
      versionName: v.version_name,
      matchScore: v.match_score || 0,
      atsScore: v.ats_score || 0,
      tone: v.tone,
      createdAt: v.created_at,
      jobTitle: v.job_target?.job_title || "Unknown",
      company: v.job_target?.company_name || "Unknown",
      status: v.job_target?.status || "saved",
    }));

    // Aggregate counts by status
    const statusCounts = stats.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    const avgMatchScore = stats.length
      ? Math.round(stats.reduce((s, v) => s + v.matchScore, 0) / stats.length)
      : 0;

    const topVersion = stats.reduce((best, v) => (!best || v.matchScore > best.matchScore ? v : best), null);

    res.json({
      versions: stats,
      summary: {
        total: stats.length,
        avgMatchScore,
        statusCounts,
        topVersion,
        interviews: (statusCounts.interview || 0) + (statusCounts.offer || 0),
        offers: statusCounts.offer || 0,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics/insight
// Generate AI insight from version performance
router.post("/insight", async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: versions } = await supabase
      .from("cv_versions")
      .select("version_name, match_score, ats_score, tone, job_target:job_targets(status)")
      .eq("user_id", userId)
      .order("match_score", { ascending: false })
      .limit(20);

    if (!versions?.length) {
      return res.status(400).json({ error: "Not enough data yet. Tailor more CVs first." });
    }

    const versionStats = versions.map((v) => ({
      name: v.version_name,
      matchScore: v.match_score,
      atsScore: v.ats_score,
      tone: v.tone,
      outcome: v.job_target?.status || "saved",
    }));

    const insight = await generateAnalyticsInsight(versionStats);
    res.json(insight);
  } catch (err) {
    console.error("Analytics insight error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
