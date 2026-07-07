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
        'SELECT * FROM appointments WHERE patientID = ? ORDER BY createdAt DESC',
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
        'SELECT * FROM appointments WHERE doctorID = ? ORDER BY createdAt DESC',
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

module.exports = {
  createAppointment,
  getMyAppointments
};
