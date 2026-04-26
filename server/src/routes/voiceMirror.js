import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { rewriteCVSection } from "../lib/ai.js";

const router = Router();
router.use(authMiddleware);

// POST /api/voice-mirror
// Rewrites a CV section or free text in the user's personal voice
router.post("/", async (req, res) => {
  const { voiceSample, mode, content, sectionType, cvVersionId } = req.body;
  const userId = req.user.id;

  if (!voiceSample || voiceSample.trim().length < 50) {
    return res.status(400).json({ error: "Voice sample must be at least 50 characters." });
  }

  try {
    // mode: "freetext" | "cv_section" | "cv_version"
    if (mode === "freetext") {
      if (!content || !sectionType) return res.status(400).json({ error: "content and sectionType required" });
      const rewritten = await rewriteCVSection(sectionType, content, "", voiceSample);
      return res.json({ rewritten });
    }

    if (mode === "cv_version") {
      if (!cvVersionId) return res.status(400).json({ error: "cvVersionId required" });

      const { data: version, error: vErr } = await supabase
        .from("cv_versions")
        .select("tailored_content, job_target_id")
        .eq("id", cvVersionId)
        .eq("user_id", userId)
        .single();

      if (vErr || !version) return res.status(404).json({ error: "CV version not found" });

      let jd = "";
      if (version.job_target_id) {
        const { data: job } = await supabase
          .from("job_targets")
          .select("job_description")
          .eq("id", version.job_target_id)
          .single();
        jd = job?.job_description || "";
      }

      const tc = version.tailored_content || {};
      const results = {};

      if (tc.summary?.tailored || tc.summary?.original) {
        const text = tc.summary.tailored || tc.summary.original;
        results.summary = await rewriteCVSection("summary", text, jd, voiceSample);
      }

      if (tc.skills) {
        const skillText = Array.isArray(tc.skills.bullets_tailored)
          ? tc.skills.bullets_tailored.join("\n")
          : tc.skills.tailored || "";
        if (skillText) results.skills = await rewriteCVSection("skills", skillText, jd, voiceSample);
      }

      return res.json({ sections: results, cvVersionId });
    }

    return res.status(400).json({ error: "Invalid mode. Use freetext or cv_version." });
  } catch (err) {
    console.error("Voice mirror error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
