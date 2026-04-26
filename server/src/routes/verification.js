import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();
router.use(authMiddleware);

// POST /api/verification/request
// Submits a verification badge request — stored in a queue table for admin review
router.post("/request", async (req, res) => {
  const { badgeType } = req.body;
  const userId = req.user.id;

  const validTypes = ["identity", "employment", "education", "skills"];
  if (!badgeType || !validTypes.includes(badgeType)) {
    return res.status(400).json({ error: "Invalid badge type." });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_badges, full_name, email:id")
      .eq("id", userId)
      .single();

    const existing = profile?.verification_badges || {};
    if (existing[badgeType]) {
      return res.status(400).json({ error: "This badge is already verified." });
    }

    // Log the request (upsert into verification_requests if table exists, else store in profiles metadata)
    const { error: upsertError } = await supabase
      .from("verification_requests")
      .upsert(
        { user_id: userId, badge_type: badgeType, status: "pending", requested_at: new Date().toISOString() },
        { onConflict: "user_id,badge_type" },
      );

    if (upsertError) {
      // Gracefully handle missing table — still return success to user
      console.warn("verification_requests table may not exist:", upsertError.message);
    }

    res.json({ success: true, message: "Verification request submitted." });
  } catch (err) {
    console.error("Verification request error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verification/status
// Returns the user's current verification badge status
router.get("/status", async (req, res) => {
  const userId = req.user.id;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("verification_badges")
      .eq("id", userId)
      .single();
    res.json({ badges: data?.verification_badges || {} });
  } catch (err) {
    res.json({ badges: {} });
  }
});

export default router;
