import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { analyzeRejection, analyzeRejectionPatterns } from "../lib/ai.js";

const router = Router();
router.use(authMiddleware);

// POST /api/rejection-intel/analyze
// Analyzes a single rejected job target and persists the result
router.post("/analyze", async (req, res) => {
  const { jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) return res.status(400).json({ error: "jobTargetId is required" });

  const { data: job } = await supabase
    .from("job_targets")
    .select("role_title, company, job_description")
    .eq("id", jobTargetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!job) return res.status(404).json({ error: "Job target not found" });

  const { data: cvVersion } = await supabase
    .from("cv_versions")
    .select("tailored_content, match_score, ats_score")
    .eq("job_target_id", jobTargetId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const analysis = await analyzeRejection(
      job.role_title,
      job.company,
      job.job_description,
      cvVersion?.tailored_content,
      cvVersion?.match_score,
      cvVersion?.ats_score,
    );

    // Upsert into rejection_analyses table
    await supabase
      .from("rejection_analyses")
      .upsert(
        { user_id: userId, job_target_id: jobTargetId, analysis, updated_at: new Date().toISOString() },
        { onConflict: "user_id,job_target_id" },
      );

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Rejection intel analyze error:", err);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

// GET /api/rejection-intel/patterns
// Returns pattern analysis across all analyzed rejections for the user
router.get("/patterns", async (req, res) => {
  const userId = req.user.id;

  const { data: analyses } = await supabase
    .from("rejection_analyses")
    .select("analysis, job_targets(role_title, company)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!analyses || analyses.length === 0) {
    return res.json({ patterns: null, count: 0, jobs: [] });
  }

  const jobs = analyses.map((a) => ({
    role_title: a.job_targets?.role_title || "Unknown",
    company: a.job_targets?.company || "Unknown",
    analysis: a.analysis,
  }));

  if (jobs.length < 2) {
    return res.json({ patterns: null, count: jobs.length, jobs, message: "Analyze at least 2 rejections to unlock pattern detection" });
  }

  try {
    const patterns = await analyzeRejectionPatterns(jobs);
    res.json({ success: true, patterns, count: jobs.length, jobs });
  } catch (err) {
    console.error("Rejection patterns error:", err);
    res.json({ patterns: null, count: jobs.length, jobs });
  }
});

// GET /api/rejection-intel/list
// Returns all analyzed rejections for the user to pick from
router.get("/list", async (req, res) => {
  const userId = req.user.id;

  const { data: rejectedJobs } = await supabase
    .from("job_targets")
    .select("id, role_title, company, status, created_at")
    .eq("user_id", userId)
    .eq("status", "rejected")
    .order("created_at", { ascending: false });

  const { data: analyzed } = await supabase
    .from("rejection_analyses")
    .select("job_target_id")
    .eq("user_id", userId);

  const analyzedIds = new Set((analyzed || []).map((a) => a.job_target_id));

  res.json({
    jobs: (rejectedJobs || []).map((j) => ({ ...j, analyzed: analyzedIds.has(j.id) })),
  });
});

export default router;
