const pool = require('../config/db');

const mapAppointmentRow = (row) => ({
  _id: row.appointmentId,
  appointmentId: row.appointmentId,
  patientId: row.patientId,
  doctorId: row.doctorUserId,
  doctorUserId: row.doctorUserId,
  doctorTableId: row.doctorTableId,
  patientName: row.patientName,
  patientEmail: row.patientEmail,
  patientPhone: row.patientPhone,
  patientGender: row.patientGender,
  patientDob: row.patientDob,
  docId: row.doctorUserId,
  doctorName: row.doctorName,
  speciality: row.speciality,
  slotDate: row.slotDate,
  slotTime: row.slotTime,
  amount: Number(row.amount ?? 0),
  status: row.status === 'Paid' ? 'Completed' : row.status,
  backendStatus: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  patientAddress: row.patientAddress,
  patientNic: row.patientNic,
  docAddress: row.docAddress,
  noShowRefund: row.noShowRefund,
  paymentID: row.paymentID,
  merchantOrderId: row.merchantOrderId,
  transactionId: row.transactionId,
  paymentStatus: row.paymentStatus,
  paymentAmount: row.paymentAmount,
  paymentCurrency: row.paymentCurrency,
  paymentMethod: row.paymentMethod,
  receiptUrl: row.receiptUrl,
  paymentDate: row.paymentDate
});

const getLatestPaymentFields = () => `
  (SELECT p.paymentID
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentID,
  (SELECT p.merchantOrderId
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS merchantOrderId,
  (SELECT p.transactionId
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS transactionId,
  (SELECT p.paymentStatus
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentStatus,
  (SELECT p.amount
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentAmount,
  (SELECT p.currency
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentCurrency,
  (SELECT p.paymentMethod
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentMethod,
  (SELECT p.receiptUrl
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS receiptUrl,
  (SELECT p.verifiedAt
   FROM payments p
   WHERE p.appointmentID = a.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentDate
`;

const appointmentBaseQuery = `
  SELECT
    a.appointmentID AS appointmentId,
    a.patientID AS patientId,
    a.doctorID AS doctorTableId,
    a.doctorName,
    COALESCE(
      DATE_FORMAT(a.appointmentDate, '%d, %M, %Y'),
      DATE_FORMAT(a.createdAt, '%d, %M, %Y')
    ) AS slotDate,
    a.appointmentTime AS slotTime,
    a.status,
    a.totalCharge AS amount,
    a.patientName,
    a.patientPhone,
    a.patientEmail,
    a.patientNic,
    a.patientAddress,
    a.docAddress,
    a.noShowRefund,
    ${getLatestPaymentFields()},
    a.createdAt,
    a.updatedAt,
    p.dateOfBirth AS patientDob,
    p.gender AS patientGender,
    d.userID AS doctorUserId,
    d.specialization AS speciality
  FROM appointments a
  LEFT JOIN patient p ON a.patientID = p.patientID
  LEFT JOIN doctor d ON a.doctorID = d.doctorID
`;

const getAdminAppointments = async (req, res) => {
  try {
    const query = `${appointmentBaseQuery} ORDER BY a.createdAt DESC`;
    console.log('[ADMIN APPOINTMENTS SQL]', query);
    const [rows] = await pool.query(query);
    console.log('[ADMIN APPOINTMENTS COUNT]', rows.length);

    return res.json({
      success: true,
      appointments: rows.map(mapAppointmentRow)
    });
  } catch (error) {
    console.error('Admin appointments API error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAdminRecentAppointments = async (req, res) => {
  try {
    const query = `${appointmentBaseQuery} ORDER BY a.createdAt DESC LIMIT 5`;
    console.log('[ADMIN RECENT APPOINTMENTS SQL]', query);
    const [rows] = await pool.query(query);

    return res.json({
      success: true,
      appointments: rows.map(mapAppointmentRow)
    });
  } catch (error) {
    console.error('Admin recent appointments API error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM appointments) AS totalAppointments,
        (SELECT SUM(CASE WHEN DATE(appointmentDate) = CURDATE() THEN 1 ELSE 0 END) FROM appointments) AS todayAppointments,
        (SELECT SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) FROM appointments) AS pendingAppointments,
        (SELECT SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) FROM appointments) AS confirmedAppointments,
        (SELECT SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) FROM appointments) AS cancelledAppointments,
        (SELECT SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) FROM appointments) AS completedAppointments,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Completed' THEN p.amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Completed' AND DATE(COALESCE(p.verifiedAt, p.updatedAt, p.createdAt)) = CURDATE() THEN p.amount ELSE 0 END), 0) AS todayRevenue,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Completed' AND YEAR(COALESCE(p.verifiedAt, p.updatedAt, p.createdAt)) = YEAR(CURDATE()) AND MONTH(COALESCE(p.verifiedAt, p.updatedAt, p.createdAt)) = MONTH(CURDATE()) THEN p.amount ELSE 0 END), 0) AS monthlyRevenue,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Completed' THEN 1 ELSE 0 END), 0) AS successfulPayments,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Pending' THEN 1 ELSE 0 END), 0) AS pendingPayments,
        COALESCE(SUM(CASE WHEN p.paymentStatus = 'Failed' THEN 1 ELSE 0 END), 0) AS failedPayments,
        COALESCE(COUNT(*), 0) AS totalPayments,
        (SELECT COUNT(*) FROM doctor) AS totalDoctors,
        (SELECT COUNT(*) FROM patient) AS totalPatients
      FROM payments p
    `;

    console.log('[ADMIN DASHBOARD SQL]', statsQuery);
    const [rows] = await pool.query(statsQuery);
    const stats = rows[0] || {};

    const [recentTransactions] = await pool.query(
      `SELECT
        p.paymentID,
        p.appointmentID,
        p.patientID,
        p.doctorID,
        p.merchantOrderId,
        p.transactionId,
        p.paymentStatus,
        p.amount,
        p.currency,
        p.paymentMethod,
        p.receiptUrl,
        p.verifiedAt,
        p.createdAt,
        a.appointmentDate,
        a.appointmentTime,
        a.patientName,
        a.patientEmail,
        a.patientPhone,
        a.totalCharge,
        d.userID AS doctorUserID,
        u.name AS doctorName,
        u.email AS doctorEmail
       FROM payments p
       INNER JOIN appointments a ON a.appointmentID = p.appointmentID
       INNER JOIN doctor d ON d.doctorID = a.doctorID
       INNER JOIN users u ON u.userID = d.userID
       ORDER BY p.createdAt DESC
       LIMIT 5`
    );

    return res.json({
      success: true,
      stats: {
        totalAppointments: Number(stats.totalAppointments || 0),
        todayAppointments: Number(stats.todayAppointments || 0),
        pendingAppointments: Number(stats.pendingAppointments || 0),
        confirmedAppointments: Number(stats.confirmedAppointments || 0),
        cancelledAppointments: Number(stats.cancelledAppointments || 0),
        completedAppointments: Number(stats.completedAppointments || 0),
        revenue: Number(stats.revenue || 0),
        todayRevenue: Number(stats.todayRevenue || 0),
        monthlyRevenue: Number(stats.monthlyRevenue || 0),
        successfulPayments: Number(stats.successfulPayments || 0),
        pendingPayments: Number(stats.pendingPayments || 0),
        failedPayments: Number(stats.failedPayments || 0),
        totalPayments: Number(stats.totalPayments || 0),
        totalDoctors: Number(stats.totalDoctors || 0),
        totalPatients: Number(stats.totalPatients || 0)
      },
      recentTransactions: recentTransactions.map((row) => ({
        paymentID: row.paymentID,
        appointmentId: row.appointmentID,
        patientName: row.patientName,
        patientEmail: row.patientEmail,
        patientPhone: row.patientPhone,
        doctorName: row.doctorName,
        doctorEmail: row.doctorEmail,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        merchantOrderId: row.merchantOrderId,
        transactionId: row.transactionId,
        paymentStatus: row.paymentStatus,
        amount: Number(row.amount || 0),
        currency: row.currency,
        paymentMethod: row.paymentMethod,
        receiptUrl: row.receiptUrl,
        verifiedAt: row.verifiedAt,
        createdAt: row.createdAt
      }))
    });
  } catch (error) {
    console.error('Admin dashboard API error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAdminStats = getAdminDashboard;

const normalizeStatus = (status) => {
  if (!status) return null;

  if (status === 'Completed') return 'Paid';
  if (status === 'Checked In') return 'Confirmed';
  return status;
};

const updateAppointmentStatus = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  if (!appointmentId || !status) {
    return res.status(400).json({ success: false, message: 'Appointment ID and status are required' });
  }

  const dbStatus = normalizeStatus(status);
  const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Paid'];

  if (!allowedStatuses.includes(dbStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid appointment status' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT appointmentID, status FROM appointments WHERE appointmentID = ? FOR UPDATE',
      [appointmentId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log('[ADMIN UPDATE APPOINTMENT] previous status:', rows[0].status, 'next status:', dbStatus, 'appointmentId:', appointmentId);

    await connection.query(
      'UPDATE appointments SET status = ? WHERE appointmentID = ?',
      [dbStatus, appointmentId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointmentId: Number(appointmentId),
      status: dbStatus
    });
  } catch (error) {
    await connection.rollback();
    console.error('Admin appointment status update error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const getReceptionists = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.userID        AS _id,
        u.name,
        u.email,
        u.phone,
        u.profileImage  AS image,
        u.isActive      AS available,
        u.createdAt,
        r.receptionistID,
        r.department    AS deskBlock
      FROM users u
      INNER JOIN receptionist r ON r.userID = u.userID
      WHERE u.userType = 'receptionist'
      ORDER BY u.createdAt DESC
    `);

    const receptionists = rows.map((row) => ({
      _id: row._id,
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      image: row.image || null,
      shift: null,          // shift not stored in DB yet; kept for frontend compatibility
      deskBlock: row.deskBlock || 'Front Desk',
      available: Boolean(row.available),
      createdAt: row.createdAt
    }));

    return res.json({ success: true, receptionists });
  } catch (error) {
    console.error('Get receptionists error:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAccountants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.userID        AS _id,
        u.name,
        u.email,
        u.phone,
        u.profileImage  AS image,
        u.isActive      AS available,
        u.createdAt,
        a.accountantID,
        a.department,
        a.accountingLicense
      FROM users u
      INNER JOIN accountant a ON a.userID = u.userID
      WHERE u.userType = 'accountant'
      ORDER BY u.createdAt DESC
    `);

    const accountants = rows.map((row) => ({
      _id: row._id,
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      image: row.image || null,
      department: row.department || 'Billing & Insurance',
      shift: null,
      accountingLicense: row.accountingLicense || null,
      available: Boolean(row.available),
      createdAt: row.createdAt
    }));

    return res.json({ success: true, accountants });
  } catch (error) {
    console.error('Get accountants error:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAdminAppointments,
  getAdminRecentAppointments,
  getAdminDashboard,
  getAdminStats,
  updateAppointmentStatus,
  getReceptionists,
  getAccountants
};