import * as Sentry from "@sentry/node";

const errorHandler = (err, req, res, next) => {
  // Capture to Sentry when configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: { path: req.originalUrl, method: req.method } });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} →`, err);

  // Supabase / PostgREST errors
  if (err.code && err.code.startsWith("PGRST")) {
    return res.status(400).json({ error: "Database error", message: err.message });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation error", message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
