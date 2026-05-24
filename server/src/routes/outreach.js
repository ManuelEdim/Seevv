import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { generateOutreachMessages } from "../lib/ai.js";

const router = Router();
router.use(authMiddleware);

// POST /api/outreach/generate
// Generates personalized LinkedIn + email outreach messages for a specific recruiter
router.post("/generate", async (req, res) => {
  const { recruiterName, recruiterRole, company, targetRole, recruiterNotes, useVoice } = req.body;
  const userId = req.user.id;

  if (!recruiterName || !company || !targetRole) {
    return res.status(400).json({ error: "recruiterName, company, and targetRole are required" });
  }

  // Fetch active CV for personalization
  const { data: cv } = await supabase
    .from("cvs")
    .select("raw_text")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  // Fetch voice sample if requested
  let voiceSample = null;
  if (useVoice) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_sample")
      .eq("id", userId)
      .maybeSingle();
    voiceSample = profile?.voice_sample || null;
  }

  try {
    const messages = await generateOutreachMessages(
      recruiterName,
      recruiterRole,
      company,
      targetRole,
      recruiterNotes,
      cv?.raw_text,
      voiceSample,
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.error("Outreach generate error:", err);
    res.status(500).json({ error: "Failed to generate outreach messages. Please try again." });
  }
});

export default router;
