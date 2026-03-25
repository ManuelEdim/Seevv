import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { generateCoverLetterController } from "../controllers/coverLetterController.js";

const router = Router();

router.use(authMiddleware);

router.post("/generate", generateCoverLetterController);

export default router;
