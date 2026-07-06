const nodemailer = require('nodemailer');

const welcomeEmailTemplate = require('../templates/welcomeEmail');
const appointmentConfirmationTemplate = require('../templates/appointmentConfirmation');
const appointmentReminderTemplate = require('../templates/appointmentReminder');
const passwordResetTemplate = require('../templates/passwordReset');
const invoiceEmailTemplate = require('../templates/invoiceEmail');

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || `PrimeHeal Hospital <${EMAIL_USER || 'no-reply@primeheal.com'}>`;
const SMTP_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const SMTP_REJECT_UNAUTHORIZED = String(process.env.SMTP_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

let transporter;
let transporterPromise;

// -----------------------------------------------------------------------------
// Generic helpers
// -----------------------------------------------------------------------------

const sleep = async (ms) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
};

const ensureString = (value, fieldName) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required and must be a non-empty string.`);
  }
};

const validateSendEmailPayload = ({ to, subject, html, text }) => {
  ensureString(to, 'Recipient email');
  ensureString(subject, 'Subject');
  ensureString(html, 'HTML body');

  if (!isValidEmail(to)) {
    throw new Error('Recipient email is not a valid email address.');
  }

  if (text !== undefined && typeof text !== 'string') {
    throw new Error('Text body must be a string when provided.');
  }
};

const buildTextFallback = (value) => {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const createTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured to use Gmail SMTP.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    tls: {
      rejectUnauthorized: SMTP_REJECT_UNAUTHORIZED
    }
  });
};

const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  if (!transporterPromise) {
    transporterPromise = (async () => {
      const createdTransporter = createTransporter();
      transporter = createdTransporter;
      return createdTransporter;
    })();
  }

  return transporterPromise;
};

// -----------------------------------------------------------------------------
// SMTP lifecycle
// -----------------------------------------------------------------------------

const verifySmtpConnection = async () => {
  try {
    const smtpTransporter = await getTransporter();
    await withTimeout(smtpTransporter.verify(), SMTP_TIMEOUT_MS, 'SMTP verification');
    console.log('✓ Gmail SMTP Connected');
    return { success: true };
  } catch (error) {
    console.error(`Gmail SMTP connection failed: ${error.message}`);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

// -----------------------------------------------------------------------------
// Core email sender
// -----------------------------------------------------------------------------

const sendEmail = async ({ to, subject, html, text = '' }) => {
  validateSendEmailPayload({ to, subject, html, text });

  const smtpTransporter = await getTransporter();
  const finalText = text && text.trim() ? text : buildTextFallback(html);

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const info = await withTimeout(
        smtpTransporter.sendMail({
          from: EMAIL_FROM,
          to: String(to).trim(),
          subject: String(subject).trim(),
          html,
          text: finalText
        }),
        SMTP_TIMEOUT_MS,
        `Email send attempt ${attempt}`
      );

      console.log(`Email sent successfully to ${to} on attempt ${attempt}. Message ID: ${info.messageId || 'unknown'}`);

      return {
        success: true,
        message: 'Email sent successfully.',
        info
      };
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed for ${to}:`, error);

      if (attempt < MAX_RETRIES) {
        const backoffMs = 1000 * (2 ** (attempt - 1));
        await sleep(backoffMs);
      }
    }
  }

  return {
    success: false,
    message: lastError?.message || 'Failed to send email after retries.',
    error: lastError
  };
};

// -----------------------------------------------------------------------------
// Reusable helper functions required by the PrimeHeal backend
// -----------------------------------------------------------------------------

const sendWelcomeEmail = async (user = {}) => {
  const recipient = user.email || user.to;
  const subject = 'Welcome to PrimeHeal Hospital';
  const html = welcomeEmailTemplate(user);
  const text = `Hello ${user.name || 'there'}, your PrimeHeal account is ready.`;

  return await sendEmail({ to: recipient, subject, html, text });
};

const sendAppointmentConfirmation = async (patient = {}, appointment = {}) => {
  const recipient = patient.email || appointment.patientEmail || appointment.to;
  const subject = 'PrimeHeal Appointment Confirmation';
  const html = appointmentConfirmationTemplate(patient, appointment);
  const text = `Hello ${patient.name || appointment.patientName || 'Patient'}, your appointment has been confirmed.`;

  return await sendEmail({ to: recipient, subject, html, text });
};

const sendAppointmentReminder = async (patient = {}, appointment = {}) => {
  const recipient = patient.email || appointment.patientEmail || appointment.to;
  const subject = 'PrimeHeal Appointment Reminder';
  const html = appointmentReminderTemplate(patient, appointment);
  const text = `Reminder for ${patient.name || appointment.patientName || 'Patient'}: your PrimeHeal appointment is coming up soon.`;

  return await sendEmail({ to: recipient, subject, html, text });
};

const sendPasswordResetOTP = async (user = {}, otp = '') => {
  const recipient = user.email || user.to;
  const subject = 'PrimeHeal Password Reset OTP';
  const html = passwordResetTemplate(user, otp);
  const text = `Hello ${user.name || 'User'}, your PrimeHeal password reset OTP is ${otp}.`;

  return await sendEmail({ to: recipient, subject, html, text });
};

const sendInvoice = async (patient = {}, invoice = {}) => {
  const recipient = patient.email || invoice.patientEmail || invoice.to;
  const subject = 'PrimeHeal Invoice';
  const html = invoiceEmailTemplate(patient, invoice);
  const text = `Hello ${patient.name || invoice.patientName || 'Patient'}, your PrimeHeal invoice is ready.`;

  return await sendEmail({ to: recipient, subject, html, text });
};

// -----------------------------------------------------------------------------
// Legacy compatibility helpers used by existing controllers
// -----------------------------------------------------------------------------

const buildLegacyTemplate = ({ title, heading, bodyLines, ctaText, ctaUrl }) => {
  const safeLines = Array.isArray(bodyLines) ? bodyLines : [];

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">PrimeHeal Hospital</div>
      <h1 style="margin:10px 0 18px;font-size:26px;color:#0f172a;">${heading}</h1>
      ${safeLines.map((line) => `<p style="margin:0 0 14px;line-height:1.7;color:#1f2937;">${line}</p>`).join('')}
      ${ctaText && ctaUrl ? `<p style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">${ctaText}</a></p>` : ''}
      <p style="margin-top:28px;color:#64748b;font-size:12px;">${title}</p>
    </div>
  `;
};

const sendRegistrationEmail = async ({ to, name, userType }) => {
  const subject = 'PrimeHeal Registration Successful';
  const html = buildLegacyTemplate({
    title: 'PrimeHeal Registration',
    heading: 'Registration Complete',
    bodyLines: [
      `Hello ${name || 'User'},`,
      `Your PrimeHeal ${userType || 'account'} has been created successfully.`,
      'You can now sign in to the system using your registered email address.'
    ],
    ctaText: 'Open PrimeHeal',
    ctaUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name || 'User'}, your PrimeHeal ${userType || 'account'} has been created successfully.`
  });
};

const sendLoginEmail = async ({ to, name, userType }) => {
  const subject = 'PrimeHeal Login Successful';
  const html = buildLegacyTemplate({
    title: 'PrimeHeal Login',
    heading: 'Login Notification',
    bodyLines: [
      `Hello ${name || 'User'},`,
      `You have successfully signed in to your PrimeHeal ${userType || 'account'}.`,
      'If this was not you, reset your password immediately.'
    ],
    ctaText: 'Reset Password',
    ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name || 'User'}, you have successfully signed in to your PrimeHeal account.`
  });
};

const sendAppointmentEmail = async ({ to, name, doctorName, date, time, fee, status }) => {
  const patient = { name, email: to };
  const appointment = {
    doctorName,
    appointmentDate: date,
    appointmentTime: time,
    fee,
    status: status || 'Confirmed'
  };

  return await sendAppointmentConfirmation(patient, appointment);
};

const sendPasswordResetRequestEmail = async ({ to, name, resetUrl }) => {
  const subject = 'PrimeHeal Password Reset';
  const html = buildLegacyTemplate({
    title: 'PrimeHeal Password Reset',
    heading: 'Password Reset Request',
    bodyLines: [
      `Hello ${name || 'User'},`,
      'We received a request to reset your PrimeHeal password.',
      'Use the secure link below to continue.'
    ],
    ctaText: 'Reset Password',
    ctaUrl: resetUrl
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name || 'User'}, use the password reset link to continue.`
  });
};

const sendPasswordResetSuccessEmail = async ({ to, name }) => {
  const subject = 'PrimeHeal Password Updated';
  const html = buildLegacyTemplate({
    title: 'PrimeHeal Password Updated',
    heading: 'Password Reset Successful',
    bodyLines: [
      `Hello ${name || 'User'},`,
      'Your PrimeHeal password has been reset successfully.',
      'If you did not perform this action, contact support immediately.'
    ]
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name || 'User'}, your PrimeHeal password has been reset successfully.`
  });
};

module.exports = {
  verifySmtpConnection,
  sendEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendPasswordResetOTP,
  sendInvoice,
  sendRegistrationEmail,
  sendLoginEmail,
  sendAppointmentEmail,
  sendPasswordResetRequestEmail,
  sendPasswordResetSuccessEmail
};