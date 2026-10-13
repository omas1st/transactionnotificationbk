const {
  escapeHtml,
  formatAmount,
  formatDateTime,
  maskAccountNumber,
  hasSenderDetails,
} = require("../utils/helpers");

/* ================================================================== */
/*  Design tokens                                                      */
/* ================================================================== */

const FONT_SANS =
  "'Segoe UI', Roboto, 'Helvetica Neue', Arial, Helvetica, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_MONO =
  "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const STATUS_STYLES = {
  pending: { color: "#92400e", background: "#fef3c7", border: "#fcd34d" },
  successful: { color: "#065f46", background: "#d1fae5", border: "#6ee7b7" },
  failed: { color: "#991b1b", background: "#fee2e2", border: "#fca5a5" },
};

const statusKey = (status) => String(status || "pending").toLowerCase();
const statusColor = (status) =>
  STATUS_STYLES[statusKey(status)] || STATUS_STYLES.pending;

const TEMPLATE_BACKGROUNDS = {
  "classic-blue": "#f4f7fb",
  "modern-gradient": "#f4f6fb",
  "dark-professional": "#0b1220",
  "minimal-clean": "#ffffff",
  "corporate-split": "#eef2f7",
  "elegant-serif": "#f7f2e8",
  "bold-contrast": "#ffffff",
  "soft-pastel": "#f3efff",
  "tech-modern": "#0b1220",
  "luxury-gold": "#0a1730",
};

/* ================================================================== */
/*  Shared building blocks                                             */
/* ================================================================== */

const initials = (name) =>
  (name || "N").trim().charAt(0).toUpperCase() || "N";

const logoBlock = (message, logoSrc, opts = {}) => {
  const {
    width = 120,
    height = 72,
    alt = message.senderName || "Logo",
    fallbackBg = "#1a4fa0",
    fallbackColor = "#ffffff",
    borderRadius = "12px",
    fallbackSize = 58,
    fallbackFont = 24,
    marginBottom = 16,
  } = opts;

  if (logoSrc) {
    return `<img src="${escapeHtml(
      logoSrc
    )}" alt="${escapeHtml(
      alt
    )}" width="${width}" style="display:block;margin:0 auto ${marginBottom}px;max-width:${width}px;max-height:${height}px;width:auto;height:auto;border:0;outline:none;text-decoration:none;" />`;
  }

  return `<div style="width:${fallbackSize}px;height:${fallbackSize}px;line-height:${fallbackSize}px;margin:0 auto ${marginBottom}px;border-radius:${borderRadius};background-color:${fallbackBg};color:${fallbackColor};font-family:${FONT_SANS};font-size:${fallbackFont}px;font-weight:800;text-align:center;">${escapeHtml(
    initials(message.senderName)
  )}</div>`;
};

/**
 * A single label/value table row. Tables are the only layout primitive
 * Gmail, Outlook, Apple Mail, and every mobile client render identically,
 * which is why the whole email uses them.
 */
const detailRow = (label, valueHtml, opts = {}) => {
  const {
    borderColor = "#e2e9f4",
    labelColor = "#5b6b83",
    valueColor = "#0f1e33",
    labelSize = "12px",
    valueSize = "14px",
    labelWeight = 600,
    valueWeight = 600,
    labelWidth = "40%",
    padding = "14px 18px",
    labelUppercase = false,
    labelSpacing = "0.4px",
    borderBottom = true,
  } = opts;

  const border = borderBottom ? `border-bottom:1px solid ${borderColor};` : "";
  const transform = labelUppercase
    ? `text-transform:uppercase;letter-spacing:${labelSpacing};`
    : "";

  return `<tr>
    <td width="${labelWidth}" valign="top" style="padding:${padding};${border}font-family:${FONT_SANS};font-size:${labelSize};line-height:1.45;color:${labelColor};font-weight:${labelWeight};${transform}word-break:break-word;overflow-wrap:break-word;mso-line-height-rule:exactly;">
      ${escapeHtml(label)}
    </td>
    <td valign="top" align="right" style="padding:${padding};${border}font-family:${FONT_SANS};font-size:${valueSize};line-height:1.45;color:${valueColor};font-weight:${valueWeight};text-align:right;word-break:break-word;overflow-wrap:break-word;mso-line-height-rule:exactly;">
      ${valueHtml}
    </td>
  </tr>`;
};

/** A card cell used inside the two-column templates (Modern / Pastel). */
const gridCell = (label, valueHtml, opts = {}) => {
  const {
    bgColor = "#f6f5ff",
    borderColor = "#e9e6ff",
    labelColor = "#7c7fa3",
    valueColor = "#1e1b4b",
    valueWeight = 600,
    labelSize = "10px",
    valueSize = "14px",
    radius = "12px",
    padding = "14px",
    align = "left",
    valueHtmlStyle = "",
  } = opts;

  return `<div style="padding:${padding};background-color:${bgColor};border:1px solid ${borderColor};border-radius:${radius};mso-line-height-rule:exactly;word-break:break-word;overflow-wrap:break-word;">
    <div style="font-family:${FONT_SANS};font-size:${labelSize};letter-spacing:0.6px;text-transform:uppercase;color:${labelColor};font-weight:700;line-height:1.3;margin-bottom:5px;word-break:break-word;overflow-wrap:break-word;">${escapeHtml(
    label
  )}</div>
    <div style="font-family:${FONT_SANS};font-size:${valueSize};color:${valueColor};font-weight:${valueWeight};line-height:1.4;text-align:${align};word-break:break-word;overflow-wrap:break-word;${valueHtmlStyle}">${valueHtml}</div>
  </div>`;
};

/** Stacked sender details: name on line 1, bank • masked acct on line 2. */
const senderValue = (message, opts = {}) => {
  const {
    align = "right",
    nameColor = "inherit",
    nameSize = "14px",
    metaColor = "#64748b",
    metaSize = "12px",
  } = opts;

  const name = (message.senderAccountName || "").trim();
  const bank = (message.senderBankName || "").trim();
  const masked = maskAccountNumber(message.senderAccountNumber);

  if (!name && !bank && !masked) return "";

  const metaParts = [];
  if (bank) metaParts.push(escapeHtml(bank));
  if (masked)
    metaParts.push(
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;white-space:nowrap;">${escapeHtml(
        masked
      )}</span>`
    );

  return `<div style="text-align:${align};line-height:1.4;word-break:break-word;overflow-wrap:break-word;">
    ${
      name
        ? `<div style="font-family:${FONT_SANS};font-size:${nameSize};font-weight:700;color:${nameColor};line-height:1.35;word-break:break-word;overflow-wrap:break-word;">${escapeHtml(
            name
          )}</div>`
        : ""
    }
    ${
      metaParts.length
        ? `<div style="margin-top:3px;font-family:${FONT_SANS};font-size:${metaSize};font-weight:500;color:${metaColor};line-height:1.4;word-break:break-word;overflow-wrap:break-word;">${metaParts.join(
            ' <span style="opacity:0.75;">&bull;</span> '
          )}</div>`
        : ""
    }
  </div>`;
};

/** Pill-style status badge. */
const statusBadge = (status, opts = {}) => {
  const { pill = true, pad = "5px 14px", radius = "999px" } = opts;
  const s = statusColor(status);
  return `<span style="display:inline-block;padding:${pad};border-radius:${radius};font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;line-height:1.3;color:${s.color};background-color:${s.background};border:1px solid ${s.border};white-space:nowrap;">${escapeHtml(
    status
  )}</span>`;
};

/** The one and only CTA button used across templates. */
const cta = (name, link, styles) => {
  if (!name || !link) return "";
  const safeHref = escapeHtml(link);
  const {
    bg = "#1a4fa0",
    color = "#ffffff",
    radius = "8px",
    padding = "14px 34px",
    fontSize = "14px",
    weight = 700,
    fontFamily = FONT_SANS,
    letterSpacing = "0.2px",
    textTransform = "none",
    shadow = "0 3px 10px rgba(26,79,160,0.28)",
    display = "inline-block",
    width = "auto",
    border = "none",
  } = styles || {};

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding-top:22px;">
        <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
           style="display:${display};width:${width};padding:${padding};font-family:${fontFamily};font-size:${fontSize};line-height:1.3;font-weight:${weight};color:${color};text-decoration:none;background-color:${bg};border:${border};border-radius:${radius};letter-spacing:${letterSpacing};text-transform:${textTransform};box-shadow:${shadow};box-sizing:border-box;mso-line-height-rule:exactly;">
          ${escapeHtml(name)}
        </a>
      </td>
    </tr>
  </table>`;
};

const shell = (backgroundColor, body) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
  <meta name="color-scheme" content="light only" />
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:${escapeHtml(
  backgroundColor
)};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:${escapeHtml(
    backgroundColor
  )};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  ${body}
</body>
</html>`;

/* ================================================================== */
/*  1. Classic Blue                                                    */
/* ================================================================== */

const buildClassicBlue = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["classic-blue"];

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), {
        labelUppercase: false,
      }),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      {}
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), {}),
    detailRow("Status", statusBadge(message.transactionStatus), {}),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      {}
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      {}
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e9f4;box-shadow:0 8px 26px rgba(15,30,51,0.10);">
          <tr><td style="height:6px;line-height:6px;font-size:0;background-color:#1a4fa0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:38px 40px 22px;text-align:center;">
              ${logoBlock(message, logoSrc)}
              <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:20px;font-weight:800;letter-spacing:0.4px;color:#1a4fa0;line-height:1.25;">${escapeHtml(
    message.senderName
  )}</p>
              <h1 style="margin:0;font-family:${FONT_SANS};font-size:13px;line-height:1.4;font-weight:500;color:#5b6b83;letter-spacing:0.2px;">${escapeHtml(
                message.title
              )}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;line-height:1px;font-size:0;background-color:#e2e9f4;">&nbsp;</div></td>
          </tr>
          <tr>
            <td style="padding:30px 40px 36px;">
              <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:15px;line-height:24px;color:#0f1e33;">${escapeHtml(
    message.headerMessage
  )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#eaf1fb;border:1px solid #e2e9f4;border-radius:10px;border-collapse:separate;overflow:hidden;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:26px 0 0;font-family:${FONT_SANS};font-size:14px;line-height:23px;color:#5b6b83;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${cta(message.buttonName, message.buttonLink)}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f4f7fb;border-top:1px solid #e2e9f4;text-align:center;">
              <p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:19px;color:#5b6b83;">&copy; ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  2. Modern Gradient                                                 */
/* ================================================================== */

const buildModernGradient = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["modern-gradient"];

  const cellOpts = {
    bgColor: "#f6f5ff",
    borderColor: "#e9e6ff",
    labelColor: "#7c7fa3",
    valueColor: "#1e1b4b",
  };

  const cellA = (label, value) => gridCell(label, value, cellOpts);
  const cellB = (label, value) => gridCell(label, value, cellOpts);

  const detailsTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;">
    <tr>
      <td width="50%" valign="top" style="padding:0 5px 10px 0;">${cellA(
        "Account Name",
        escapeHtml(message.accountName)
      )}</td>
      <td width="50%" valign="top" style="padding:0 0 10px 5px;">${cellB(
        "Amount",
        escapeHtml(formatAmount(message.currency, message.amount))
      )}</td>
    </tr>
    <tr>
      <td width="50%" valign="top" style="padding:0 5px 10px 0;">${cellA(
        "Account Number",
        escapeHtml(message.accountNumber)
      )}</td>
      <td width="50%" valign="top" style="padding:0 0 10px 5px;">${cellB(
        "Status",
        statusBadge(message.transactionStatus)
      )}</td>
    </tr>
    <tr>
      <td width="50%" valign="top" style="padding:0 5px 10px 0;">${cellA(
        "Transaction No.",
        `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
          message.transactionNumber
        )}</span>`
      )}</td>
      <td width="50%" valign="top" style="padding:0 0 10px 5px;">${cellB(
        "Transaction Date",
        escapeHtml(formatDateTime(message.transactionDate))
      )}</td>
    </tr>
    ${
      hasSenderDetails(message)
        ? `<tr>
             <td colspan="2" valign="top" style="padding:0 0 10px 0;">
               ${gridCell("Sender Details", senderValue(message, {
                 align: "left",
                 nameColor: "#1e1b4b",
                 metaColor: "#7c7fa3",
               }), { ...cellOpts })}
             </td>
           </tr>`
        : ""
    }
  </table>`;

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:100%;max-width:620px;">
          <tr>
            <td style="padding:44px 40px 68px;background-color:#7c3aed;background-image:linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#a855f7 100%);border-radius:22px 22px 0 0;text-align:center;color:#ffffff;">
              ${logoBlock(message, logoSrc, {
                fallbackBg: "rgba(255,255,255,0.18)",
                borderRadius: "50%",
                fallbackSize: 62,
              })}
              <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:20px;font-weight:800;letter-spacing:0.3px;color:#ffffff;line-height:1.25;">${escapeHtml(
    message.senderName
  )}</p>
              <h1 style="margin:0;font-family:${FONT_SANS};font-size:13px;line-height:1.4;font-weight:500;color:#e9d5ff;">${escapeHtml(
                message.title
              )}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:22px;box-shadow:0 18px 46px rgba(79,70,229,0.18);margin-top:-44px;">
                <tr>
                  <td style="padding:34px 32px 30px;">
                    <p style="margin:0 0 22px;font-family:${FONT_SANS};font-size:15px;line-height:24px;color:#1f2a3d;">${escapeHtml(
    message.headerMessage
  )}</p>
                    ${detailsTable}
                    ${
                      message.closingMessage
                        ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13.5px;line-height:23px;color:#5b6b83;">${escapeHtml(
                            message.closingMessage
                          )}</p>`
                        : ""
                    }
                    ${cta(message.buttonName, message.buttonLink, {
                      bg: "#7c3aed",
                      radius: "999px",
                      padding: "14px 34px",
                      shadow: "0 8px 22px rgba(124,58,237,0.32)",
                    })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 20px 0;text-align:center;font-family:${FONT_SANS};font-size:11px;line-height:19px;color:#94a3b8;">
              © ${new Date().getFullYear()} ${escapeHtml(message.senderName)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  3. Dark Professional                                               */
/* ================================================================== */

const buildDarkProfessional = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["dark-professional"];

  const rowOpts = {
    borderColor: "#e5e7eb",
    labelColor: "#6b7280",
    valueColor: "#111827",
    labelSize: "12px",
    valueSize: "14px",
    labelWeight: 600,
    padding: "14px 18px",
    labelUppercase: true,
    labelSpacing: "0.6px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow(
      "Status",
      `<span style="display:inline-block;padding:4px 10px;border-radius:5px;font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;line-height:1.3;color:${
        statusColor(message.transactionStatus).color
      };background-color:${
        statusColor(message.transactionStatus).background
      };white-space:nowrap;">${escapeHtml(message.transactionStatus)}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        ...rowOpts,
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:100%;max-width:620px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 12px 34px rgba(0,0,0,0.4);">
          <tr>
            <td style="padding:26px 32px;background-color:#111827;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="68" valign="middle" style="padding-right:16px;">
                    ${logoBlock(message, logoSrc, {
                      width: 52,
                      height: 52,
                      fallbackBg: "#2563eb",
                      fallbackSize: 52,
                      borderRadius: "10px",
                      marginBottom: 0,
                    })}
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 2px;font-family:${FONT_SANS};font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;line-height:1.25;word-break:break-word;">${escapeHtml(
    message.senderName
  )}</p>
                    <h1 style="margin:0;font-family:${FONT_SANS};font-size:13px;line-height:1.4;font-weight:500;color:#94a3b8;">${escapeHtml(
                      message.title
                    )}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px;">
              <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:14px;line-height:23px;color:#374151;">${escapeHtml(
    message.headerMessage
  )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;border-collapse:separate;overflow:hidden;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:23px;color:#4b5563;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${cta(message.buttonName, message.buttonLink, {
                bg: "#111827",
                radius: "8px",
              })}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f3f4f6;border-top:1px solid #e5e7eb;text-align:center;font-family:${FONT_SANS};font-size:11px;line-height:18px;color:#6b7280;">
              © ${new Date().getFullYear()} ${escapeHtml(message.senderName)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  4. Minimal Clean                                                   */
/* ================================================================== */

const buildMinimalClean = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["minimal-clean"];

  const rowOpts = {
    borderColor: "#ececec",
    labelColor: "#94a3b8",
    valueColor: "#0f172a",
    labelSize: "11px",
    valueSize: "14px",
    labelWeight: 700,
    valueWeight: 500,
    padding: "14px 0",
    labelUppercase: true,
    labelSpacing: "1px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow("Status", escapeHtml(message.transactionStatus), rowOpts),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.4px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        ...rowOpts,
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="width:100%;max-width:580px;background-color:#ffffff;border:1px solid #f0f0f0;border-radius:6px;">
          <tr>
            <td style="padding:40px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="58" valign="middle" style="padding-right:14px;">
                    ${logoBlock(message, logoSrc, {
                      width: 44,
                      height: 44,
                      fallbackBg: "#0f172a",
                      fallbackSize: 44,
                      borderRadius: "8px",
                      marginBottom: 0,
                    })}
                  </td>
                  <td valign="middle">
                    <p style="margin:0;font-family:${FONT_SANS};font-size:20px;color:#0f172a;font-weight:800;letter-spacing:0.2px;line-height:1.25;word-break:break-word;">${escapeHtml(
    message.senderName
  )}</p>
                    <h1 style="margin:3px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.4;font-weight:500;color:#64748b;">${escapeHtml(
                      message.title
                    )}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 26px;">
              <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:14px;line-height:1.75;color:#334155;">${escapeHtml(
                message.headerMessage
              )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:#64748b;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${
                message.buttonName && message.buttonLink
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.5;">
                       <a href="${escapeHtml(
                         message.buttonLink
                       )}" target="_blank" rel="noopener noreferrer" style="color:#0f172a;font-weight:600;text-decoration:none;border-bottom:1px solid #0f172a;padding-bottom:2px;">${escapeHtml(
                      message.buttonName
                    )} &rarr;</a>
                     </p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="border-top:1px solid #ececec;padding-top:18px;font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:#94a3b8;">
                © ${new Date().getFullYear()} ${escapeHtml(message.senderName)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  5. Corporate Split                                                 */
/* ================================================================== */

const buildCorporateSplit = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["corporate-split"];

  const rowOpts = {
    borderColor: "#e2e8f0",
    labelColor: "#64748b",
    valueColor: "#0f172a",
    labelSize: "12px",
    valueSize: "13px",
    labelWeight: 600,
    valueWeight: 600,
    padding: "12px 14px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow(
      "Status",
      `<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;line-height:1.3;color:${
        statusColor(message.transactionStatus).color
      };background-color:${
        statusColor(message.transactionStatus).background
      };white-space:nowrap;">${escapeHtml(message.transactionStatus)}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        ...rowOpts,
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,30,51,0.12);">
          <tr>
            <td style="padding:32px 34px 26px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="80" valign="middle" style="padding-right:16px;">
                    ${logoBlock(message, logoSrc, {
                      width: 60,
                      height: 60,
                      fallbackBg: "#0b3d91",
                      fallbackSize: 60,
                      borderRadius: "12px",
                      marginBottom: 0,
                    })}
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 2px;font-family:${FONT_SANS};font-size:20px;font-weight:800;color:#0b3d91;line-height:1.25;word-break:break-word;">${escapeHtml(
    message.senderName
  )}</p>
                    <h1 style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.4;font-weight:600;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(
                      message.title
                    )}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 26px;">
              <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:14px;line-height:23px;color:#475569;">${escapeHtml(
                message.headerMessage
              )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;overflow:hidden;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:20px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:23px;color:#64748b;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${cta(message.buttonName, message.buttonLink, {
                bg: "#0b3d91",
                radius: "6px",
                fontSize: "13px",
                padding: "12px 26px",
                shadow: "none",
              })}
              <p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  6. Elegant Serif                                                   */
/* ================================================================== */

const buildElegantSerif = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["elegant-serif"];

  const rowOpts = {
    borderColor: "#eadfc6",
    labelColor: "#8b7550",
    valueColor: "#2a2114",
    labelSize: "13px",
    valueSize: "14px",
    labelWeight: 500,
    valueWeight: 600,
    padding: "13px 6px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow(
      "Status",
      `<em style="font-style:italic;color:#b08d57;font-weight:600;">${escapeHtml(
        message.transactionStatus
      )}</em>`,
      rowOpts
    ),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.4px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        ...rowOpts,
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#fdfaf3;border-radius:4px;border:1px solid #eadfc6;">
          <tr>
            <td style="padding:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #d8c290;border-radius:2px;">
                <tr>
                  <td style="padding:34px 30px 28px;">
                    <div style="text-align:center;margin-bottom:24px;">
                      ${logoBlock(message, logoSrc, {
                        fallbackBg: "#b08d57",
                        borderRadius: "50%",
                        fallbackSize: 56,
                      })}
                      <p style="margin:0 0 6px;font-family:${FONT_SERIF};font-size:20px;letter-spacing:0.5px;color:#8b6b2e;font-weight:700;line-height:1.25;">${escapeHtml(
    message.senderName
  )}</p>
                      <h1 style="margin:0;font-family:${FONT_SERIF};font-size:14px;line-height:1.4;font-weight:500;color:#4a3f2c;font-style:italic;">${escapeHtml(
                        message.title
                      )}</h1>
                      <div style="display:inline-block;width:70px;height:2px;line-height:2px;font-size:0;background-color:#b08d57;margin-top:16px;">&nbsp;</div>
                    </div>
                    <p style="margin:22px 0 24px;font-family:${FONT_SERIF};font-size:15px;line-height:1.8;color:#4a3f2c;font-style:italic;text-align:center;">${escapeHtml(
                      message.headerMessage
                    )}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
                      <tbody>${rows}</tbody>
                    </table>
                    ${
                      message.closingMessage
                        ? `<p style="margin:22px 0 0;font-family:${FONT_SERIF};font-size:14px;line-height:1.8;color:#4a3f2c;text-align:center;">${escapeHtml(
                            message.closingMessage
                          )}</p>`
                        : ""
                    }
                    ${cta(message.buttonName, message.buttonLink, {
                      bg: "transparent",
                      color: "#8b6b2e",
                      border: "1px solid #b08d57",
                      radius: "2px",
                      fontFamily: FONT_SERIF,
                      fontSize: "13px",
                      padding: "13px 34px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      shadow: "none",
                    })}
                    <p style="margin:26px 0 0;font-family:${FONT_SERIF};font-size:11px;color:#8b7550;letter-spacing:1px;text-align:center;">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  7. Bold Contrast                                                   */
/* ================================================================== */

const buildBoldContrast = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["bold-contrast"];

  const rowOpts = {
    borderColor: "#000000",
    labelColor: "#000000",
    valueColor: "#000000",
    labelSize: "11px",
    valueSize: "13px",
    labelWeight: 800,
    valueWeight: 700,
    padding: "12px 16px",
    labelUppercase: true,
    labelSpacing: "0.5px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow(
      "Status",
      `<span style="display:inline-block;padding:3px 12px;background-color:#000000;color:#f59e0b;font-family:${FONT_SANS};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;line-height:1.3;white-space:nowrap;">${escapeHtml(
        message.transactionStatus
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow("Sender Details", senderValue(message), {
        ...rowOpts,
        borderBottom: false,
      }),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border:3px solid #000000;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:30px 32px;background-color:#000000;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="74" valign="middle" style="padding-right:18px;">
                    ${logoBlock(message, logoSrc, {
                      width: 56,
                      height: 56,
                      fallbackBg: "#f59e0b",
                      fallbackColor: "#000000",
                      fallbackSize: 56,
                      borderRadius: "4px",
                      marginBottom: 0,
                    })}
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 2px;font-family:${FONT_SANS};font-size:20px;letter-spacing:0.3px;color:#ffffff;font-weight:900;line-height:1.2;word-break:break-word;">${escapeHtml(
    message.senderName
  )}</p>
                    <h1 style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.4;letter-spacing:1.5px;text-transform:uppercase;color:#f59e0b;font-weight:800;">${escapeHtml(
                      message.title
                    )}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px;">
              <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:15px;line-height:1.65;color:#1a1a1a;font-weight:500;">${escapeHtml(
                message.headerMessage
              )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:2px solid #000000;border-collapse:collapse;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:14px;line-height:1.65;color:#333333;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${
                message.buttonName && message.buttonLink
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
                       <tr>
                         <td align="center">
                           <a href="${escapeHtml(
                             message.buttonLink
                           )}" target="_blank" rel="noopener noreferrer" style="display:block;width:100%;padding:16px 24px;background-color:#f59e0b;color:#000000;text-align:center;font-family:${FONT_SANS};font-size:14px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border:2px solid #000000;box-sizing:border-box;">${escapeHtml(
                             message.buttonName
                           )}</a>
                         </td>
                       </tr>
                     </table>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#000000;text-align:center;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.5px;color:#ffffff;">
              © ${new Date().getFullYear()} ${escapeHtml(message.senderName)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  8. Soft Pastel                                                     */
/* ================================================================== */

const buildSoftPastel = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["soft-pastel"];

  const cellOpts = {
    bgColor: "#faf5ff",
    borderColor: "#ede9fe",
    labelColor: "#a78bfa",
    valueColor: "#4c1d95",
  };

  const detailsTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;">
    <tr>
      <td width="50%" valign="top" style="padding:0 7px 14px 0;">${gridCell(
        "Account Name",
        escapeHtml(message.accountName),
        cellOpts
      )}</td>
      <td width="50%" valign="top" style="padding:0 0 14px 7px;">${gridCell(
        "Account Number",
        escapeHtml(message.accountNumber),
        cellOpts
      )}</td>
    </tr>
    <tr>
      <td width="50%" valign="top" style="padding:0 7px 14px 0;">${gridCell(
        "Transaction No.",
        `<span style="font-family:${FONT_MONO};letter-spacing:0.4px;">${escapeHtml(
          message.transactionNumber
        )}</span>`,
        cellOpts
      )}</td>
      <td width="50%" valign="top" style="padding:0 0 14px 7px;">${gridCell(
        "Transaction Date",
        escapeHtml(formatDateTime(message.transactionDate)),
        cellOpts
      )}</td>
    </tr>
    ${
      hasSenderDetails(message)
        ? `<tr>
             <td colspan="2" valign="top" style="padding:0 0 14px 0;">
               ${gridCell("Sender Details", senderValue(message, {
                 align: "left",
                 nameColor: "#4c1d95",
                 metaColor: "#a78bfa",
               }), cellOpts)}
             </td>
           </tr>`
        : ""
    }
  </table>`;

  const statusStyle = statusColor(message.transactionStatus);

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 16px 40px rgba(139,92,246,0.12);">
          <tr>
            <td style="padding:36px 34px 22px;text-align:center;">
              ${logoBlock(message, logoSrc, {
                fallbackBg: "#a78bfa",
                borderRadius: "50%",
                fallbackSize: 56,
              })}
              <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:20px;letter-spacing:0.2px;color:#6d28d9;font-weight:800;line-height:1.25;">${escapeHtml(
    message.senderName
  )}</p>
              <h1 style="margin:0;font-family:${FONT_SANS};font-size:13px;line-height:1.4;font-weight:500;color:#a78bfa;">${escapeHtml(
                message.title
              )}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 28px;">
              <p style="margin:0 0 22px;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:#4b5563;text-align:center;">${escapeHtml(
                message.headerMessage
              )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <span style="display:inline-block;padding:8px 20px;background-color:#ede9fe;color:#5b21b6;font-family:${FONT_SANS};font-size:13px;font-weight:700;border-radius:999px;white-space:nowrap;">${escapeHtml(
                      formatAmount(message.currency, message.amount)
                    )}</span>
                    &nbsp;
                    <span style="display:inline-block;padding:8px 20px;color:${
                      statusStyle.color
                    };background-color:${
    statusStyle.background
  };font-family:${FONT_SANS};font-size:13px;font-weight:700;border-radius:999px;white-space:nowrap;">${escapeHtml(
    message.transactionStatus
  )}</span>
                  </td>
                </tr>
              </table>
              ${detailsTable}
              ${
                message.closingMessage
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:#6b7280;text-align:center;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${cta(message.buttonName, message.buttonLink, {
                bg: "#8b5cf6",
                radius: "999px",
                padding: "14px 36px",
                shadow: "0 10px 24px rgba(139,92,246,0.32)",
              })}
              <p style="margin:26px 0 0;font-family:${FONT_SANS};font-size:11px;color:#a78bfa;text-align:center;">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  9. Tech Modern                                                     */
/* ================================================================== */

const buildTechModern = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["tech-modern"];

  const statusHex =
    {
      pending: "#fbbf24",
      successful: "#4ade80",
      failed: "#f87171",
    }[statusKey(message.transactionStatus)] || "#fbbf24";

  const codeRow = (key, value, valueStyle = "") =>
    `<span style="color:#22d3ee;">${escapeHtml(
      key
    )}</span><span style="color:#64748b;">:</span> <span style="${valueStyle}">${escapeHtml(
      value
    )}</span>\n`;

  const senderLines =
    (message.senderAccountName
      ? codeRow("sender_name", message.senderAccountName)
      : "") +
    (message.senderBankName
      ? codeRow("sender_bank", message.senderBankName)
      : "") +
    (message.senderAccountNumber
      ? codeRow(
          "sender_account",
          maskAccountNumber(message.senderAccountNumber)
        )
      : "");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:100%;max-width:620px;background-color:#0f172a;border-radius:12px;border:1px solid #1e293b;overflow:hidden;">
          <tr>
            <td style="padding:10px 16px;background-color:#1e293b;border-bottom:1px solid #334155;">
              <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#ef4444;margin-right:6px;">&nbsp;</span>
              <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#f59e0b;margin-right:6px;">&nbsp;</span>
              <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background-color:#10b981;">&nbsp;</span>
              <span style="margin-left:12px;font-family:${FONT_MONO};font-size:11px;color:#64748b;">~/${escapeHtml(
    message.senderName || "notification"
  )}.log</span>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px;border-bottom:1px dashed #334155;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="60" valign="middle" style="padding-right:14px;">
                    ${logoBlock(message, logoSrc, {
                      width: 46,
                      height: 46,
                      fallbackBg: "#22d3ee",
                      fallbackColor: "#0f172a",
                      fallbackSize: 46,
                      borderRadius: "8px",
                      marginBottom: 0,
                    })}
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 2px;font-family:${FONT_MONO};font-size:18px;letter-spacing:0.4px;color:#22d3ee;font-weight:700;line-height:1.25;word-break:break-word;">${escapeHtml(
    message.senderName
  )}</p>
                    <h1 style="margin:0;font-family:${FONT_MONO};font-size:13px;line-height:1.4;font-weight:500;color:#94a3b8;">${escapeHtml(
                      message.title
                    )}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 0;">
              <p style="margin:0;font-family:${FONT_MONO};font-size:13px;line-height:1.75;color:#94a3b8;word-break:break-word;overflow-wrap:break-word;">${escapeHtml(
                message.headerMessage
              )}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 26px;">
              <div style="padding:18px 20px;background-color:#020617;border:1px solid #1e293b;border-radius:8px;font-family:${FONT_MONO};font-size:12.5px;line-height:1.9;color:#e2e8f0;word-break:break-word;overflow-wrap:break-word;">${codeRow(
                "account_name",
                message.accountName
              )}${codeRow(
    "amount",
    formatAmount(message.currency, message.amount)
  )}${codeRow(
    "account_number",
    message.accountNumber
  )}<span style="color:#22d3ee;">status</span><span style="color:#64748b;">:</span> <span style="color:${statusHex};">[${escapeHtml(
    message.transactionStatus
  )}]</span>\n${codeRow(
    "transaction_no",
    message.transactionNumber
  )}${codeRow(
    "timestamp",
    formatDateTime(message.transactionDate)
  )}${senderLines}</div>
            </td>
          </tr>
          ${
            message.closingMessage
              ? `<tr>
                   <td style="padding:0 26px 18px;">
                     <p style="margin:0;font-family:${FONT_MONO};font-size:12.5px;line-height:1.75;color:#94a3b8;word-break:break-word;overflow-wrap:break-word;">${escapeHtml(
                       message.closingMessage
                     )}</p>
                   </td>
                 </tr>`
              : ""
          }
          ${
            message.buttonName && message.buttonLink
              ? `<tr>
                   <td style="padding:0 26px 22px;">
                     <a href="${escapeHtml(
                       message.buttonLink
                     )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;background-color:#22d3ee;color:#0f172a;font-family:${FONT_MONO};font-size:13px;font-weight:700;border-radius:6px;text-decoration:none;">&gt; ${escapeHtml(
                  message.buttonName
                )}</a>
                   </td>
                 </tr>`
              : ""
          }
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  10. Luxury Gold                                                    */
/* ================================================================== */

const buildLuxuryGold = (message, logoSrc) => {
  const bg = TEMPLATE_BACKGROUNDS["luxury-gold"];

  const rowOpts = {
    borderColor: "rgba(212,175,55,0.18)",
    labelColor: "#d4af37",
    valueColor: "#f5f0e1",
    labelSize: "11px",
    valueSize: "13px",
    labelWeight: 600,
    valueWeight: 600,
    padding: "14px 6px",
    labelUppercase: true,
    labelSpacing: "0.8px",
  };

  const rows = [
    message.accountName &&
      detailRow("Account Name", escapeHtml(message.accountName), rowOpts),
    detailRow(
      "Amount",
      `<span style="white-space:nowrap;">${escapeHtml(
        formatAmount(message.currency, message.amount)
      )}</span>`,
      rowOpts
    ),
    message.accountNumber &&
      detailRow("Account Number", escapeHtml(message.accountNumber), rowOpts),
    detailRow(
      "Status",
      `<span style="display:inline-block;padding:4px 14px;border:1px solid #d4af37;color:#d4af37;font-family:${FONT_SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;line-height:1.3;white-space:nowrap;">${escapeHtml(
        message.transactionStatus
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction No.",
      `<span style="font-family:${FONT_MONO};letter-spacing:0.5px;">${escapeHtml(
        message.transactionNumber
      )}</span>`,
      rowOpts
    ),
    detailRow(
      "Transaction Date",
      escapeHtml(formatDateTime(message.transactionDate)),
      rowOpts
    ),
    hasSenderDetails(message) &&
      detailRow(
        "Sender Details",
        senderValue(message, {
          nameColor: "#f5f0e1",
          metaColor: "#c9b273",
        }),
        { ...rowOpts, borderBottom: false }
      ),
  ]
    .filter(Boolean)
    .join("");

  const body = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
    bg
  )};padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:100%;max-width:620px;background-color:#0a1730;border-radius:6px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,0.4);">
          <tr>
            <td style="border:1px solid #d4af37;padding:36px 30px 28px;border-radius:2px;background-color:#0d1f3d;text-align:center;">
              ${logoBlock(message, logoSrc, {
                fallbackBg: "#d4af37",
                fallbackColor: "#0a1730",
                borderRadius: "50%",
                fallbackSize: 60,
                fallbackFont: 24,
              })}
              <p style="margin:0 0 4px;font-family:${FONT_SERIF};font-size:20px;letter-spacing:0.5px;color:#f5f0e1;font-weight:700;line-height:1.25;">${escapeHtml(
    message.senderName
  )}</p>
              <h1 style="margin:0;font-family:${FONT_SERIF};font-size:13px;line-height:1.4;font-weight:500;color:#d4af37;letter-spacing:0.8px;">${escapeHtml(
                message.title
              )}</h1>
              <div style="display:inline-block;width:80px;height:1px;line-height:1px;font-size:0;background-color:#d4af37;margin-top:18px;">&nbsp;</div>
              <p style="margin:24px 0 26px;font-family:${FONT_SANS};font-size:14px;line-height:1.75;color:#cbd5e1;">${escapeHtml(
                message.headerMessage
              )}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-top:1px solid rgba(212,175,55,0.35);border-bottom:1px solid rgba(212,175,55,0.35);border-collapse:collapse;">
                <tbody>${rows}</tbody>
              </table>
              ${
                message.closingMessage
                  ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13.5px;line-height:1.75;color:#cbd5e1;">${escapeHtml(
                      message.closingMessage
                    )}</p>`
                  : ""
              }
              ${cta(message.buttonName, message.buttonLink, {
                bg: "#d4af37",
                color: "#0a1730",
                radius: "2px",
                fontFamily: FONT_SERIF,
                fontSize: "13px",
                padding: "14px 40px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                shadow: "0 6px 18px rgba(212,175,55,0.28)",
              })}
              <p style="margin:26px 0 0;font-family:${FONT_SERIF};font-size:11px;letter-spacing:1px;color:rgba(212,175,55,0.7);">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return shell(bg, body);
};

/* ================================================================== */
/*  Dispatcher                                                         */
/* ================================================================== */

const BUILDERS = {
  "classic-blue": buildClassicBlue,
  "modern-gradient": buildModernGradient,
  "dark-professional": buildDarkProfessional,
  "minimal-clean": buildMinimalClean,
  "corporate-split": buildCorporateSplit,
  "elegant-serif": buildElegantSerif,
  "bold-contrast": buildBoldContrast,
  "soft-pastel": buildSoftPastel,
  "tech-modern": buildTechModern,
  "luxury-gold": buildLuxuryGold,
};

const buildEmailHtml = (message, logoSrc = "") => {
  const templateId = message.template || "classic-blue";
  const builder = BUILDERS[templateId] || BUILDERS["classic-blue"];
  return builder(message, logoSrc);
};

/* ------------------------------------------------------------------ */
/*  Plain-text fallback                                                */
/* ------------------------------------------------------------------ */

const buildEmailText = (message) => {
  const lines = [];

  lines.push(message.senderName || "Notification Service");
  lines.push(message.title || "Incoming Transaction");
  lines.push("".padEnd(52, "-"));
  lines.push("");

  if (message.headerMessage) {
    lines.push(message.headerMessage);
    lines.push("");
  }

  const add = (label, value) => {
    if (value === null || value === undefined || value === "") return;
    lines.push(`${label}: ${value}`);
  };

  add("Account Name", message.accountName);
  add("Amount", formatAmount(message.currency, message.amount));
  add("Account Number", message.accountNumber);
  add("Status", message.transactionStatus);
  add("Transaction No.", message.transactionNumber);
  add("Transaction Date", formatDateTime(message.transactionDate));

  if (hasSenderDetails(message)) {
    lines.push("");
    lines.push("Sender Details");
    if (message.senderAccountName) lines.push(`  ${message.senderAccountName}`);
    const meta = [
      message.senderBankName,
      maskAccountNumber(message.senderAccountNumber),
    ]
      .filter(Boolean)
      .join(" • ");
    if (meta) lines.push(`  ${meta}`);
  }

  lines.push("");

  if (message.closingMessage) {
    lines.push(message.closingMessage);
    lines.push("");
  }

  if (message.buttonName && message.buttonLink) {
    lines.push(`${message.buttonName}: ${message.buttonLink}`);
    lines.push("");
  }

  lines.push("".padEnd(52, "-"));
  lines.push(
    `© ${new Date().getFullYear()} ${
      message.senderName || "Our Team"
    }. All rights reserved.`
  );

  return lines.join("\n");
};

module.exports = { buildEmailHtml, buildEmailText };