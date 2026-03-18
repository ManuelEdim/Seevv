const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Supabase errors
  if (err.code && err.code.startsWith("PGRST")) {
    return res.status(400).json({
      error: "Database error",
      message: err.message,
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      message: err.message,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
