import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Load env vars before anything else
dotenv.config();

// ─── Sentry (optional — only active when SENTRY_DSN is set) ──
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

// Routes
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import cvRouter from "./routes/cv.js";
import jobsRouter from "./routes/jobs.js";
import decoderRouter from "./routes/decoder.js";
import coverLetterRouter from "./routes/coverLetter.js";
import exportRouter from "./routes/export.js";
import contactRouter from "./routes/contact.js";
import gapRoadmapRouter from "./routes/gapRoadmap.js";
import companyIntelRouter from "./routes/companyIntel.js";
import transitionRouter from "./routes/transition.js";
import proofOfWorkRouter from "./routes/proofOfWork.js";
import bulkRouter from "./routes/bulk.js";
import interviewRouter from "./routes/interview.js";
import analyticsRouter from "./routes/analytics.js";
import skillsRouter from "./routes/skills.js";
import recruiterRouter from "./routes/recruiter.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import voiceMirrorRouter from "./routes/voiceMirror.js";
import brandingRouter from "./routes/branding.js";
import apiAccessRouter from "./routes/apiAccess.js";
import verificationRouter from "./routes/verification.js";
import rejectionIntelRouter from "./routes/rejectionIntel.js";
import negotiationRouter from "./routes/negotiation.js";
import outreachRouter from "./routes/outreach.js";
import applyAssistRouter from "./routes/applyAssist.js";
import searchRouter from "./routes/search.js";
import userRouter from "./routes/user.js";
import promoRouter from "./routes/promo.js";
import shortlistsRouter from "./routes/shortlists.js";
import savedSearchesRouter from "./routes/savedSearches.js";
import cvReviewRouter from "./routes/cvReview.js";
import webhooksRouter from "./routes/webhooks.js";
import whitelabelRouter from "./routes/whitelabel.js";
import atsRouter from "./routes/ats.js";

// Middleware
import errorHandler from "./middleware/errorHandler.js";
import {
  globalLimiter,
  authLimiter,
  aiLimiter,
  bulkLimiter,
  contactLimiter,
} from "./middleware/rateLimiter.js";
import { isAIEnabled } from "./lib/aiProvider.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Trust proxy (Vercel sits behind a load balancer) ─────
// Required for req.ip to reflect the real client IP, not the proxy IP
app.set("trust proxy", 1);

// ─── Security middleware ───────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request logging ───────────────────────────────────────
// combined format in prod includes IP + user-agent (better for debugging)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Global rate limiter (safety net for all routes) ──────
app.use(globalLimiter);

// ─── Route-specific rate limits ────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/bulk", bulkLimiter);

// All AI-heavy routes share the same hourly quota
const AI_ROUTES = [
  "/api/decoder",
  "/api/cv",
  "/api/cover-letter",
  "/api/gap-roadmap",
  "/api/company-intel",
  "/api/transition",
  "/api/interview",
  "/api/voice-mirror",
  "/api/skills",
  "/api/branding",
  "/api/rejection-intel",
  "/api/negotiation",
  "/api/outreach",
  "/api/apply-assist",
];
app.use(AI_ROUTES, aiLimiter);
app.use(AI_ROUTES, async (req, res, next) => {
  const enabled = await isAIEnabled();
  if (!enabled) return res.status(503).json({ error: "AI features are currently disabled by the administrator." });
  next();
});

// ─── Routes ────────────────────────────────────────────────
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/cv", cvRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/decoder", decoderRouter);
app.use("/api/cover-letter", coverLetterRouter);
app.use("/api/export", exportRouter);
app.use("/api/contact", contactRouter);
app.use("/api/gap-roadmap", gapRoadmapRouter);
app.use("/api/company-intel", companyIntelRouter);
app.use("/api/transition", transitionRouter);
app.use("/api/proof-of-work", proofOfWorkRouter);
app.use("/api/bulk", bulkRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/voice-mirror", voiceMirrorRouter);
app.use("/api/branding", brandingRouter);
app.use("/api/api-access", apiAccessRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/rejection-intel", rejectionIntelRouter);
app.use("/api/negotiation", negotiationRouter);
app.use("/api/outreach", outreachRouter);
app.use("/api/apply-assist", applyAssistRouter);
app.use("/api/search", searchRouter);
app.use("/api/user", userRouter);
app.use("/api/promo", promoRouter);
app.use("/api/shortlists", shortlistsRouter);
app.use("/api/saved-searches", savedSearchesRouter);
app.use("/api/cv-review", cvReviewRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/whitelabel", whitelabelRouter);
app.use("/api/ats", atsRouter);

// ─── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

// ─── Sentry error capture (must be before errorHandler) ───
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ─── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ─── Startup checks ────────────────────────────────────────
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.warn(`⚠️  Missing env vars: ${missingEnv.join(", ")}`);
  console.warn("   AI features and auth will fail until these are set.");
}

app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────┐
  │         Seevv API Server            │
  │                                     │
  │  Status:  Running                   │
  │  Port:    ${PORT}                        │
  │  Mode:    ${process.env.NODE_ENV || "development"}       │
  │  GEMINI:  ${process.env.GEMINI_API_KEY ? "✓ set" : "✗ MISSING"}              │
  │  Sentry:  ${process.env.SENTRY_DSN ? "✓ active" : "○ not configured"}       │
  │  Health:  /api/health               │
  └─────────────────────────────────────┘
  `);
});

export default app;
