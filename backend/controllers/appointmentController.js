const pool = require('../config/db');
const { sendAppointmentConfirmation } = require('../utils/emailService');

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const normalizeMoney = (value, currency = 'USD') => {
  if (String(currency).toUpperCase() === 'LKR') {
    return Number(value ?? 0);
  }

  return toLkr(value);
};

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

const createAppointment = async (req, res) => {
  const { doctorUserID, doctorName, appointmentDate, appointmentTime, fee, totalCharge, patientName, patientPhone, patientEmail, patientNic, patientAddress, noShowRefund, docAddress, currency } = req.body;
  const { userID, userType, name: loggedName, email: loggedEmail } = req.user;

  if (userType !== 'patient') {
    return res.status(403).json({ success: false, message: 'Only patients can create appointments' });
  }

  if (!doctorUserID || !appointmentDate || !appointmentTime || !patientName || !patientEmail) {
    return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [patientRows] = await connection.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
    if (patientRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const [doctorRows] = await connection.query('SELECT doctorID FROM doctor WHERE userID = ?', [doctorUserID]);
    if (doctorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor record not found' });
    }

    const patientID = patientRows[0].patientID;
    const doctorID = doctorRows[0].doctorID;

    const [result] = await connection.query(
      `INSERT INTO appointments
        (patientID, doctorID, doctorName, appointmentDate, appointmentTime, status, fee, totalCharge,
         patientName, patientPhone, patientEmail, patientNic, patientAddress, patientNo, docAddress, noShowRefund)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientID,
        doctorID,
        doctorName,
        appointmentDate,
        appointmentTime,
        'Pending',
        normalizeMoney(fee || 0.0, currency),
        normalizeMoney(totalCharge || fee || 0.0, currency),
        patientName,
        patientPhone || null,
        patientEmail,
        patientNic || null,
        patientAddress || null,
        req.body.patientNo || null,
        docAddress || null,
        noShowRefund ? 1 : 0
      ]
    );

    await connection.commit();

    try {
      await sendAppointmentConfirmation(
        {
          name: patientName || loggedName,
          email: patientEmail || loggedEmail
        },
        {
          doctorName,
          appointmentDate,
          appointmentTime,
          fee: normalizeMoney(fee || 0.0, currency),
          totalCharge: normalizeMoney(totalCharge || fee || 0.0, currency),
          status: 'Confirmed',
          docAddress
        }
      );
      console.log('Appointment confirmation email queued for delivery.');
    } catch (emailError) {
      console.error('Appointment email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointmentId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const getMyAppointments = async (req, res) => {
  const { userID, userType } = req.user;

  try {
    if (userType === 'patient') {
      const [patientRows] = await pool.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (patientRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Patient record not found' });
      }
      const patientID = patientRows[0].patientID;
      const [appointments] = await pool.query(
        `SELECT
          a.appointmentID AS appointmentId,
          a.patientID,
          a.doctorID,
          d.userID AS doctorUserId,
          u.name AS doctorName,
          a.appointmentDate,
          a.appointmentTime,
          a.status,
          a.fee,
          a.totalCharge,
          a.patientName,
          a.patientPhone,
          a.patientEmail,
          a.patientNic,
          a.patientAddress,
          a.patientNo,
          a.docAddress,
          a.noShowRefund,
          ${getLatestPaymentFields()},
          a.createdAt,
          a.updatedAt
        FROM appointments a
        LEFT JOIN doctor d ON a.doctorID = d.doctorID
        LEFT JOIN users u ON d.userID = u.userID
        WHERE a.patientID = ?
        ORDER BY a.createdAt DESC`,
        [patientID]
      );
      return res.json({ success: true, appointments });
    }

    if (userType === 'doctor') {
      const [doctorRows] = await pool.query('SELECT doctorID FROM doctor WHERE userID = ?', [userID]);
      if (doctorRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Doctor record not found' });
      }
      const doctorID = doctorRows[0].doctorID;
      const [appointments] = await pool.query(
        `SELECT
          a.appointmentID AS appointmentId,
          a.patientID,
          a.doctorID,
          d.userID AS doctorUserId,
          u.name AS doctorName,
          a.appointmentDate,
          a.appointmentTime,
          a.status,
          a.fee,
          a.totalCharge,
          a.patientName,
          a.patientPhone,
          a.patientEmail,
          a.patientNic,
          a.patientAddress,
          a.patientNo,
          a.docAddress,
          a.noShowRefund,
          ${getLatestPaymentFields()},
          a.createdAt,
          a.updatedAt
        FROM appointments a
        LEFT JOIN doctor d ON a.doctorID = d.doctorID
        LEFT JOIN users u ON d.userID = u.userID
        WHERE a.doctorID = ?
        ORDER BY a.createdAt DESC`,
        [doctorID]
      );
      return res.json({ success: true, appointments });
    }

    return res.status(403).json({ success: false, message: 'Appointments are available only for patients and doctors' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  const { userID, userType } = req.user;
  const { appointmentId } = req.params;

  if (!appointmentId) {
    return res.status(400).json({ success: false, message: 'Appointment ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let ownerColumn = null;
    let ownerId = null;

    if (userType === 'patient') {
      const [patientRows] = await connection.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (patientRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Patient record not found' });
      }

      ownerColumn = 'patientID';
      ownerId = patientRows[0].patientID;
    } else if (userType === 'doctor') {
      const [doctorRows] = await connection.query('SELECT doctorID FROM doctor WHERE userID = ?', [userID]);
      if (doctorRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Doctor record not found' });
      }

      ownerColumn = 'doctorID';
      ownerId = doctorRows[0].doctorID;
    } else {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Only patients and doctors can cancel appointments' });
    }

    const [appointmentRows] = await connection.query(
      `SELECT appointmentID, ${ownerColumn}, status
       FROM appointments
       WHERE appointmentID = ?
       FOR UPDATE`,
      [appointmentId]
    );

    if (appointmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appointment = appointmentRows[0];

    if (Number(appointment[ownerColumn]) !== Number(ownerId)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not allowed to cancel this appointment' });
    }

    if (appointment.status === 'Paid' || appointment.status === 'Completed' || appointment.status === 'Confirmed') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Paid or Confirmed appointments cannot be cancelled' });
    }

    if (appointment.status !== 'Pending') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: `Appointments with status '${appointment.status}' cannot be cancelled` });
    }

    const [updateResult] = await connection.query(
      "UPDATE appointments SET status = 'Cancelled' WHERE appointmentID = ? AND status <> 'Cancelled'",
      [appointmentId]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Appointment could not be cancelled' });
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointmentId: Number(appointmentId)
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const updateAppointmentStatus = async (req, res) => {
  const { userID, userType } = req.user;
  const { appointmentId } = req.params;
  const { status } = req.body;

  if (!appointmentId || !status) {
    return res.status(400).json({ success: false, message: 'Appointment ID and status are required' });
  }

  const allowedStatuses = ['Pending', 'Paid', 'Confirmed', 'Completed', 'Cancelled', 'Expired', 'No Show'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid target appointment status' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [appointmentRows] = await connection.query(
      'SELECT a.*, p.paymentStatus FROM appointments a LEFT JOIN payments p ON p.appointmentID = a.appointmentID WHERE a.appointmentID = ? FOR UPDATE',
      [appointmentId]
    );

    if (appointmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appointment = appointmentRows[0];
    const currentStatus = appointment.status;

    if (userType === 'patient') {
      const [patientRows] = await connection.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (patientRows.length === 0 || patientRows[0].patientID !== appointment.patientID) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      if (status !== 'Cancelled') {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Patients can only cancel appointments' });
      }

      if (appointment.paymentStatus === 'Completed' || currentStatus === 'Paid') {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Paid appointments cannot be cancelled' });
      }

      if (currentStatus !== 'Pending') {
        await connection.rollback();
        return res.status(409).json({ success: false, message: `Cannot cancel appointment in state '${currentStatus}'` });
      }
    } else if (userType === 'doctor') {
      const [doctorRows] = await connection.query('SELECT doctorID FROM doctor WHERE userID = ?', [userID]);
      if (doctorRows.length === 0 || doctorRows[0].doctorID !== appointment.doctorID) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      if (status === 'Completed') {
        if (currentStatus !== 'Confirmed' && currentStatus !== 'Paid') {
          await connection.rollback();
          return res.status(409).json({ success: false, message: 'Only paid or confirmed appointments can be completed' });
        }
      } else {
        await connection.rollback();
        return res.status(409).json({ success: false, message: `Doctors cannot change status to '${status}'` });
      }
    } else if (!['admin', 'receptionist', 'accountant'].includes(userType)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (currentStatus === 'Paid' && status === 'Pending') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Cannot transition Paid appointment back to Pending' });
    }
    if (currentStatus === 'Completed' && status === 'Cancelled') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Completed appointments cannot be cancelled' });
    }
    if (currentStatus === 'Cancelled' && status === 'Paid') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Cancelled appointments cannot be marked as Paid' });
    }
    if (currentStatus === 'Completed' && status === 'Paid') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Completed appointments cannot be paid again' });
    }

    await connection.query('UPDATE appointments SET status = ? WHERE appointmentID = ?', [status, appointmentId]);

    await connection.commit();
    console.log(`[APPOINTMENT STATUS CHANGE] Success: ${appointmentId} updated from ${currentStatus} to ${status} by ${userType} (${userID})`);
    return res.json({ success: true, message: `Appointment status updated to ${status} successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('[APPOINTMENT STATUS CHANGE ERROR]', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  updateAppointmentStatus
};
