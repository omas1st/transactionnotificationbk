/* ------------------------------------------------------------------ */
/*  Text / HTML helpers                                                */
/* ------------------------------------------------------------------ */

/** Escapes user-supplied text before it is embedded into email HTML. */
const escapeHtml = (value) =>
  String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Escapes a string so it can safely be used inside a RegExp. */
const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ------------------------------------------------------------------ */
/*  Validators                                                         */
/* ------------------------------------------------------------------ */

const isValidEmail = (value) => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
};

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidHexColor = (value) =>
  /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || "").trim());

/* ------------------------------------------------------------------ */
/*  Parsers / normalisers                                              */
/* ------------------------------------------------------------------ */

/** Splits a raw string (or array) into a de-duplicated list of emails. */
const parseRecipients = (input) => {
  if (!input) return [];

  const raw = Array.isArray(input) ? input : String(input).split(/[,;\s]+/);

  const seen = new Set();
  const list = [];

  raw.forEach((item) => {
    const email = String(item || "").trim().toLowerCase();
    if (!email || seen.has(email)) return;
    seen.add(email);
    list.push(email);
  });

  return list;
};

/** Parses a `data:<mime>;base64,<payload>` URI into its parts. */
const parseDataUri = (dataUri) => {
  const match = /^data:([^;,]+);base64,(.+)$/is.exec(String(dataUri || ""));
  if (!match) return null;
  return { mimeType: match[1].toLowerCase(), base64: match[2] };
};

const MIME_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
};

const extensionFromMime = (mimeType) =>
  MIME_EXTENSIONS[String(mimeType || "").toLowerCase()] || "png";

/** Generates a random 16-digit transaction number (never starts with 0). */
const generateTransactionNumber = () => {
  let result = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 0; i < 15; i += 1) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
};

/** Masks all but the last 4 characters of an account number. */
const maskAccountNumber = (value) => {
  const str = String(value === null || value === undefined ? "" : value).trim();
  if (!str) return "";
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
};

/** True when the message has any sender-detail content worth rendering. */
const hasSenderDetails = (message) =>
  Boolean(
    message &&
      (message.senderAccountName ||
        message.senderBankName ||
        message.senderAccountNumber)
  );

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

const formatAmount = (currency, amount) => {
  if (amount === null || amount === undefined || amount === "") return "—";

  const numeric = Number(String(amount).replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return `${currency || ""} ${amount}`.trim();

  const code = String(currency || "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${code} ${numeric.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: process.env.EMAIL_TIMEZONE || "UTC",
    }).format(date);
  } catch {
    return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }
};

/** Resolves the logo source that should be rendered in the email body. */
const resolveLogoSrc = (message, cid) => {
  if (!message) return "";

  if (message.logoMode === "upload" && message.logoData) {
    const parsed = parseDataUri(message.logoData);
    if (parsed && cid) return `cid:${cid}`;
  }

  if (message.logoUrl) return String(message.logoUrl).trim();
  if (message.logo) return String(message.logo).trim();

  return "";
};

module.exports = {
  escapeHtml,
  escapeRegex,
  isValidEmail,
  isValidUrl,
  isValidHexColor,
  parseRecipients,
  parseDataUri,
  extensionFromMime,
  generateTransactionNumber,
  maskAccountNumber,
  hasSenderDetails,
  formatAmount,
  formatDateTime,
  resolveLogoSrc,
};