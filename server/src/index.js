import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Routes
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import cvRouter from "./routes/cv.js";
import jobsRouter from "./routes/jobs.js";
import decoderRouter from "./routes/decoder.js";
import coverLetterRouter from "./routes/coverLetter.js";
import exportRouter from "./routes/export.js";

// Middleware
import errorHandler from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security middleware ───────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────
// Only allow requests from our React frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parsing ──────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request logging ───────────────────────
// 'dev' format: METHOD /path STATUS - responseTime ms
app.use(morgan("dev"));

// ─── Routes ────────────────────────────────
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/cv", cvRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/decoder", decoderRouter);
app.use("/api/cover-letter", coverLetterRouter);
app.use("/api/export", exportRouter);

// ─── 404 handler ───────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ─── Global error handler ──────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────┐
  │         Seevv API Server            │
  │                                     │
  │  Status:  Running                   │
  │  Port:    ${PORT}                        │
  │  Mode:    ${process.env.NODE_ENV}          │
  │  Health:  /api/health               │
  └─────────────────────────────────────┘
  `);
});

export default app;
