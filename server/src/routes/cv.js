import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import {
  parseCVController,
  rewriteCVController,
  getMatchScore,
} from "../controllers/cvController.js";
import { supabase } from "../lib/supabase.js";
import { detectBlindSpots } from "../lib/ai.js";

const router = Router();

router.use(authMiddleware);

router.post("/parse", parseCVController);
router.post("/rewrite", rewriteCVController);
router.post("/match-score", getMatchScore);

// ─── Save accept/reject decisions ────────────────────────
router.patch("/version/:versionId", async (req, res) => {
  const { versionId } = req.params;
  const { tailored_content } = req.body;
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("cv_versions")
      .update({
        tailored_content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", versionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, version: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Blind Spot Detector ─────────────────────────────────
router.post("/blind-spots", async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  try {
    const { data: version, error: vErr } = await supabase
      .from("cv_versions")
      .select("tailored_content, job_target_id")
      .eq("id", versionId)
      .eq("user_id", userId)
      .single();

    if (vErr || !version) return res.status(404).json({ error: "Version not found" });

    const { data: cv } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    let jd = "";
    if (version.job_target_id) {
      const { data: job } = await supabase
        .from("job_targets")
        .select("job_description")
        .eq("id", version.job_target_id)
        .single();
      jd = job?.job_description || "";
    }

    const blindSpots = await detectBlindSpots(cv?.raw_text || "", jd);
    res.json(Array.isArray(blindSpots) ? blindSpots : blindSpots.blind_spots || []);
  } catch (err) {
    console.error("Blind spots error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
