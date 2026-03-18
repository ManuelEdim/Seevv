import { Router } from "express";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.post("/analyze", (req, res) => {
  res.json({ message: "Analyze JD — coming in Phase 4" });
});

export default router;
