const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return escapeHtml(value);
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR'
  }).format(amount);
};

const buildEmailLayout = ({
  title,
  preheader,
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  closingLine = 'Regards, PrimeHeal Hospital'
}) => {
  const ctaSection = ctaText && ctaUrl
    ? `
      <tr>
        <td style="padding: 12px 0 8px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">${escapeHtml(ctaText)}</a>
        </td>
      </tr>
    `
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <title>${escapeHtml(title)}</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              border-radius: 0 !important;
            }

            .content {
              padding: 24px 18px !important;
            }

            .heading {
              font-size: 26px !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#f3f7ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7ff;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" class="container" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(37,99,235,0.10);border:1px solid #dbeafe;">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:24px 28px;color:#ffffff;">
                    <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;opacity:0.92;">PrimeHeal Hospital</div>
                    <div style="font-size:28px;font-weight:800;line-height:1.2;margin-top:8px;">${escapeHtml(heading)}</div>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding:32px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:16px;line-height:1.7;color:#1f2937;">
                          ${bodyHtml}
                        </td>
                      </tr>
                      ${ctaSection}
                      <tr>
                        <td style="padding-top:24px;font-size:15px;line-height:1.7;color:#374151;">
                          ${escapeHtml(closingLine)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 28px;color:#64748b;font-size:12px;line-height:1.6;border-top:1px solid #e5eefc;background:#f8fbff;">
                    This message was sent by the PrimeHeal Hospital notification service.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

module.exports = {
  buildEmailLayout,
  escapeHtml,
  formatDate,
  formatCurrency
};