const {
  escapeHtml,
  formatAmount,
  formatDateTime,
} = require("../utils/helpers");

/* ================================================================== */
/*  Design tokens                                                      */
/* ================================================================== */

const FONT_SANS =
  "'Segoe UI', Roboto, 'Helvetica Neue', Arial, Helvetica, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const STATUS_STYLES = {
  pending: { color: "#92400e", background: "#fef3c7", border: "#fcd34d" },
  successful: { color: "#065f46", background: "#d1fae5", border: "#6ee7b7" },
  failed: { color: "#991b1b", background: "#fee2e2", border: "#fca5a5" },
};

const statusKey = (status) =>
  String(status || "pending").toLowerCase();

const statusColor = (status) =>
  STATUS_STYLES[statusKey(status)] || STATUS_STYLES.pending;

/* ================================================================== */
/*  Shared bits                                                        */
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

const statusBadgeClassic = (status) => {
  const s = statusColor(status);
  return `<span style="display:inline-block;padding:5px 14px;border-radius:999px;font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:${s.color};background-color:${s.background};border:1px solid ${s.border};">${escapeHtml(
    status
  )}</span>`;
};

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

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding-top:22px;">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
             style="display:${display};width:${width};padding:${padding};font-family:${fontFamily};font-size:${fontSize};line-height:1.3;font-weight:${weight};color:${color};text-decoration:none;background-color:${bg};border:${border};border-radius:${radius};letter-spacing:${letterSpacing};text-transform:${textTransform};box-shadow:${shadow};box-sizing:border-box;">
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
  ${body}
</body>
</html>`;

/* ================================================================== */
/*  1. Classic Blue                                                    */
/* ================================================================== */

const buildClassicBlue = (message, logoSrc) => {
  const bg = message.backgroundColor || "#ffffff";

  const row = (label, value) =>
    value
      ? `<tr>
           <td style="padding:13px 18px;border-bottom:1px solid #e2e9f4;font-family:${FONT_SANS};font-size:13px;color:#5b6b83;width:45%;vertical-align:top;">${escapeHtml(
             label
           )}</td>
           <td style="padding:13px 18px;border-bottom:1px solid #e2e9f4;font-family:${FONT_SANS};font-size:14px;color:#0f1e33;font-weight:600;text-align:right;vertical-align:top;word-break:break-word;">${escapeHtml(
             value
           )}</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
                 style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e9f4;box-shadow:0 8px 26px rgba(15,30,51,0.10);">
            <tr><td style="height:6px;line-height:6px;font-size:0;background-color:#1a4fa0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:38px 40px 22px;text-align:center;">
                ${logoBlock(message, logoSrc)}
                <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#5b6b83;">${escapeHtml(
                  message.senderName
                )}</p>
                <h1 style="margin:0;font-family:${FONT_SANS};font-size:23px;line-height:31px;font-weight:700;color:#1a4fa0;">${escapeHtml(
                  message.title
                )}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;line-height:1px;font-size:0;background-color:#e2e9f4;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 40px 36px;">
                <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:15px;line-height:24px;color:#0f1e33;">${escapeHtml(
                  message.headerMessage
                )}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="width:100%;background-color:#eaf1fb;border:1px solid #e2e9f4;border-radius:10px;border-collapse:separate;overflow:hidden;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    <tr>
                      <td style="padding:13px 18px;border-bottom:1px solid #e2e9f4;font-family:${FONT_SANS};font-size:13px;color:#5b6b83;width:45%;">Transaction Status</td>
                      <td style="padding:13px 18px;border-bottom:1px solid #e2e9f4;text-align:right;">${statusBadgeClassic(
                        message.transactionStatus
                      )}</td>
                    </tr>
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
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
                <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:19px;color:#5b6b83;">This is an automated message — please do not reply to this email.</p>
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
  const bg = message.backgroundColor || "#f4f6fb";

  const cell = (label, value) =>
    value
      ? `<td style="padding:14px;background-color:#f6f5ff;border:1px solid #e9e6ff;border-radius:12px;font-family:${FONT_SANS};font-size:13px;color:#1e1b4b;vertical-align:top;">
           <div style="font-size:10px;letter-spacing:0.6px;text-transform:uppercase;color:#7c7fa3;font-weight:700;margin-bottom:5px;">${escapeHtml(
             label
           )}</div>
           <div style="font-size:13.5px;font-weight:600;word-break:break-word;">${escapeHtml(
             value
           )}</div>
         </td>`
      : "";

  const statusStyle = statusColor(message.transactionStatus);

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:620px;max-width:620px;">
            <tr>
              <td style="padding:44px 40px 68px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#a855f7 100%);border-radius:22px 22px 0 0;text-align:center;color:#ffffff;">
                ${logoBlock(message, logoSrc, {
                  fallbackBg: "rgba(255,255,255,0.18)",
                  borderRadius: "50%",
                  fallbackSize: 62,
                })}
                <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#e9d5ff;">${escapeHtml(
                  message.senderName
                )}</p>
                <h1 style="margin:0;font-family:${FONT_SANS};font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;">${escapeHtml(
                  message.title
                )}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 18px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:22px;box-shadow:0 18px 46px rgba(79,70,229,0.18);margin-top:-44px;">
                  <tr>
                    <td style="padding:34px 32px 30px;">
                      <p style="margin:0 0 22px;font-family:${FONT_SANS};font-size:15px;line-height:24px;color:#1f2a3d;">${escapeHtml(
                        message.headerMessage
                      )}</p>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          ${cell("Account Name", message.accountName)}
                          ${cell(
                            "Amount",
                            formatAmount(message.currency, message.amount)
                          )}
                        </tr>
                        <tr><td colspan="2" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
                        <tr>
                          ${cell("Account Number", message.accountNumber)}
                          <td style="padding:14px;background-color:#f6f5ff;border:1px solid #e9e6ff;border-radius:12px;font-family:${FONT_SANS};vertical-align:top;">
                            <div style="font-size:10px;letter-spacing:0.6px;text-transform:uppercase;color:#7c7fa3;font-weight:700;margin-bottom:5px;">Status</div>
                            <div style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${
                              statusStyle.color
                            };background-color:${
    statusStyle.background
  };">${escapeHtml(message.transactionStatus)}</div>
                          </td>
                        </tr>
                        <tr><td colspan="2" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
                        <tr>
                          ${cell(
                            "Transaction Number",
                            message.transactionNumber
                          )}
                          ${cell(
                            "Transaction Date",
                            formatDateTime(message.transactionDate)
                          )}
                        </tr>
                        ${
                          message.senderDetails
                            ? `<tr><td colspan="2" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
                               <tr><td colspan="2">${cell(
                                 "Sender Details",
                                 message.senderDetails
                               ).replace(
                                 /<td/,
                                 "<td colspan=\"2\""
                               )}</td></tr>`
                            : ""
                        }
                      </table>

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
                Automated message — please do not reply. © ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}
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
  const bg = message.backgroundColor || "#0b1220";

  const row = (label, value, isStatus) =>
    value || isStatus
      ? `<tr>
           <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-family:${FONT_SANS};font-size:13px;color:#6b7280;width:42%;vertical-align:middle;">${escapeHtml(
             label
           )}</td>
           <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-family:${FONT_SANS};font-size:13px;color:#111827;font-weight:600;text-align:right;vertical-align:middle;word-break:break-word;">${
             isStatus
               ? `<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${
                   statusColor(message.transactionStatus).color
                 };background-color:${
                   statusColor(message.transactionStatus).background
                 };">${escapeHtml(message.transactionStatus)}</span>`
               : escapeHtml(value)
           }</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620"
                 style="width:620px;max-width:620px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 12px 34px rgba(0,0,0,0.4);">
            <tr>
              <td style="padding:26px 32px;background-color:#111827;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:16px;vertical-align:middle;">
                      ${logoBlock(message, logoSrc, {
                        width: 52,
                        height: 52,
                        fallbackBg: "#2563eb",
                        fallbackSize: 52,
                        borderRadius: "10px",
                        marginBottom: 0,
                      })}
                    </td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 3px;font-family:${FONT_SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;">${escapeHtml(
                        message.senderName
                      )}</p>
                      <h1 style="margin:0;font-family:${FONT_SANS};font-size:18px;line-height:1.3;font-weight:700;color:#f9fafb;">${escapeHtml(
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

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="width:100%;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;border-collapse:separate;overflow:hidden;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    ${row("", "", true)}
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
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
                Automated message — please do not reply. © ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}
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
  const bg = message.backgroundColor || "#ffffff";

  const row = (label, value) =>
    value
      ? `<div style="padding:12px 0;border-bottom:1px solid #f1f1f1;">
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr>
               <td style="font-family:${FONT_SANS};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;font-weight:700;vertical-align:middle;">${escapeHtml(
                 label
               )}</td>
               <td style="font-family:${FONT_SANS};font-size:14px;color:#0f172a;font-weight:500;text-align:right;vertical-align:middle;word-break:break-word;">${escapeHtml(
                 value
               )}</td>
             </tr>
           </table>
         </div>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580"
                 style="width:580px;max-width:580px;background-color:#ffffff;padding:40px 40px 32px;border-radius:6px;border:1px solid #f0f0f0;">

            <tr>
              <td style="padding-bottom:22px;border-bottom:1px solid #ececec;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:14px;vertical-align:middle;">
                      ${logoBlock(message, logoSrc, {
                        width: 44,
                        height: 44,
                        fallbackBg: "#0f172a",
                        fallbackSize: 44,
                        borderRadius: "8px",
                        marginBottom: 0,
                      })}
                    </td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0;font-family:${FONT_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;font-weight:700;">${escapeHtml(
                        message.senderName
                      )}</p>
                      <h1 style="margin:4px 0 0;font-family:${FONT_SANS};font-size:20px;line-height:1.3;font-weight:600;color:#0f172a;">${escapeHtml(
                        message.title
                      )}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:26px;">
                <p style="margin:0 0 28px;font-family:${FONT_SANS};font-size:14px;line-height:1.75;color:#334155;">${escapeHtml(
                  message.headerMessage
                )}</p>

                ${row("Account Name", message.accountName)}
                ${row(
                  "Amount",
                  formatAmount(message.currency, message.amount)
                )}
                ${row("Account Number", message.accountNumber)}
                ${row("Status", message.transactionStatus)}
                ${row("Transaction Number", message.transactionNumber)}
                ${row(
                  "Transaction Date",
                  formatDateTime(message.transactionDate)
                )}
                ${row("Sender Details", message.senderDetails)}

                ${
                  message.closingMessage
                    ? `<p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:#64748b;">${escapeHtml(
                        message.closingMessage
                      )}</p>`
                    : ""
                }

                ${
                  message.buttonName && message.buttonLink
                    ? `<p style="margin:20px 0 0;font-family:${FONT_SANS};font-size:13px;">
                         <a href="${escapeHtml(
                           message.buttonLink
                         )}" target="_blank" rel="noopener noreferrer" style="color:#0f172a;font-weight:600;text-decoration:none;border-bottom:1px solid #0f172a;padding-bottom:2px;">${escapeHtml(
                        message.buttonName
                      )} →</a>
                       </p>`
                    : ""
                }

                <div style="margin-top:32px;padding-top:18px;border-top:1px solid #ececec;font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:#94a3b8;">
                  <p style="margin:0;">Automated message — please do not reply.</p>
                  <p style="margin:4px 0 0;">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )}</p>
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
  const bg = message.backgroundColor || "#eef2f7";

  const row = (label, value) =>
    value
      ? `<tr>
           <th style="padding:11px 14px;background-color:#f8fafc;font-family:${FONT_SANS};font-size:13px;color:#64748b;font-weight:600;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid #e2e8f0;">${escapeHtml(
             label
           )}</th>
           <td style="padding:11px 14px;font-family:${FONT_SANS};font-size:13px;color:#0f172a;font-weight:600;text-align:left;vertical-align:top;border-bottom:1px solid #e2e8f0;word-break:break-word;">${escapeHtml(
             value
           )}</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640"
                 style="width:640px;max-width:640px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,30,51,0.12);">

            <tr>
              <td width="200" valign="top" style="padding:32px 20px;background-color:#0b3d91;text-align:center;">
                ${logoBlock(message, logoSrc, {
                  width: 60,
                  height: 60,
                  fallbackBg: "rgba(255,255,255,0.15)",
                  fallbackSize: 60,
                  borderRadius: "12px",
                  marginBottom: 14,
                })}
                <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:13px;font-weight:700;color:#ffffff;word-break:break-word;">${escapeHtml(
                  message.senderName
                )}</p>
                <p style="margin:0;font-family:${FONT_SANS};font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,0.7);">Transaction Notification</p>
              </td>

              <td valign="top" style="padding:30px 32px 26px;background-color:#ffffff;">
                <h1 style="margin:0 0 10px;font-family:${FONT_SANS};font-size:20px;line-height:1.3;font-weight:700;color:#0b3d91;">${escapeHtml(
                  message.title
                )}</h1>
                <p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:14px;line-height:23px;color:#475569;">${escapeHtml(
                  message.headerMessage
                )}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="width:100%;border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;overflow:hidden;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    <tr>
                      <th style="padding:11px 14px;background-color:#f8fafc;font-family:${FONT_SANS};font-size:13px;color:#64748b;font-weight:600;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid #e2e8f0;">Status</th>
                      <td style="padding:11px 14px;font-family:${FONT_SANS};font-size:13px;color:#0f172a;font-weight:600;text-align:left;vertical-align:top;border-bottom:1px solid #e2e8f0;">
                        <span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${
                          statusColor(message.transactionStatus).color
                        };background-color:${
    statusColor(message.transactionStatus).background
  };">${escapeHtml(message.transactionStatus)}</span>
                      </td>
                    </tr>
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
                </table>

                ${
                  message.closingMessage
                    ? `<p style="margin:20px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:23px;color:#64748b;">${escapeHtml(
                        message.closingMessage
                      )}</p>`
                    : ""
                }

                ${
                  message.buttonName && message.buttonLink
                    ? `<p style="margin:22px 0 0;">
                         <a href="${escapeHtml(
                           message.buttonLink
                         )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 26px;background-color:#0b3d91;color:#ffffff;font-family:${FONT_SANS};font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;">${escapeHtml(
                        message.buttonName
                      )}</a>
                       </p>`
                    : ""
                }

                <p style="margin:22px 0 0;font-family:${FONT_SANS};font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )} — automated message, please do not reply.</p>
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
  const bg = message.backgroundColor || "#f7f2e8";

  const row = (label, value) =>
    value
      ? `<tr>
           <th style="padding:12px 6px;font-family:${FONT_SERIF};font-size:14px;color:#8b7550;font-weight:500;letter-spacing:0.5px;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid #eadfc6;">${escapeHtml(
             label
           )}</th>
           <td style="padding:12px 6px;font-family:${FONT_SERIF};font-size:14px;color:#2a2114;font-weight:600;text-align:right;vertical-align:top;border-bottom:1px solid #eadfc6;word-break:break-word;">${escapeHtml(
             value
           )}</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
                 style="width:600px;max-width:600px;background-color:#fdfaf3;border-radius:4px;padding:16px;border:1px solid #eadfc6;">
            <tr>
              <td style="border:1px solid #d8c290;padding:34px 32px 28px;border-radius:2px;text-align:center;">

                ${logoBlock(message, logoSrc, {
                  fallbackBg: "#b08d57",
                  borderRadius: "50%",
                  fallbackSize: 56,
                })}

                <p style="margin:0 0 8px;font-family:${FONT_SERIF};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b08d57;">${escapeHtml(
                  message.senderName
                )}</p>
                <h1 style="margin:0;font-family:${FONT_SERIF};font-size:24px;line-height:1.35;font-weight:500;color:#2a2114;">${escapeHtml(
                  message.title
                )}</h1>

                <div style="display:inline-block;width:70px;height:2px;background-color:#b08d57;margin-top:16px;">&nbsp;</div>

                <p style="margin:22px 0 24px;font-family:${FONT_SERIF};font-size:15px;line-height:1.8;color:#4a3f2c;font-style:italic;">${escapeHtml(
                  message.headerMessage
                )}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    <tr>
                      <th style="padding:12px 6px;font-family:${FONT_SERIF};font-size:14px;color:#8b7550;font-weight:500;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid #eadfc6;">Status</th>
                      <td style="padding:12px 6px;font-family:${FONT_SERIF};font-size:14px;color:#b08d57;font-style:italic;font-weight:600;text-align:right;vertical-align:top;border-bottom:1px solid #eadfc6;">${escapeHtml(
                        message.transactionStatus
                      )}</td>
                    </tr>
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
                </table>

                ${
                  message.closingMessage
                    ? `<p style="margin:0 0 22px;font-family:${FONT_SERIF};font-size:14px;line-height:1.8;color:#4a3f2c;">${escapeHtml(
                        message.closingMessage
                      )}</p>`
                    : ""
                }

                ${
                  message.buttonName && message.buttonLink
                    ? `<p style="margin:24px 0 0;">
                         <a href="${escapeHtml(
                           message.buttonLink
                         )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 34px;background-color:transparent;color:#8b6b2e;border:1px solid #b08d57;font-family:${FONT_SERIF};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:2px;">${escapeHtml(
                        message.buttonName
                      )}</a>
                       </p>`
                    : ""
                }

                <p style="margin:26px 0 0;font-family:${FONT_SERIF};font-size:11px;color:#8b7550;letter-spacing:1px;">© ${new Date().getFullYear()} ${escapeHtml(
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
/*  7. Bold Contrast                                                   */
/* ================================================================== */

const buildBoldContrast = (message, logoSrc) => {
  const bg = message.backgroundColor || "#ffffff";

  const row = (label, value) =>
    value
      ? `<tr>
           <th style="padding:12px 16px;background-color:#f5f5f5;font-family:${FONT_SANS};font-size:11px;color:#000000;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;text-align:left;vertical-align:top;width:42%;border-bottom:2px solid #000000;">${escapeHtml(
             label
           )}</th>
           <td style="padding:12px 16px;font-family:${FONT_SANS};font-size:13px;color:#000000;font-weight:700;text-align:left;vertical-align:top;border-bottom:2px solid #000000;word-break:break-word;">${escapeHtml(
             value
           )}</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
                 style="width:600px;max-width:600px;background-color:#ffffff;border:3px solid #000000;border-radius:4px;overflow:hidden;">

            <tr>
              <td style="padding:30px 32px;background-color:#000000;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:18px;vertical-align:middle;">
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
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f59e0b;font-weight:800;">${escapeHtml(
                        message.senderName
                      )}</p>
                      <h1 style="margin:0;font-family:${FONT_SANS};font-size:22px;line-height:1.25;font-weight:900;color:#ffffff;letter-spacing:-0.3px;">${escapeHtml(
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

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="border:2px solid #000000;border-collapse:collapse;margin-bottom:22px;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    <tr>
                      <th style="padding:12px 16px;background-color:#f5f5f5;font-family:${FONT_SANS};font-size:11px;color:#000000;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;text-align:left;vertical-align:top;width:42%;border-bottom:2px solid #000000;">Status</th>
                      <td style="padding:12px 16px;font-family:${FONT_SANS};font-size:13px;color:#000000;font-weight:700;text-align:left;vertical-align:top;border-bottom:2px solid #000000;">
                        <span style="display:inline-block;padding:3px 12px;background-color:#000000;color:#f59e0b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(
                          message.transactionStatus
                        )}</span>
                      </td>
                    </tr>
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
                </table>

                ${
                  message.closingMessage
                    ? `<p style="margin:0 0 20px;font-family:${FONT_SANS};font-size:14px;line-height:1.65;color:#333333;">${escapeHtml(
                        message.closingMessage
                      )}</p>`
                    : ""
                }

                ${
                  message.buttonName && message.buttonLink
                    ? `<p style="margin:24px 0 0;">
                         <a href="${escapeHtml(
                           message.buttonLink
                         )}" target="_blank" rel="noopener noreferrer" style="display:block;padding:16px 24px;background-color:#f59e0b;color:#000000;text-align:center;font-family:${FONT_SANS};font-size:14px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border:2px solid #000000;">${escapeHtml(
                        message.buttonName
                      )}</a>
                       </p>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px;background-color:#000000;text-align:center;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.5px;color:#ffffff;">
                © ${new Date().getFullYear()} ${escapeHtml(
    message.senderName
  )} — automated message
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
  const bg = message.backgroundColor || "#f3efff";

  const statusStyle = statusColor(message.transactionStatus);

  const cell = (label, value) =>
    value
      ? `<td width="50%" valign="top" style="padding:14px;background-color:#faf5ff;border:1px solid #ede9fe;border-radius:14px;">
           <div style="font-family:${FONT_SANS};font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#a78bfa;font-weight:700;margin-bottom:4px;">${escapeHtml(
             label
           )}</div>
           <div style="font-family:${FONT_SANS};font-size:13px;color:#4c1d95;font-weight:600;word-break:break-word;">${escapeHtml(
             value
           )}</div>
         </td>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
                 style="width:600px;max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 16px 40px rgba(139,92,246,0.12);">

            <tr>
              <td style="padding:36px 34px 22px;text-align:center;">
                ${logoBlock(message, logoSrc, {
                  fallbackBg: "#a78bfa",
                  borderRadius: "50%",
                  fallbackSize: 56,
                })}
                <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8b5cf6;font-weight:700;">${escapeHtml(
                  message.senderName
                )}</p>
                <h1 style="margin:0;font-family:${FONT_SANS};font-size:22px;line-height:1.3;font-weight:700;color:#4c1d95;">${escapeHtml(
                  message.title
                )}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 34px 28px;">
                <p style="margin:0 0 22px;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:#4b5563;text-align:center;">${escapeHtml(
                  message.headerMessage
                )}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding-bottom:14px;">
                      <span style="display:inline-block;padding:8px 20px;background-color:#ede9fe;color:#5b21b6;font-family:${FONT_SANS};font-size:13px;font-weight:700;border-radius:999px;">${escapeHtml(
                        formatAmount(message.currency, message.amount)
                      )}</span>
                      &nbsp;
                      <span style="display:inline-block;padding:8px 20px;color:${
                        statusStyle.color
                      };background-color:${
    statusStyle.background
  };font-family:${FONT_SANS};font-size:13px;font-weight:700;border-radius:999px;">${escapeHtml(
    message.transactionStatus
  )}</span>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    ${cell("Account Name", message.accountName)}
                    <td width="14">&nbsp;</td>
                    ${cell("Account Number", message.accountNumber)}
                  </tr>
                  <tr><td colspan="3" style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>
                  <tr>
                    ${cell("Transaction Number", message.transactionNumber)}
                    <td width="14">&nbsp;</td>
                    ${cell(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                  </tr>
                  ${
                    message.senderDetails
                      ? `<tr><td colspan="3" style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>
                         <tr>
                           <td colspan="3" valign="top" style="padding:14px;background-color:#faf5ff;border:1px solid #ede9fe;border-radius:14px;">
                             <div style="font-family:${FONT_SANS};font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#a78bfa;font-weight:700;margin-bottom:4px;">Sender Details</div>
                             <div style="font-family:${FONT_SANS};font-size:13px;color:#4c1d95;font-weight:600;word-break:break-word;">${escapeHtml(
                               message.senderDetails
                             )}</div>
                           </td>
                         </tr>`
                      : ""
                  }
                </table>

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
  const bg = message.backgroundColor || "#0b1220";

  const statusStyle = {
    pending: "#fbbf24",
    successful: "#4ade80",
    failed: "#f87171",
  }[statusKey(message.transactionStatus)] || "#fbbf24";

  const codeRow = (key, value, extraStyle = "") =>
    `<span style="color:#22d3ee;">${escapeHtml(key)}</span><span style="${extraStyle}">:</span><span>${escapeHtml(
      value
    )}</span>\n`;

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620"
                 style="width:620px;max-width:620px;background-color:#0f172a;border-radius:12px;border:1px solid #1e293b;overflow:hidden;">

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
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:14px;vertical-align:middle;">
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
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 4px;font-family:${FONT_MONO};font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#22d3ee;">${escapeHtml(
                        message.senderName
                      )}</p>
                      <h1 style="margin:0;font-family:${FONT_MONO};font-size:17px;line-height:1.35;font-weight:600;color:#f1f5f9;">${escapeHtml(
                        message.title
                      )}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 26px 0;">
                <p style="margin:0;font-family:${FONT_MONO};font-size:13px;line-height:1.75;color:#94a3b8;">${escapeHtml(
                  message.headerMessage
                )}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 26px;">
                <div style="padding:18px 20px;background-color:#020617;border:1px solid #1e293b;border-radius:8px;font-family:${FONT_MONO};font-size:12.5px;line-height:1.9;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;">
${codeRow("account_name", message.accountName)}${codeRow(
    "amount",
    formatAmount(message.currency, message.amount)
  )}${codeRow("account_number", message.accountNumber)}<span style="color:#22d3ee;">status</span><span>:</span><span style="color:${statusStyle};">[${escapeHtml(
    message.transactionStatus
  )}]</span>\n${codeRow(
    "transaction_id",
    message.transactionNumber
  )}${codeRow(
    "timestamp",
    formatDateTime(message.transactionDate)
  )}${
    message.senderDetails ? codeRow("sender", message.senderDetails) : ""
  }</div>
              </td>
            </tr>

            ${
              message.closingMessage
                ? `<tr>
                     <td style="padding:0 26px 18px;">
                       <p style="margin:0;font-family:${FONT_MONO};font-size:12.5px;line-height:1.75;color:#94a3b8;">${escapeHtml(
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

            <tr>
              <td style="padding:14px 26px;background-color:#020617;border-top:1px solid #1e293b;font-family:${FONT_MONO};font-size:11px;color:#475569;">
                // automated message — do not reply
              </td>
            </tr>

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
  const bg = message.backgroundColor || "#0a1730";

  const row = (label, value) =>
    value
      ? `<tr>
           <th style="padding:13px 6px;font-family:${FONT_SERIF};font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#d4af37;font-weight:500;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid rgba(212,175,55,0.15);">${escapeHtml(
             label
           )}</th>
           <td style="padding:13px 6px;font-family:${FONT_SANS};font-size:13px;color:#f5f0e1;font-weight:500;text-align:right;vertical-align:top;border-bottom:1px solid rgba(212,175,55,0.15);word-break:break-word;">${escapeHtml(
             value
           )}</td>
         </tr>`
      : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${escapeHtml(
      bg
    )};padding:36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620"
                 style="width:620px;max-width:620px;background-color:#0a1730;border-radius:6px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,0.4);">
            <tr>
              <td style="border:1px solid #d4af37;padding:36px 34px 28px;border-radius:2px;background-color:#0d1f3d;text-align:center;">

                ${logoBlock(message, logoSrc, {
                  fallbackBg: "#d4af37",
                  fallbackColor: "#0a1730",
                  borderRadius: "50%",
                  fallbackSize: 60,
                  fallbackFont: 24,
                })}

                <p style="margin:0 0 8px;font-family:${FONT_SERIF};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#d4af37;">${escapeHtml(
                  message.senderName
                )}</p>
                <h1 style="margin:0;font-family:${FONT_SERIF};font-size:23px;line-height:1.35;font-weight:500;color:#f5f0e1;letter-spacing:0.3px;">${escapeHtml(
                  message.title
                )}</h1>

                <div style="display:inline-block;width:80px;height:1px;background-color:#d4af37;margin-top:18px;">&nbsp;</div>

                <p style="margin:24px 0 26px;font-family:${FONT_SANS};font-size:14px;line-height:1.75;color:#cbd5e1;">${escapeHtml(
                  message.headerMessage
                )}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="width:100%;border-top:1px solid rgba(212,175,55,0.35);border-bottom:1px solid rgba(212,175,55,0.35);margin-bottom:24px;">
                  <tbody>
                    ${row("Account Name", message.accountName)}
                    ${row(
                      "Amount",
                      formatAmount(message.currency, message.amount)
                    )}
                    ${row("Account Number", message.accountNumber)}
                    <tr>
                      <th style="padding:13px 6px;font-family:${FONT_SERIF};font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#d4af37;font-weight:500;text-align:left;vertical-align:top;width:42%;border-bottom:1px solid rgba(212,175,55,0.15);">Status</th>
                      <td style="padding:13px 6px;text-align:right;vertical-align:top;border-bottom:1px solid rgba(212,175,55,0.15);">
                        <span style="display:inline-block;padding:4px 14px;border:1px solid #d4af37;color:#d4af37;font-family:${FONT_SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">${escapeHtml(
                          message.transactionStatus
                        )}</span>
                      </td>
                    </tr>
                    ${row("Transaction Number", message.transactionNumber)}
                    ${row(
                      "Transaction Date",
                      formatDateTime(message.transactionDate)
                    )}
                    ${row("Sender Details", message.senderDetails)}
                  </tbody>
                </table>

                ${
                  message.closingMessage
                    ? `<p style="margin:0 0 22px;font-family:${FONT_SANS};font-size:13.5px;line-height:1.75;color:#cbd5e1;">${escapeHtml(
                        message.closingMessage
                      )}</p>`
                    : ""
                }

                ${
                  message.buttonName && message.buttonLink
                    ? `<p style="margin:26px 0 0;">
                         <a href="${escapeHtml(
                           message.buttonLink
                         )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 40px;background-color:#d4af37;color:#0a1730;font-family:${FONT_SERIF};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:2px;box-shadow:0 6px 18px rgba(212,175,55,0.28);">${escapeHtml(
                        message.buttonName
                      )}</a>
                       </p>`
                    : ""
                }

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

/**
 * Builds the full responsive HTML email for the given template.
 *
 * @param {object} message  The normalised message payload.
 * @param {string} logoSrc  Resolved logo source (`https://…` or `cid:…`).
 */
const buildEmailHtml = (message, logoSrc = "") => {
  const templateId = message.template || "classic-blue";
  const builder = BUILDERS[templateId] || BUILDERS["classic-blue"];
  return builder(message, logoSrc);
};

/* ------------------------------------------------------------------ */
/*  Plain-text fallback (template-agnostic)                            */
/* ------------------------------------------------------------------ */

const buildEmailText = (message) => {
  const lines = [];

  lines.push(message.senderName || "Notification Service");
  lines.push(message.title || "Transaction Notification");
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
  add("Transaction Status", message.transactionStatus);
  add("Transaction Number", message.transactionNumber);
  add("Transaction Date", formatDateTime(message.transactionDate));
  add("Sender Details", message.senderDetails);

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
  lines.push("This is an automated message — please do not reply to this email.");
  lines.push(
    `© ${new Date().getFullYear()} ${
      message.senderName || "Our Team"
    }. All rights reserved.`
  );

  return lines.join("\n");
};

module.exports = { buildEmailHtml, buildEmailText };