const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

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

const FALLBACK_ORIGINS = [
  "https://banktransactionalert.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const envOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...FALLBACK_ORIGINS, ...envOrigins])
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // server-to-server, curl, Postman
  if (allowedOrigins.includes("*")) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow Vercel preview deployments (e.g. my-app-git-branch.vercel.app)
  if (/^https?:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // Do NOT throw — just deny without a CORS header so the browser blocks
    // cleanly instead of returning a 500 that obscures the real cause.
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

/* Explicitly answer preflight for every route. Some hosts route OPTIONS
   differently from other verbs — this guarantees a valid CORS response. */
app.options("*", cors(corsOptions));

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
/*  Database connection (cached across serverless invocations)         */
/* ------------------------------------------------------------------ */

/**
 * On Vercel, every cold start creates a fresh Node process. Caching the
 * connection on the global object lets warm invocations reuse it, which
 * avoids exhausting MongoDB's connection pool.
 */
let cachedConnection = global.__mongooseConnection;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
  }

  mongoose.set("strictQuery", true);

  if (!global.__mongooseConnectionPromise) {
    global.__mongooseConnectionPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      })
      .then((conn) => {
        cachedConnection = conn;
        global.__mongooseConnection = conn;
        console.log(
          `MongoDB connected → ${conn.connection.host}/${conn.connection.name}`
        );
        return conn;
      })
      .catch((error) => {
        // Reset so the next request can retry
        global.__mongooseConnectionPromise = null;
        throw error;
      });
  }

  return global.__mongooseConnectionPromise;
};

/* Ensure the DB is connected before every API request. This middleware
   no-ops when the connection is already live, so it costs nothing on warm
   invocations. The health check is skipped so it stays fast and reliable. */
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();

  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    return res.status(503).json({
      success: false,
      message:
        "Database temporarily unavailable. Please try again in a moment.",
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Health check                                                       */
/* ------------------------------------------------------------------ */

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "transaction-notifier-api",
    environment: process.env.NODE_ENV || "development",
    db:
      mongoose.connection.readyState === 1
        ? "connected"
        : mongoose.connection.readyState === 2
        ? "connecting"
        : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.use("/api/messages", messageRoutes);

/* Convenience alias so `/admin` on the API host also works. */
app.get("/admin", (_req, res) => {
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