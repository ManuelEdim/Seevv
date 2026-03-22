import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { decodeJobDescription } from "../controllers/decoderController.js";

const router = Router();

router.use(authMiddleware);

router.post("/analyze", decodeJobDescription);

export default router;
