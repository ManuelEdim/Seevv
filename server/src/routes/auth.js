import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { sendWelcome } from "../lib/emailService.js";

const router = Router();

// GET /api/auth/me — returns auth user + profile (role, plan, feature_overrides)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
      profile: req.user.profile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/welcome — called by client immediately after signup
// Sends the welcome email; fire-and-forget (client doesn't need to wait)
router.post("/welcome", authMiddleware, async (req, res) => {
  sendWelcome(req.user.id).catch((err) =>
    console.error("Welcome email failed:", err.message)
  );
  res.json({ ok: true });
});

export default router;
