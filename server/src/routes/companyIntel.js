import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { analyzeCompanyIntelligence } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/company-intel
// Analyse a company for a given job target
router.post("/", async (req, res) => {
  const { jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) return res.status(400).json({ error: "jobTargetId required" });

  try {
    const { data: job, error: jobErr } = await supabase
      .from("job_targets")
      .select("job_title, company_name, job_description")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    if (jobErr || !job) return res.status(404).json({ error: "Job target not found" });

    const result = await analyzeCompanyIntelligence(
      job.company_name,
      job.job_title,
      job.job_description
    );

    res.json({ result, jobTitle: job.job_title, company: job.company_name });
  } catch (err) {
    console.error("Company intel error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
