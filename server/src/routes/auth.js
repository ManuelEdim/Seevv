import { Router } from "express";
import authMiddleware from "../middleware/auth.js";

const router = Router();

// Get current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
