import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { analyzeIndustryTransition, rewriteCVForTransition } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// POST /api/transition/analyze
// Analyze what it takes to move from one industry to another
router.post("/analyze", async (req, res) => {
  const { originIndustry, targetIndustry, jobTargetId } = req.body;
  const userId = req.user.id;

  if (!originIndustry || !targetIndustry) {
    return res.status(400).json({ error: "originIndustry and targetIndustry required" });
  }

  try {
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (cvErr || !cv) return res.status(404).json({ error: "No active CV found. Please upload your CV first." });

    let targetJobDescription = "";
    if (jobTargetId) {
      const { data: job } = await supabase
        .from("job_targets")
        .select("job_description")
        .eq("id", jobTargetId)
        .eq("user_id", userId)
        .single();
      targetJobDescription = job?.job_description || "";
    }

    const result = await analyzeIndustryTransition(
      originIndustry,
      targetIndustry,
      cv.raw_text,
      targetJobDescription
    );

    res.json(result);
  } catch (err) {
    console.error("Transition analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transition/rewrite
// Rewrite the active CV using transition vocabulary
router.post("/rewrite", async (req, res) => {
  const { vocabularyMap, targetRole, targetIndustry } = req.body;
  const userId = req.user.id;

  if (!vocabularyMap || !targetRole || !targetIndustry) {
    return res.status(400).json({ error: "vocabularyMap, targetRole, and targetIndustry required" });
  }

  try {
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (cvErr || !cv) return res.status(404).json({ error: "No active CV found" });

    const result = await rewriteCVForTransition(
      cv.raw_text,
      vocabularyMap,
      targetRole,
      targetIndustry
    );

    res.json(result);
  } catch (err) {
    console.error("CV rewrite error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
