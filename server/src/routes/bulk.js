import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { quickScoreCV } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/bulk/score
// Quick-score the active CV against multiple job targets
router.post("/score", async (req, res) => {
  const { jobTargetIds } = req.body;
  const userId = req.user.id;

  if (!jobTargetIds?.length) return res.status(400).json({ error: "jobTargetIds required" });
  if (jobTargetIds.length > 10) return res.status(400).json({ error: "Max 10 jobs per batch" });

  try {
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (cvErr || !cv) return res.status(404).json({ error: "No active CV found. Please upload your CV first." });

    const { data: jobs, error: jobsErr } = await supabase
      .from("job_targets")
      .select("id, job_title, company_name, job_description")
      .in("id", jobTargetIds)
      .eq("user_id", userId);

    if (jobsErr) throw jobsErr;
    if (!jobs?.length) return res.status(404).json({ error: "No matching job targets found" });

    // Score all jobs in parallel
    const results = await Promise.all(
      jobs.map(async (job) => {
        try {
          const score = await quickScoreCV(cv.raw_text, job.job_description);
          return { jobId: job.id, jobTitle: job.job_title, company: job.company_name, ...score };
        } catch {
          return {
            jobId: job.id,
            jobTitle: job.job_title,
            company: job.company_name,
            overall_score: 0,
            verdict: "Error",
            top_gaps: [],
            quick_wins: [],
            error: true,
          };
        }
      })
    );

    // Sort by score descending
    results.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));

    res.json({ results, cvSnippet: cv.raw_text.slice(0, 100) });
  } catch (err) {
    console.error("Bulk score error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
