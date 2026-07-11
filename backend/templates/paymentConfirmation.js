const { buildEmailLayout, escapeHtml, formatDate, formatCurrency } = require('./emailLayout');

const paymentConfirmation = (patient = {}, payment = {}) => {
  const patientName = escapeHtml(patient.name || payment.patientName || 'Patient');
  const doctorName = escapeHtml(payment.doctorName || 'Assigned Doctor');
  const appointmentDate = formatDate(payment.appointmentDate || payment.createdAt || payment.paymentDate);
  const appointmentTime = escapeHtml(payment.appointmentTime || payment.slotTime || 'N/A');
  const amount = formatCurrency(payment.amount ?? payment.totalCharge ?? payment.amountPaid ?? 0);
  const transactionId = escapeHtml(payment.transactionId || payment.paymentID || payment.merchantOrderId || 'N/A');
  const paymentStatus = escapeHtml(payment.paymentStatus || 'Completed');
  const receiptUrl = payment.receiptUrl ? escapeHtml(payment.receiptUrl) : '';

  return buildEmailLayout({
    title: 'Payment Confirmation - PrimeHeal Hospital',
    preheader: 'Your payment has been processed successfully.',
    heading: 'Payment Confirmed',
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello ${patientName},</p>
      <p style="margin:0 0 18px;">We have received your payment for the appointment below.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #dbeafe;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;width:38%;">Doctor</td>
          <td style="padding:12px 14px;">${doctorName}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Date</td>
          <td style="padding:12px 14px;">${appointmentDate}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Time</td>
          <td style="padding:12px 14px;">${appointmentTime}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Amount</td>
          <td style="padding:12px 14px;">${amount}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Transaction ID</td>
          <td style="padding:12px 14px;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Status</td>
          <td style="padding:12px 14px;">${paymentStatus}</td>
        </tr>
      </table>
      ${receiptUrl ? `<p style="margin:18px 0 0;">Receipt: <a href="${receiptUrl}" style="color:#2563eb;">View receipt</a></p>` : '<p style="margin:18px 0 0;">A receipt link was not provided by the gateway.</p>'}
    `
  });
};

module.exports = paymentConfirmation;