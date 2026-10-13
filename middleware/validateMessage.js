const {
  isValidEmail,
  isValidUrl,
  isValidHexColor,
  parseRecipients,
  generateTransactionNumber,
} = require("../utils/helpers");

const ALLOWED_STATUSES = ["Pending", "Successful", "Failed"];

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

const MAX_RECIPIENTS = 50;
const MAX_LOGO_DATA_LENGTH = 4 * 1024 * 1024; // ~3MB binary
const MAX_BODY_LENGTH = 2000;

const str = (value, max) =>
  String(value === null || value === undefined ? "" : value)
    .trim()
    .slice(0, max);

const validateSendMessage = (req, res, next) => {
  const body = req.body || {};
  const errors = {};

  /* Sender name */
  const senderName = str(body.senderName, 120);
  if (!senderName) errors.senderName = "Sender display name is required.";

  /* Recipients */
  const recipients = parseRecipients(body.recipients);
  if (recipients.length === 0) {
    errors.recipients = "At least one recipient email is required.";
  } else if (recipients.length > MAX_RECIPIENTS) {
    errors.recipients = `A maximum of ${MAX_RECIPIENTS} recipients is allowed per message.`;
  } else {
    const invalid = recipients.filter((email) => !isValidEmail(email));
    if (invalid.length > 0) {
      errors.recipients = `Invalid email address: ${invalid.join(", ")}`;
    }
  }

  /* Logo */
  const logoMode = body.logoMode === "upload" ? "upload" : "url";
  const logoUrl = str(body.logoUrl, 2048);
  const rawLogoData = String(body.logoData || "");

  if (logoMode === "url" && logoUrl && !isValidUrl(logoUrl)) {
    errors.logoUrl = "Logo URL must be a valid http(s) address.";
  }

  let logoData = "";
  if (logoMode === "upload" && rawLogoData) {
    if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(rawLogoData)) {
      errors.logoData = "Uploaded logo must be a valid base64 image.";
    } else if (rawLogoData.length > MAX_LOGO_DATA_LENGTH) {
      errors.logoData = "Uploaded logo is too large (maximum 2MB).";
    } else {
      logoData = rawLogoData;
    }
  }

  /* Content */
  const title = str(body.title, 200);
  if (!title) errors.title = "Message title is required.";

  const headerMessage = str(body.headerMessage, MAX_BODY_LENGTH);
  if (!headerMessage) errors.headerMessage = "Header message is required.";

  /* Transaction */
  const accountName = str(body.accountName, 200);
  if (!accountName) errors.accountName = "Account name is required.";

  let currency = str(body.currency, 3).toUpperCase();
  if (!currency) {
    errors.currency = "Currency is required.";
  } else if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a 3-letter ISO code (e.g. USD).";
  }

  const rawAmount = String(body.amount === undefined ? "" : body.amount)
    .replace(/,/g, "")
    .trim();
  const amount = Number(rawAmount);

  if (rawAmount === "") {
    errors.amount = "Amount is required.";
  } else if (!Number.isFinite(amount)) {
    errors.amount = "Amount must be a valid number.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else if (amount > 1e15) {
    errors.amount = "Amount is too large.";
  }

  const accountNumber = str(body.accountNumber, 60);
  if (!accountNumber) errors.accountNumber = "Account number is required.";

  const transactionStatus = ALLOWED_STATUSES.includes(body.transactionStatus)
    ? body.transactionStatus
    : "Pending";

  let transactionNumber = str(body.transactionNumber, 10).replace(/\D/g, "");
  if (!/^\d{10}$/.test(transactionNumber)) {
    transactionNumber = generateTransactionNumber();
  }

  let transactionDate = new Date(body.transactionDate);
  if (Number.isNaN(transactionDate.getTime())) {
    transactionDate = new Date();
  }

  const senderDetails = str(body.senderDetails, 500);

  /* Call to action */
  const closingMessage = str(body.closingMessage, MAX_BODY_LENGTH);

  const buttonName = str(body.buttonName, 80);
  if (!buttonName) errors.buttonName = "Button name is required.";

  const buttonLink = str(body.buttonLink, 2048);
  if (!buttonLink) {
    errors.buttonLink = "External link is required.";
  } else if (!isValidUrl(buttonLink)) {
    errors.buttonLink =
      "External link must be a valid URL including http:// or https://.";
  }

  /* Appearance */
  const backgroundColor = isValidHexColor(body.backgroundColor)
    ? String(body.backgroundColor).toLowerCase()
    : "#ffffff";

  const template = ALLOWED_TEMPLATES.includes(body.template)
    ? body.template
    : "classic-blue";

  /* Result */
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors,
    });
  }

  req.messagePayload = {
    senderName,
    recipients,
    logoMode,
    logoUrl: logoMode === "url" ? logoUrl : "",
    logoData: logoMode === "upload" ? logoData : "",
    logo:
      logoMode === "upload" && logoData
        ? logoData
        : logoMode === "url"
        ? logoUrl
        : "",
    title,
    headerMessage,
    accountName,
    currency,
    amount: Number(amount.toFixed(2)),
    accountNumber,
    transactionStatus,
    transactionNumber,
    transactionDate,
    senderDetails,
    closingMessage,
    buttonName,
    buttonLink,
    backgroundColor,
    template,
  };

  return next();
};

module.exports = { validateSendMessage };