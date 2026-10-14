const nodemailer = require("nodemailer");
const { buildEmailHtml, buildEmailText } = require("./emailTemplate");
const { resolveLogoSrc } = require("../utils/helpers");

let transporter = null;

/* ------------------------------------------------------------------ */
/*  Transporter                                                        */
/* ------------------------------------------------------------------ */

const getCredentials = () => {
  const user = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_EMAIL_PASSWORD;

  if (!user || !rawPassword) {
    throw new Error(
      "Mail credentials are missing. Set ADMIN_EMAIL and ADMIN_EMAIL_PASSWORD."
    );
  }

  return {
    user,
    // Google app passwords are displayed with spaces — strip them.
    pass: String(rawPassword).replace(/\s+/g, ""),
  };
};

/** Lazily creates (and caches) the shared SMTP transport. */
const getTransporter = () => {
  if (transporter) return transporter;

  const { user, pass } = getCredentials();

  transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 40000,
  });

  return transporter;
};

/**
 * Verifies the SMTP connection at boot. Failures are logged as warnings
 * rather than thrown so the API can still serve admin traffic.
 */
const verifyMailer = async () => {
  try {
    await getTransporter().verify();
    console.log(`Mail transport ready → ${process.env.ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.warn(
      `Mail transport verification failed: ${error.message}. ` +
        "Sends will still be attempted at request time."
    );
    return false;
  }
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getReplyTo = () => {
  if (process.env.MAIL_REPLY_TO) return process.env.MAIL_REPLY_TO.trim();

  const domain = String(process.env.ADMIN_EMAIL || "")
    .split("@")[1]
    ?.trim();

  return domain ? `noreply@${domain}` : undefined;
};

/**
 * Resolves the mail assets for the outgoing email.
 *
 * Logos are always hosted (Cloudinary for uploads, direct URL for links),
 * so no inline attachments are ever added. If the message has no logo
 * URL, the email renders without one — no base64 or CID fallback exists.
 */
const buildMailAssets = (message) => {
  const logoSrc = resolveLogoSrc(message);
  return { attachments: [], logoSrc };
};

/* ------------------------------------------------------------------ */
/*  Sending                                                            */
/* ------------------------------------------------------------------ */

/**
 * Sends one message to a single recipient.
 * Returns the Nodemailer info object.
 */
const sendSingleEmail = async ({ message, to, html, text, attachments }) => {
  const transport = getTransporter();

  const fromName =
    message.senderName || process.env.MAIL_FROM_NAME || "Notification Service";

  const mail = {
    from: {
      name: fromName,
      address: process.env.ADMIN_EMAIL,
    },
    to,
    replyTo: getReplyTo(),
    subject: message.title || "Transaction Notification",
    html,
    text,
    headers: {
      "X-Auto-Response-Suppress": "OOF, AutoReply",
      "X-Entity-Ref-ID": String(message.transactionNumber || Date.now()),
      "List-Unsubscribe": `<mailto:${getReplyTo() || process.env.ADMIN_EMAIL}>`,
    },
  };

  if (attachments && attachments.length > 0) {
    mail.attachments = attachments;
  }

  return transport.sendMail(mail);
};

/**
 * Delivers the message to every recipient individually so that a single
 * bad address cannot prevent the rest from being delivered. Each result
 * is captured for the audit trail.
 *
 * @returns {Promise<{ results: Array, messageIds: string[] }>}
 */
const sendBulkMail = async ({ message }) => {
  const recipients = Array.isArray(message.recipients)
    ? message.recipients
    : [];

  if (recipients.length === 0) {
    throw new Error("No recipients supplied.");
  }

  const { attachments, logoSrc } = buildMailAssets(message);

  const html = buildEmailHtml(message, logoSrc);
  const text = buildEmailText(message);

  const results = [];

  for (const email of recipients) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const info = await sendSingleEmail({
        message,
        to: email,
        html,
        text,
        attachments,
      });

      results.push({
        email,
        status: "sent",
        messageId: info.messageId || "",
        error: "",
        at: new Date(),
      });
    } catch (error) {
      results.push({
        email,
        status: "failed",
        messageId: "",
        error: error.message || "Unknown delivery error.",
        at: new Date(),
      });
    }
  }

  const messageIds = results
    .filter((item) => item.status === "sent" && item.messageId)
    .map((item) => item.messageId);

  return { results, messageIds };
};

module.exports = {
  getTransporter,
  verifyMailer,
  sendBulkMail,
};