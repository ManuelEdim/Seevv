import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import {
  parseCVController,
  rewriteCVController,
  getMatchScore,
} from "../controllers/cvController.js";

const router = Router();

router.use(authMiddleware);

router.post("/parse", parseCVController);
router.post("/rewrite", rewriteCVController);
router.post("/match-score", getMatchScore);

export default router;
