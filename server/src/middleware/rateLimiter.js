import rateLimit from "express-rate-limit";

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
  });

// Auth endpoints — prevent brute-force and credential stuffing
export const authLimiter = make(
  15 * 60 * 1000, // 15 min
  20,
  "Too many auth attempts from this IP. Please wait 15 minutes before trying again."
);

// AI routes — Gemini calls are expensive; protect quota
export const aiLimiter = make(
  60 * 60 * 1000, // 1 hour
  40,
  "AI request limit reached (40 per hour). Please wait before making more AI requests."
);

// Bulk operations — intentionally strict
export const bulkLimiter = make(
  60 * 60 * 1000, // 1 hour
  5,
  "Bulk operation limit reached (5 per hour). Please wait before running another batch."
);

// Contact / email sending — prevent spam
export const contactLimiter = make(
  60 * 60 * 1000, // 1 hour
  10,
  "Too many contact requests from this IP. Please wait before sending another message."
);

// General catch-all safety net applied globally
export const globalLimiter = make(
  15 * 60 * 1000, // 15 min
  500,
  "Too many requests from this IP. Please slow down."
);
