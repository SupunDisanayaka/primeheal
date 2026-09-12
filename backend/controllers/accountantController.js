const pool = require('../config/db');

/**
 * 1. collectCounterPayment
 * Records cash/POS payment for an appointment, updates payments table and sets appointment status to 'Paid'/'Completed'.
 */
const collectCounterPayment = async (req, res) => {
  try {
    const { appointmentId, paymentMethod, amount } = req.body;

    const aptID = Number(appointmentId);
    if (!aptID || isNaN(aptID)) {
      return res.status(400).json({ success: false, message: 'Valid appointment ID is required.' });
    }

    const [apptRows] = await pool.query(
      'SELECT appointmentID, patientID, doctorID, status, fee, totalCharge FROM appointments WHERE appointmentID = ?',
      [aptID]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment record not found.' });
    }

    const appt = apptRows[0];
    const finalAmount = amount ? Number(amount) : Number(appt.totalCharge || appt.fee || 0);
    const methodToUse = paymentMethod || 'Cash';

    // Insert or update payment record
    const merchantOrderId = `CTR-${Date.now()}-${aptID}`;
    const transactionId = `TXN-COUNTER-${Date.now()}`;

    await pool.query(
      `INSERT INTO payments
        (appointmentID, patientID, doctorID, merchantOrderId, transactionId, paymentGateway, amount, currency, paymentStatus, paymentMethod, verifiedAt)
       VALUES (?, ?, ?, ?, ?, 'Counter', ?, 'LKR', 'Completed', ?, CURRENT_TIMESTAMP)`,
      [aptID, appt.patientID, appt.doctorID, merchantOrderId, transactionId, finalAmount, methodToUse]
    );

    // Update appointment status to 'Completed' (or 'Paid')
    await pool.query("UPDATE appointments SET status = 'Completed' WHERE appointmentID = ?", [aptID]);

    // Ensure invoice record is created / updated
    const [existingInvoices] = await pool.query('SELECT invoiceID FROM invoice WHERE appointmentID = ?', [aptID]);
    let generatedInvoiceNumber;
    if (existingInvoices.length === 0) {
      generatedInvoiceNumber = `INV-CTR-${Date.now()}`;
      await pool.query(
        `INSERT INTO invoice (appointmentID, patientID, invoiceNumber, subtotal, tax, discount, totalAmount, issueDate, dueDate, status)
         VALUES (?, ?, ?, ?, 0.00, 0.00, ?, CURDATE(), CURDATE(), 'paid')`,
        [aptID, appt.patientID, generatedInvoiceNumber, finalAmount, finalAmount]
      );
    } else {
      await pool.query("UPDATE invoice SET status = 'paid', totalAmount = ? WHERE appointmentID = ?", [finalAmount, aptID]);
    }

    return res.status(200).json({
      success: true,
      message: `Counter payment of LKR ${finalAmount.toFixed(2)} recorded successfully via ${methodToUse}. Invoice issued.`,
      appointmentID: aptID,
      paymentStatus: 'Completed',
      status: 'Completed',
      invoiceNumber: generatedInvoiceNumber
    });
  } catch (error) {
    console.error('Error collecting counter payment:', error);
    return res.status(500).json({ success: false, message: 'Server error collecting payment', error: error.message });
  }
};

/**
 * 2. issueRefund
 * Processes appointment refund, updates payments.paymentStatus to 'Refunded', and cancels appointment.
 */
const issueRefund = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const aptID = Number(appointmentId);

    if (!aptID || isNaN(aptID)) {
      return res.status(400).json({ success: false, message: 'Valid appointment ID is required.' });
    }

    const [apptRows] = await pool.query(
      'SELECT appointmentID, status FROM appointments WHERE appointmentID = ?',
      [aptID]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment record not found.' });
    }

    // Update appointment status to 'Cancelled'
    await pool.query("UPDATE appointments SET status = 'Cancelled' WHERE appointmentID = ?", [aptID]);

    // Update payment status to 'Refunded'
    await pool.query("UPDATE payments SET paymentStatus = 'Refunded' WHERE appointmentID = ?", [aptID]);

    // Update invoice status to 'cancelled'
    await pool.query("UPDATE invoice SET status = 'cancelled' WHERE appointmentID = ?", [aptID]);

    return res.status(200).json({
      success: true,
      message: `Transaction refunded and appointment #${aptID} marked as Cancelled.`,
      appointmentID: aptID,
      status: 'Cancelled'
    });
  } catch (error) {
    console.error('Error issuing refund:', error);
    return res.status(500).json({ success: false, message: 'Server error issuing refund', error: error.message });
  }
};

/**
 * 3. getFinancialSummary
 * Returns real-time financial KPI metrics and per-doctor earnings breakdown for Accountant Dashboard.
 */
const getFinancialSummary = async (req, res) => {
  try {
    // 1. Total revenue from completed appointments or completed payments
    const [completedRev] = await pool.query(
      `SELECT COALESCE(SUM(totalCharge), 0.00) AS total
       FROM appointments
       WHERE status IN ('Completed', 'Paid')`
    );

    // 2. Pending revenue from unpaid/pending appointments
    const [pendingRev] = await pool.query(
      `SELECT COALESCE(SUM(totalCharge), 0.00) AS pending
       FROM appointments
       WHERE status IN ('Pending', 'Checked In')`
    );

    // 3. Total invoices / appointments count
    const [totalApts] = await pool.query('SELECT COUNT(*) AS total FROM appointments');
    const [unpaidApts] = await pool.query("SELECT COUNT(*) AS unpaid FROM appointments WHERE status IN ('Pending', 'Checked In')");

    // 4. Breakdown of earnings per doctor
    const [docEarnings] = await pool.query(
      `SELECT
        u.name AS name,
        COUNT(a.appointmentID) AS count,
        COALESCE(SUM(a.totalCharge), 0.00) AS earned
       FROM doctor d
       JOIN users u ON d.userID = u.userID
       LEFT JOIN appointments a ON d.doctorID = a.doctorID AND a.status IN ('Completed', 'Paid')
       GROUP BY d.doctorID, u.name`
    );

    return res.status(200).json({
      success: true,
      totalRevenue: Number(completedRev[0].total),
      pendingRevenue: Number(pendingRev[0].pending),
      totalInvoices: totalApts[0].total,
      unpaidCount: unpaidApts[0].unpaid,
      doctorRevenueBreakdown: docEarnings.map(item => ({
        name: item.name,
        count: Number(item.count),
        earned: Number(item.earned)
      }))
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching financial summary', error: error.message });
  }
};

/**
 * 4. recreateInvoice
 * Avoid the hassle of creating new invoices from scratch when needed;
 * allows accountants to recreate, regenerate, or adjust invoices for an appointment.
 */
const recreateInvoice = async (req, res) => {
  const { appointmentId, subtotal, tax, discount, dueDate } = req.body;
  const aptID = Number(appointmentId);

  if (!aptID || isNaN(aptID)) {
    return res.status(400).json({ success: false, message: 'Valid appointment ID is required' });
  }

  try {
    const [apptRows] = await pool.query(
      'SELECT a.*, p.patientID FROM appointments a INNER JOIN patient p ON a.patientID = p.patientID WHERE a.appointmentID = ?',
      [aptID]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment record not found' });
    }

    const appt = apptRows[0];
    const sub = subtotal !== undefined ? Number(subtotal) : Number(appt.fee || appt.totalCharge || 0);
    const tx = tax !== undefined ? Number(tax) : 0.00;
    const disc = discount !== undefined ? Number(discount) : 0.00;
    const total = Math.max(0, sub + tx - disc);

    const newInvoiceNumber = `INV-REC-${Date.now()}`;
    const invoiceDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [existing] = await pool.query('SELECT invoiceID FROM invoice WHERE appointmentID = ?', [aptID]);

    let invoiceID;
    if (existing.length > 0) {
      invoiceID = existing[0].invoiceID;
      await pool.query(
        `UPDATE invoice
         SET invoiceNumber = ?, subtotal = ?, tax = ?, discount = ?, totalAmount = ?, dueDate = ?, status = 'issued'
         WHERE invoiceID = ?`,
        [newInvoiceNumber, sub, tx, disc, total, invoiceDueDate, invoiceID]
      );
    } else {
      const [ins] = await pool.query(
        `INSERT INTO invoice (appointmentID, patientID, invoiceNumber, subtotal, tax, discount, totalAmount, issueDate, dueDate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, 'issued')`,
        [aptID, appt.patientID, newInvoiceNumber, sub, tx, disc, total, invoiceDueDate]
      );
      invoiceID = ins.insertId;
    }

    return res.json({
      success: true,
      message: `Invoice recreated successfully with Invoice #${newInvoiceNumber}`,
      invoice: {
        invoiceID,
        appointmentID: aptID,
        invoiceNumber: newInvoiceNumber,
        subtotal: sub,
        tax: tx,
        discount: disc,
        totalAmount: total,
        dueDate: invoiceDueDate,
        status: 'issued'
      }
    });
  } catch (error) {
    console.error('recreateInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Server error recreating invoice', error: error.message });
  }
};

/**
 * 5. getAllInvoices
 * Lists all invoices in the system with patient and appointment metadata for accountants.
 */
const getAllInvoices = async (req, res) => {
  try {
    const query = `
      SELECT
        i.invoiceID,
        i.appointmentID,
        i.invoiceNumber,
        i.subtotal,
        i.tax,
        i.discount,
        i.totalAmount,
        i.issueDate,
        i.dueDate,
        i.status,
        a.appointmentDate,
        a.appointmentTime,
        a.doctorName,
        u.name AS patientName,
        u.email AS patientEmail,
        p.patientCode,
        pay.paymentMethod,
        pay.paymentStatus
      FROM invoice i
      INNER JOIN appointments a ON i.appointmentID = a.appointmentID
      INNER JOIN patient p ON i.patientID = p.patientID
      INNER JOIN users u ON p.userID = u.userID
      LEFT JOIN payments pay ON pay.appointmentID = a.appointmentID
      ORDER BY i.issueDate DESC, i.invoiceID DESC
    `;

    const [rows] = await pool.query(query);

    return res.json({
      success: true,
      invoices: rows
    });
  } catch (error) {
    console.error('getAllInvoices error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving invoices', error: error.message });
  }
};

module.exports = {
  collectCounterPayment,
  issueRefund,
  getFinancialSummary,
  recreateInvoice,
  getAllInvoices
};
