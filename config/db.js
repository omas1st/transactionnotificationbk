const mongoose = require("mongoose");

/**
 * Establishes a single shared MongoDB connection using Mongoose.
 * Throws if the connection cannot be established so the boot sequence
 * can fail fast instead of serving requests against a dead database.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });

  console.log(
    `MongoDB connected → ${connection.connection.host}/${connection.connection.name}`
  );

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost. Mongoose will attempt to reconnect.");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB error:", error.message);
  });

  return connection;
};

module.exports = connectDB;