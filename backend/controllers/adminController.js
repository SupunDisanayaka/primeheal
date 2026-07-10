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
  noShowRefund: row.noShowRefund
});

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
    const query = `
      SELECT
        COUNT(*) AS totalAppointments,
        SUM(CASE WHEN DATE(a.appointmentDate) = CURDATE() THEN 1 ELSE 0 END) AS todayAppointments,
        SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) AS pendingAppointments,
        SUM(CASE WHEN a.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmedAppointments,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledAppointments,
        SUM(CASE WHEN a.status = 'Paid' THEN 1 ELSE 0 END) AS completedAppointments,
        COALESCE(SUM(CASE WHEN a.status = 'Paid' THEN a.totalCharge ELSE 0 END), 0) AS revenue,
        (SELECT COUNT(*) FROM doctor) AS totalDoctors,
        (SELECT COUNT(*) FROM patient) AS totalPatients
      FROM appointments a
    `;

    console.log('[ADMIN DASHBOARD SQL]', query);
    const [rows] = await pool.query(query);
    const stats = rows[0] || {};

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
        totalDoctors: Number(stats.totalDoctors || 0),
        totalPatients: Number(stats.totalPatients || 0)
      }
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

module.exports = {
  getAdminAppointments,
  getAdminRecentAppointments,
  getAdminDashboard,
  getAdminStats,
  updateAppointmentStatus
};