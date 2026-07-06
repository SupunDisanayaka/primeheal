const { buildEmailLayout, escapeHtml, formatDate, formatCurrency } = require('./emailLayout');

const invoiceEmail = (patient = {}, invoice = {}) => {
  const patientName = escapeHtml(patient.name || invoice.patientName || 'Patient');
  const invoiceNumber = escapeHtml(invoice.invoiceNumber || invoice.invoiceID || 'N/A');
  const issueDate = formatDate(invoice.issueDate || invoice.createdAt || new Date());
  const dueDate = formatDate(invoice.dueDate || invoice.paymentDueDate);
  const totalAmount = formatCurrency(invoice.totalAmount ?? invoice.totalCharge ?? invoice.amountDue ?? 0);
  const paidAmount = formatCurrency(invoice.paidAmount ?? invoice.amountPaid ?? 0);
  const balance = formatCurrency(invoice.balance ?? invoice.outstandingAmount ?? 0);

  return buildEmailLayout({
    title: 'PrimeHeal Invoice',
    preheader: 'Your invoice summary from PrimeHeal Hospital.',
    heading: 'Invoice Summary',
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello ${patientName},</p>
      <p style="margin:0 0 18px;">Please find the invoice summary for your recent PrimeHeal service below.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #dbeafe;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;width:38%;">Invoice Number</td>
          <td style="padding:12px 14px;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Issue Date</td>
          <td style="padding:12px 14px;">${issueDate}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Due Date</td>
          <td style="padding:12px 14px;">${dueDate}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Paid Amount</td>
          <td style="padding:12px 14px;">${paidAmount}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Total Amount</td>
          <td style="padding:12px 14px;">${totalAmount}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Balance</td>
          <td style="padding:12px 14px;">${balance}</td>
        </tr>
      </table>
      <p style="margin:18px 0 0;">If you have billing questions, please contact the PrimeHeal accounts team.</p>
    `
  });
};

module.exports = invoiceEmail;