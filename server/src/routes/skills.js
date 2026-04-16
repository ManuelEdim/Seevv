import express from "express";
import { supabase } from "../lib/supabase.js";
import auth from "../middleware/auth.js";
import { extractSkillProfile } from "../lib/ai.js";

const router = express.Router();
router.use(auth);

// GET /api/skills/profile
// Extract and return a skill profile from the user's active CV
router.get("/profile", async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: cv, error: cvErr } = await supabase
      .from("cvs")
      .select("raw_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (cvErr || !cv?.raw_text) {
      return res.status(404).json({ error: "No active CV found. Please upload your CV first." });
    }

    const profile = await extractSkillProfile(cv.raw_text);
    res.json(profile);
  } catch (err) {
    console.error("Skills profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
