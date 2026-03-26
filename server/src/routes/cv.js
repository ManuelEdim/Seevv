import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import {
  parseCVController,
  rewriteCVController,
  getMatchScore,
} from "../controllers/cvController.js";
import { supabase } from "../lib/supabase.js";

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

export default router;
