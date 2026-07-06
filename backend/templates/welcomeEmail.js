const { buildEmailLayout, escapeHtml } = require('./emailLayout');

const welcomeEmail = (user = {}) => {
  const name = escapeHtml(user.name || 'there');
  const role = escapeHtml(user.userType || 'member');
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return buildEmailLayout({
    title: 'Welcome to PrimeHeal Hospital',
    preheader: 'Your PrimeHeal account is ready.',
    heading: 'Welcome to PrimeHeal',
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello ${name},</p>
      <p style="margin:0 0 16px;">Your ${role} account has been successfully created in the PrimeHeal Hospital Management System.</p>
      <p style="margin:0 0 16px;">You can now sign in to access appointments, notifications, invoices, and your account details.</p>
      <ul style="margin:0;padding-left:20px;line-height:1.8;color:#1f2937;">
        <li>Secure access to hospital services</li>
        <li>Appointment and billing updates</li>
        <li>Professional support from the PrimeHeal team</li>
      </ul>
    `,
    ctaText: 'Open PrimeHeal',
    ctaUrl: appUrl
  });
};

module.exports = welcomeEmail;