import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { generateApplicationBundle } from "../lib/ai.js";

const router = Router();
router.use(authMiddleware);

// POST /api/apply-assist/bundle
// Generates a complete application package for a target role
router.post("/bundle", async (req, res) => {
  const { jobTargetId, jobDescription, roleTitle, company, applyUrl } = req.body;
  const userId = req.user.id;

  if (!roleTitle || !jobDescription) {
    return res.status(400).json({ error: "roleTitle and jobDescription are required" });
  }

  const [{ data: profile }, { data: cv }, coverLetterRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("cvs").select("raw_text").eq("user_id", userId).eq("is_active", true).maybeSingle(),
    jobTargetId
      ? supabase
          .from("cover_letters")
          .select("content")
          .eq("job_target_id", jobTargetId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  try {
    const bundle = await generateApplicationBundle(
      roleTitle,
      company,
      jobDescription,
      cv?.raw_text,
      profile?.full_name,
    );

    res.json({
      success: true,
      bundle,
      coverLetter: coverLetterRes?.data?.content || null,
      applyUrl: applyUrl || null,
    });
  } catch (err) {
    console.error("Apply assist bundle error:", err);
    res.status(500).json({ error: "Failed to generate application bundle. Please try again." });
  }
});

// GET /api/apply-assist/job-targets
// Returns job targets with job descriptions for quick selection
router.get("/job-targets", async (req, res) => {
  const userId = req.user.id;

  const { data: jobs } = await supabase
    .from("job_targets")
    .select("id, role_title, company, job_description, apply_url, status")
    .eq("user_id", userId)
    .not("job_description", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  res.json({ jobs: jobs || [] });
});

export default router;
