const { getPool } = require('../config/db');

/**
 * 1. getAppointmentReports
 * Requirement 2.4.8.1: Generates appointment reports with date ranges and doctor filters.
 */
const getAppointmentReports = async (req, res) => {
  try {
    const pool = await getPool();
    const { startDate, endDate, doctorId, status } = req.query;

    let query = `
      SELECT 
        a.appointmentID,
        a.patientID,
        pu.name AS patientName,
        pu.email AS patientEmail,
        pu.phone AS patientPhone,
        a.doctorID,
        du.name AS doctorName,
        d.specialization,
        a.appointmentDate,
        a.appointmentTime,
        a.status,
        a.paymentStatus,
        a.totalCharge,
        a.doctorNotes,
        a.createdAt
      FROM appointments a
      JOIN patient p ON a.patientID = p.patientID
      JOIN users pu ON p.userID = pu.userID
      JOIN doctor d ON a.doctorID = d.doctorID
      JOIN users du ON d.userID = du.userID
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND a.appointmentDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.appointmentDate <= ?';
      params.push(endDate);
    }
    if (doctorId && doctorId !== 'all') {
      query += ' AND a.doctorID = ?';
      params.push(doctorId);
    }
    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.appointmentDate DESC, a.appointmentTime DESC';

    const [appointments] = await pool.query(query, params);

    // Compute summary metrics
    const totalCount = appointments.length;
    const completedCount = appointments.filter(a => a.status === 'Completed').length;
    const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;
    const pendingCount = appointments.filter(a => a.status === 'Pending' || a.status === 'Checked In').length;
    const totalCharges = appointments.reduce((sum, a) => sum + Number(a.totalCharge || 0), 0);

    return res.json({
      success: true,
      summary: {
        totalCount,
        completedCount,
        cancelledCount,
        pendingCount,
        totalCharges
      },
      appointments
    });
  } catch (error) {
    console.error('Error in getAppointmentReports:', error);
    return res.status(500).json({ success: false, message: 'Server error generating appointment report', error: error.message });
  }
};

/**
 * 2. getFinancialReports
 * Requirement 2.4.8.2: Generates financial reports summarizing billing, revenue, and pending payments.
 */
const getFinancialReports = async (req, res) => {
  try {
    const pool = await getPool();
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    if (startDate) {
      dateFilter += ' AND a.appointmentDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND a.appointmentDate <= ?';
      params.push(endDate);
    }

    // Revenue from completed or paid appointments
    const [revSummary] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN a.status IN ('Completed', 'Paid') OR a.paymentStatus = 'Completed' THEN a.totalCharge ELSE 0 END), 0.00) AS totalCollected,
        COALESCE(SUM(CASE WHEN a.status NOT IN ('Completed', 'Cancelled') AND (a.paymentStatus IS NULL OR a.paymentStatus != 'Completed') THEN a.totalCharge ELSE 0 END), 0.00) AS pendingReceivables,
        COALESCE(SUM(CASE WHEN a.status = 'Cancelled' THEN a.totalCharge ELSE 0 END), 0.00) AS cancelledVolume,
        COUNT(a.appointmentID) AS totalTransactions
       FROM appointments a
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Breakdown by payment methods from payments table
    const [methodBreakdown] = await pool.query(
      `SELECT 
        COALESCE(p.paymentMethod, 'Counter / Unspecified') AS method,
        COUNT(p.paymentID) AS count,
        COALESCE(SUM(p.amount), 0.00) AS totalAmount
       FROM payments p
       JOIN appointments a ON p.appointmentID = a.appointmentID
       WHERE p.paymentStatus IN ('Completed', 'Paid') ${dateFilter}
       GROUP BY p.paymentMethod`
      , params
    );

    // Breakdown by doctor
    const [doctorBreakdown] = await pool.query(
      `SELECT 
        du.name AS doctorName,
        d.specialization,
        COUNT(a.appointmentID) AS totalAppointments,
        COALESCE(SUM(CASE WHEN a.status IN ('Completed', 'Paid') OR a.paymentStatus = 'Completed' THEN a.totalCharge ELSE 0 END), 0.00) AS revenueGenerated
       FROM doctor d
       JOIN users du ON d.userID = du.userID
       LEFT JOIN appointments a ON d.doctorID = a.doctorID ${dateFilter}
       GROUP BY d.doctorID, du.name, d.specialization
       ORDER BY revenueGenerated DESC`,
      params
    );

    // Daily billing trend (last 30 entries)
    const [dailyTrend] = await pool.query(
      `SELECT 
        a.appointmentDate AS date,
        COUNT(a.appointmentID) AS count,
        COALESCE(SUM(CASE WHEN a.status IN ('Completed', 'Paid') THEN a.totalCharge ELSE 0 END), 0.00) AS dailyRevenue
       FROM appointments a
       WHERE 1=1 ${dateFilter}
       GROUP BY a.appointmentDate
       ORDER BY a.appointmentDate DESC
       LIMIT 30`,
      params
    );

    return res.json({
      success: true,
      summary: revSummary[0] || {},
      paymentMethods: methodBreakdown,
      doctorRevenue: doctorBreakdown,
      dailyTrend
    });
  } catch (error) {
    console.error('Error in getFinancialReports:', error);
    return res.status(500).json({ success: false, message: 'Server error generating financial report', error: error.message });
  }
};

/**
 * 3. getAuditLogs
 * Requirements 2.4.9.1 & 2.4.9.2: Logs key user actions, and enables administrators to view activity logs.
 */
const getAuditLogs = async (req, res) => {
  try {
    const pool = await getPool();
    const { action, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        al.logID,
        al.userID,
        u.name AS actorName,
        u.email AS actorEmail,
        u.userType AS actorRole,
        al.action,
        al.ipAddress,
        al.userAgent,
        al.createdAt
      FROM audit_logs al
      LEFT JOIN users u ON al.userID = u.userID
      WHERE 1=1
    `;
    const params = [];

    if (action && action !== 'all') {
      query += ' AND al.action LIKE ?';
      params.push(`%${action}%`);
    }

    query += ' ORDER BY al.createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [logs] = await pool.query(query, params);

    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM audit_logs');

    return res.json({
      success: true,
      total: countResult[0].total,
      logs
    });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving audit logs', error: error.message });
  }
};

module.exports = {
  getAppointmentReports,
  getFinancialReports,
  getAuditLogs
};
