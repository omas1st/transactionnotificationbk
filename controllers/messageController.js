const mongoose = require("mongoose");
const Message = require("../models/Message");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendBulkMail } = require("../services/mailer");
const { uploadLogoFromDataUri } = require("../services/cloudinary");
const { escapeRegex } = require("../utils/helpers");

/* ------------------------------------------------------------------ */
/*  POST /api/messages/send                                            */
/* ------------------------------------------------------------------ */

/**
 * Persists the message, then attempts delivery to every recipient.
 *
 * When the user uploaded a logo, the base64 payload is uploaded to
 * Cloudinary first. If the upload fails, the message is still sent but
 * without a logo — no base64 or inline CID fallback is used.
 */
const sendMessage = asyncHandler(async (req, res) => {
  const payload = req.messagePayload;

  /* ── Step 1: Upload uploaded logos to Cloudinary ─────────────────── */
  let cloudinaryUrl = "";
  let cloudinaryPublicId = "";

  if (payload.logoMode === "upload" && payload.logoData) {
    try {
      const info = await uploadLogoFromDataUri(
        payload.logoData,
        `logo-${payload.transactionNumber}`
      );

      cloudinaryUrl = info.url;
      cloudinaryPublicId = info.publicId;

      // Replace the base64 with the hosted URL so the email, DB record,
      // and admin panel all reference the same asset.
      payload.logo = cloudinaryUrl;
      payload.logoUrl = cloudinaryUrl;
    } catch (error) {
      // No fallback — log the failure and send the email without a logo.
      console.warn(
        `Cloudinary upload failed for transaction ${payload.transactionNumber}: ${error.message}. ` +
          "Message will be delivered without a logo."
      );

      cloudinaryUrl = "";
      cloudinaryPublicId = "";
      payload.logo = "";
      payload.logoUrl = "";
    }
  }

  /* ── Step 2: Store the record with a `queued` status ─────────────── */
  const record = await Message.create({
    ...payload,
    // The base64 payload is never persisted.
    logoData: "",
    cloudinaryUrl,
    cloudinaryPublicId,
    deliveryStatus: "queued",
    deliveredTo: [],
    failedTo: [],
    deliveries: [],
  });

  /* ── Step 3: Attempt delivery ────────────────────────────────────── */
  let delivery;

  try {
    delivery = await sendBulkMail({
      message: {
        ...payload,
        _id: record._id,
        transactionNumber: record.transactionNumber,
      },
    });
  } catch (error) {
    await Message.findByIdAndUpdate(record._id, {
      deliveryStatus: "failed",
      deliveredTo: [],
      failedTo: payload.recipients,
      error: error.message || "Delivery failed.",
      sentAt: new Date(),
    });

    return res.status(502).json({
      success: false,
      message: `Email delivery failed: ${error.message}`,
      data: {
        id: record._id,
        transactionNumber: record.transactionNumber,
        deliveredTo: [],
        failedTo: payload.recipients,
        deliveryStatus: "failed",
      },
    });
  }

  /* ── Step 4: Summarise per-recipient results ─────────────────────── */
  const { results, messageIds } = delivery;

  const deliveredTo = results
    .filter((item) => item.status === "sent")
    .map((item) => item.email);

  const failedTo = results
    .filter((item) => item.status === "failed")
    .map((item) => item.email);

  const deliveryStatus =
    failedTo.length === 0
      ? "sent"
      : deliveredTo.length === 0
      ? "failed"
      : "partial";

  const errorSummary = results
    .filter((item) => item.status === "failed")
    .map((item) => `${item.email}: ${item.error}`)
    .join("; ");

  const updated = await Message.findByIdAndUpdate(
    record._id,
    {
      deliveryStatus,
      deliveredTo,
      failedTo,
      deliveries: results,
      messageIds,
      error: errorSummary,
      sentAt: new Date(),
    },
    { new: true }
  );

  /* ── Step 5: Respond ─────────────────────────────────────────────── */
  const statusCode = deliveryStatus === "failed" ? 502 : 200;

  const message =
    deliveryStatus === "sent"
      ? `Message delivered to ${deliveredTo.length} recipient${
          deliveredTo.length === 1 ? "" : "s"
        }.`
      : deliveryStatus === "partial"
      ? `Message delivered to ${deliveredTo.length} of ${
          results.length
        } recipients. ${failedTo.length} failed.`
      : "Message could not be delivered to any recipient.";

  return res.status(statusCode).json({
    success: deliveryStatus !== "failed",
    message,
    data: {
      id: updated._id,
      title: updated.title,
      transactionNumber: updated.transactionNumber,
      logoUrl: updated.logo,
      deliveredTo,
      failedTo,
      deliveryStatus,
      messageIds,
      deliveries: results,
      createdAt: updated.createdAt,
      sentAt: updated.sentAt,
    },
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/messages                                                  */
/* ------------------------------------------------------------------ */

/**
 * Returns a paginated, filterable list of every message that has been
 * submitted through the console.
 */
const getMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const filter = {};

  const status = req.query.status;
  if (status && status !== "All") {
    filter.transactionStatus = status;
  }

  const deliveryStatus = req.query.deliveryStatus;
  if (deliveryStatus && deliveryStatus !== "All") {
    filter.deliveryStatus = deliveryStatus;
  }

  const search = String(req.query.search || "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { transactionNumber: rx },
      { accountName: rx },
      { accountNumber: rx },
      { title: rx },
      { senderName: rx },
      { senderDetails: rx },
      { recipients: rx },
    ];
  }

  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: items.length,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    data: items,
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/messages/:id                                              */
/* ------------------------------------------------------------------ */

const getMessageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid message id.",
    });
  }

  const message = await Message.findById(id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: message,
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/messages/stats/summary                                    */
/* ------------------------------------------------------------------ */

const getStats = asyncHandler(async (_req, res) => {
  const [summary] = await Message.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$transactionStatus", "Pending"] }, 1, 0] },
        },
        successful: {
          $sum: { $cond: [{ $eq: ["$transactionStatus", "Successful"] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$transactionStatus", "Failed"] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$deliveryStatus", "sent"] }, 1, 0] },
        },
        partial: {
          $sum: { $cond: [{ $eq: ["$deliveryStatus", "partial"] }, 1, 0] },
        },
        undelivered: {
          $sum: { $cond: [{ $eq: ["$deliveryStatus", "failed"] }, 1, 0] },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  res.status(200).json({
    success: true,
    data: summary || {
      total: 0,
      pending: 0,
      successful: 0,
      failed: 0,
      delivered: 0,
      partial: 0,
      undelivered: 0,
    },
  });
});

module.exports = {
  sendMessage,
  getMessages,
  getMessageById,
  getStats,
};