import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { exportCVAsPdf } from "../controllers/exportController.js";

const router = Router();

router.use(authMiddleware);

router.post("/cv/pdf", exportCVAsPdf);

export default router;
