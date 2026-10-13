const rateLimit = require("express-rate-limit");

const windowMs =
  (Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000;

const max = Number(process.env.RATE_LIMIT_MAX_SENDS) || 100;

/** Throttles the send endpoint to protect the Gmail sending quota. */
const sendLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many send requests. Please wait ${Math.ceil(
      windowMs / 60000
    )} minutes and try again.`,
  },
});

/** Loose limiter applied to read-only admin endpoints. */
const readLimiter = rateLimit({
  windowMs,
  max: max * 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

module.exports = { sendLimiter, readLimiter };