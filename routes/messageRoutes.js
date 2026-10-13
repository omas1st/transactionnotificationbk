const express = require("express");
const {
  sendMessage,
  getMessages,
  getMessageById,
  getStats,
} = require("../controllers/messageController");
const { validateSendMessage } = require("../middleware/validateMessage");
const { sendLimiter, readLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* ── Send ─────────────────────────────────────────────────────────── */
router.post("/send", sendLimiter, validateSendMessage, sendMessage);

/* ── Admin reads (authentication-free, as specified) ──────────────── */
router.get("/stats/summary", readLimiter, getStats);
router.get("/", readLimiter, getMessages);
router.get("/:id", readLimiter, getMessageById);

module.exports = router;