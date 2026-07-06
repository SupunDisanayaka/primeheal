const { buildEmailLayout, escapeHtml, formatDate, formatCurrency } = require('./emailLayout');

const appointmentReminder = (patient = {}, appointment = {}) => {
  const patientName = escapeHtml(patient.name || appointment.patientName || 'Patient');
  const doctorName = escapeHtml(appointment.doctorName || 'Assigned Doctor');
  const appointmentDate = formatDate(appointment.appointmentDate || appointment.date);
  const appointmentTime = escapeHtml(appointment.appointmentTime || appointment.time || 'N/A');
  const fee = formatCurrency(appointment.fee ?? appointment.totalCharge ?? 0);

  return buildEmailLayout({
    title: 'Appointment Reminder - PrimeHeal Hospital',
    preheader: 'Reminder for your upcoming appointment.',
    heading: 'Appointment Reminder',
    bodyHtml: `
      <p style="margin:0 0 16px;">Hello ${patientName},</p>
      <p style="margin:0 0 16px;">This is a friendly reminder that your appointment is coming up soon.</p>
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
          <td style="padding:12px 14px;background:#eff6ff;font-weight:700;">Fee</td>
          <td style="padding:12px 14px;">${fee}</td>
        </tr>
      </table>
      <p style="margin:18px 0 0;">If you need to reschedule, please contact the hospital team as early as possible.</p>
    `
  });
};

module.exports = appointmentReminder;