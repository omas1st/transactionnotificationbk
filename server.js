require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { verifyMailer } = require("./services/mailer");

const PORT = Number(process.env.PORT) || 5000;

let server;

/* ------------------------------------------------------------------ */
/*  Local development startup                                          */
/* ------------------------------------------------------------------ */

const start = async () => {
  try {
    await connectDB();
    await verifyMailer();

    server = app.listen(PORT, () => {
      console.log(
        `API listening on http://localhost:${PORT} [${
          process.env.NODE_ENV || "development"
        }]`
      );
      console.log(
        `Allowed client origins: ${
          process.env.CLIENT_URL || "http://localhost:3000"
        }`
      );
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

/* ------------------------------------------------------------------ */
/*  Graceful shutdown (local only)                                     */
/* ------------------------------------------------------------------ */

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully…`);

  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("HTTP server and MongoDB connection closed.");
      } catch (error) {
        console.error("Error during shutdown:", error.message);
      } finally {
        process.exit(0);
      }
    });

    // Force exit if connections hang.
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  // On Vercel, let the platform recycle the container instead of exiting.
  if (!process.env.VERCEL) {
    shutdown("uncaughtException");
  }
});

/* ------------------------------------------------------------------ */
/*  Entry point                                                        */
/* ------------------------------------------------------------------ */

/**
 * Vercel sets `VERCEL=1` in the runtime environment and invokes the
 * exported handler directly, so we must not call `app.listen()` there.
 * Locally, we start the HTTP server as usual.
 */
if (!process.env.VERCEL) {
  start();
}

/* Vercel's Node.js runtime wraps this export as a serverless function. */
module.exports = app;