import { Router } from "express";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.json({
    message: "Get all jobs — coming in Phase 4",
    userId: req.user.id,
  });
});

router.post("/", (req, res) => {
  res.json({ message: "Create job target — coming in Phase 4" });
});

router.post("/:jobId/decode", (req, res) => {
  res.json({ message: "Decode job — coming in Phase 4" });
});

export default router;
