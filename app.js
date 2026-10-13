const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const messageRoutes = require("./routes/messageRoutes");
const {
  notFound,
  errorHandler,
} = require("./middleware/errorHandler");

const app = express();

/* ------------------------------------------------------------------ */
/*  Security & platform middleware                                     */
/* ------------------------------------------------------------------ */

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

/* ── CORS ─────────────────────────────────────────────────────────── */
const allowedOrigins = String(
  process.env.CLIENT_URL || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls and tools without an Origin header.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  })
);

/* ── Body parsers (large limit for base64 logos) ──────────────────── */
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));

/* ── Logging ──────────────────────────────────────────────────────── */
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) => req.originalUrl === "/api/health",
  })
);

/* ------------------------------------------------------------------ */
/*  Health check                                                       */
/* ------------------------------------------------------------------ */

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "transaction-notifier-api",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.use("/api/messages", messageRoutes);

/* Convenience alias so `/admin` on the API host also works. */
app.get("/admin", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "The admin panel lives on the React client. Open the client's /admin route.",
  });
});

/* ------------------------------------------------------------------ */
/*  Error handling                                                     */
/* ------------------------------------------------------------------ */

app.use(notFound);
app.use(errorHandler);

module.exports = app;