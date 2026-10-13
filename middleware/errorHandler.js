/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * central error handler instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 handler for any route that did not match. */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Central error handler. Normalises Mongoose / body-parser / custom errors
 * into a single consistent JSON envelope.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";

  /* Mongoose bad ObjectId */
  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${error.path}: ${error.value}`;
  }

  /* Mongoose validation */
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(" ");
  }

  /* Duplicate key */
  if (error.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(error.keyValue || {}).join(
      ", "
    )}`;
  }

  /* JSON body parser */
  if (error.type === "entity.too.large") {
    statusCode = 413;
    message = "Payload too large. Reduce the logo file size and try again.";
  }

  if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON payload.";
  }

  /* CORS rejection */
  if (String(error.message || "").startsWith("CORS blocked")) {
    statusCode = 403;
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${statusCode}] ${message}`);
    if (statusCode >= 500) console.error(error.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: error.stack }
      : {}),
  });
};

module.exports = { asyncHandler, notFound, errorHandler };