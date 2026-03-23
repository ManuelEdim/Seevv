import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import {
  parseUploadedCV,
  rewriteCV,
  getMatchScore,
} from "../controllers/cvController.js";

const router = Router();

router.use(authMiddleware);

router.post("/parse", parseUploadedCV);
router.post("/rewrite", rewriteCV);
router.post("/match-score", getMatchScore);

export default router;
