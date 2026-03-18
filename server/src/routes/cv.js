import { Router } from "express";
import authMiddleware from "../middleware/auth.js";

const router = Router();

// All CV routes are protected
router.use(authMiddleware);

// Placeholder routes — controllers built in Phase 4
router.get("/", (req, res) => {
  res.json({ message: "Get all CVs — coming in Phase 4", userId: req.user.id });
});

router.post("/upload", (req, res) => {
  res.json({ message: "Upload CV — coming in Phase 4" });
});

router.post("/:cvId/parse", (req, res) => {
  res.json({ message: "Parse CV — coming in Phase 4" });
});

export default router;
