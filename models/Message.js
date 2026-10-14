const mongoose = require("mongoose");

const deliveryEntrySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    messageId: { type: String, default: "" },
    error: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ALLOWED_TEMPLATES = [
  "classic-blue",
  "modern-gradient",
  "dark-professional",
  "minimal-clean",
  "corporate-split",
  "elegant-serif",
  "bold-contrast",
  "soft-pastel",
  "tech-modern",
  "luxury-gold",
];

const messageSchema = new mongoose.Schema(
  {
    /* ── Sender ───────────────────────────────────────────────────── */
    senderName: {
      type: String,
      required: [true, "Sender display name is required."],
      trim: true,
      maxlength: 120,
    },

    recipients: {
      type: [String],
      required: [true, "At least one recipient is required."],
      index: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one recipient is required.",
      },
    },

    /* ── Branding ─────────────────────────────────────────────────── */
    logoMode: { type: String, enum: ["url", "upload"], default: "url" },
    logoUrl: { type: String, default: "", trim: true },
    // Deprecated: retained only so older records still load without error.
    logoData: { type: String, default: "" },
    // Authoritative hosted logo URL (Cloudinary for uploads, direct for links).
    logo: { type: String, default: "", trim: true },
    cloudinaryUrl: { type: String, default: "", trim: true },
    cloudinaryPublicId: { type: String, default: "", trim: true },

    /* ── Content ──────────────────────────────────────────────────── */
    title: {
      type: String,
      required: [true, "Message title is required."],
      trim: true,
      maxlength: 200,
    },
    headerMessage: {
      type: String,
      required: [true, "Header message is required."],
      trim: true,
      maxlength: 2000,
    },

    /* ── Transaction ──────────────────────────────────────────────── */
    accountName: {
      type: String,
      required: [true, "Account name is required."],
      trim: true,
      maxlength: 200,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required."],
      trim: true,
      maxlength: 60,
    },
    transactionStatus: {
      type: String,
      enum: ["Pending", "Successful", "Failed"],
      default: "Pending",
      index: true,
    },
    transactionNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
      match: [/^\d{16}$/, "Transaction No. must be exactly 16 digits."],
    },
    transactionDate: { type: Date, required: true, default: Date.now },

    /* ── Sender details ───────────────────────────────────────────── */
    senderBankName: { type: String, default: "", trim: true, maxlength: 200 },
    senderAccountName: { type: String, default: "", trim: true, maxlength: 200 },
    senderAccountNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 60,
    },

    /* ── Call to action ───────────────────────────────────────────── */
    closingMessage: { type: String, default: "", trim: true, maxlength: 2000 },
    buttonName: {
      type: String,
      required: [true, "Button name is required."],
      trim: true,
      maxlength: 80,
    },
    buttonLink: {
      type: String,
      required: [true, "Button link is required."],
      trim: true,
      maxlength: 2048,
    },

    /* ── Appearance ───────────────────────────────────────────────── */
    template: {
      type: String,
      enum: ALLOWED_TEMPLATES,
      default: "classic-blue",
      index: true,
    },

    /* ── Delivery tracking ────────────────────────────────────────── */
    deliveryStatus: {
      type: String,
      enum: ["queued", "sent", "partial", "failed"],
      default: "queued",
      index: true,
    },
    deliveredTo: { type: [String], default: [] },
    failedTo: { type: [String], default: [] },
    deliveries: { type: [deliveryEntrySchema], default: [] },
    messageIds: { type: [String], default: [] },
    error: { type: String, default: "" },
    sentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ createdAt: -1 });
messageSchema.index({ transactionNumber: 1, createdAt: -1 });
messageSchema.index({ template: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
module.exports.ALLOWED_TEMPLATES = ALLOWED_TEMPLATES;