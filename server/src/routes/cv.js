import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.json({
    message: "Get all CVs — coming in Phase 4",
    userId: req.user.id,
  });
});

// Upload route now uses multer middleware
router.post("/upload", upload.single("cv"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  res.json({
    message: "File received — parsing coming in Phase 4",
    file: {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
});

router.post("/:cvId/parse", (req, res) => {
  res.json({ message: "Parse CV — coming in Phase 4" });
});

export default router;
