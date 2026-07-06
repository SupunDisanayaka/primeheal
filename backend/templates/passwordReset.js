const { buildEmailLayout, escapeHtml } = require('./emailLayout');

const passwordReset = (user = {}, otp = '') => {
  const name = escapeHtml(user.name || 'User');
  const code = escapeHtml(otp || 'N/A');

  return buildEmailLayout({
    title: 'PrimeHeal Password Reset',
    preheader: 'Use the OTP below to reset your password.',
    heading: 'Password Reset OTP',
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello ${name},</p>
      <p style="margin:0 0 16px;">Use the following one-time password to complete your PrimeHeal password reset request.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:22px;text-align:center;margin:24px 0;">
        <div style="font-size:13px;color:#2563eb;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Reset Code</div>
        <div style="font-size:34px;font-weight:800;color:#0f172a;letter-spacing:0.14em;">${code}</div>
      </div>
      <p style="margin:0 0 10px;">This code should only be used on the official PrimeHeal reset flow.</p>
      <p style="margin:0;">If you did not request this, you can safely ignore this email.</p>
    `
  });
};

module.exports = passwordReset;