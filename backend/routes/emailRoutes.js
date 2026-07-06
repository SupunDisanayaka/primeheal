const express = require('express');

const router = express.Router();
const { sendEmail } = require('../services/emailService');

// POST /api/email/test
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">PrimeHeal Hospital</div>
        <h1 style="margin:10px 0 18px;font-size:26px;color:#0f172a;">PrimeHeal Email Test</h1>
        <p style="margin:0 0 14px;line-height:1.7;color:#1f2937;">Hello,</p>
        <p style="margin:0 0 14px;line-height:1.7;color:#1f2937;">This email confirms that the PrimeHeal notification service is working correctly.</p>
        <p style="margin:0;line-height:1.7;color:#1f2937;">Regards,<br />PrimeHeal Hospital</p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'PrimeHeal Email Test',
      html,
      text: 'Hello,\n\nThis email confirms that the PrimeHeal notification service is working correctly.\n\nRegards,\nPrimeHeal Hospital'
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Unable to send test email.'
      });
    }

    return res.json({
      success: true,
      message: 'Test email sent successfully.'
    });
  } catch (error) {
    console.error('Email test endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to send test email.'
    });
  }
});

module.exports = router;