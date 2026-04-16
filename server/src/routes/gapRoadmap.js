import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import {
  analyzeSkillGaps,
  generateMicroProjects,
  suggestCVBulletAfterProject,
} from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/gap-roadmap/analyze
// Analyse skill gaps for a job target against the user's active CV
router.post("/analyze", async (req, res) => {
  const { jobTargetId } = req.body;
  const userId = req.user.id;

  if (!jobTargetId) return res.status(400).json({ error: "jobTargetId required" });

  try {
    // Fetch job target
    const { data: job, error: jobErr } = await supabase
      .from("job_targets")
      .select("job_title, company_name, job_description")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();
    if (jobErr || !job) return res.status(404).json({ error: "Job target not found" });

    // Fetch active CV
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    if (cvErr || !cv) return res.status(404).json({ error: "No active CV found. Please upload your CV first." });

    const analysis = await analyzeSkillGaps(cv.raw_text, job.job_description);

    res.json({ analysis, jobTitle: job.job_title, company: job.company_name });
  } catch (err) {
    console.error("Gap analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gap-roadmap/micro-projects
// Generate micro-projects for gap skills
router.post("/micro-projects", async (req, res) => {
  const { gapSkills, jobTargetId } = req.body;
  const userId = req.user.id;

  if (!gapSkills?.length) return res.status(400).json({ error: "gapSkills required" });

  try {
    const { data: job } = await supabase
      .from("job_targets")
      .select("job_description")
      .eq("id", jobTargetId)
      .eq("user_id", userId)
      .single();

    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    const result = await generateMicroProjects(
      gapSkills,
      job?.job_description || "",
      cv?.raw_text || ""
    );

    res.json(result);
  } catch (err) {
    console.error("Micro-projects error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gap-roadmap/cv-update
// Suggest a CV bullet after completing a micro-project
router.post("/cv-update", async (req, res) => {
  const { projectTitle, projectDescription, targetRole } = req.body;
  const userId = req.user.id;

  if (!projectTitle || !projectDescription) {
    return res.status(400).json({ error: "projectTitle and projectDescription required" });
  }

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    const result = await suggestCVBulletAfterProject(
      projectTitle,
      projectDescription,
      targetRole || "",
      cv?.raw_text || ""
    );

    res.json(result);
  } catch (err) {
    console.error("CV update suggestion error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
