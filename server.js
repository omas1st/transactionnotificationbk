require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { verifyMailer } = require("./services/mailer");

const PORT = Number(process.env.PORT) || 5000;

let server;

const start = async () => {
  try {
    await connectDB();
    await verifyMailer();

    server = app.listen(PORT, () => {
      console.log(
        `API listening on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`
      );
      console.log(`Allowed client origins: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                  */
/* ------------------------------------------------------------------ */

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully…`);

  if (server) {
    server.close(async () => {
      try {
        const mongoose = require("mongoose");
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
  shutdown("uncaughtException");
});

start();