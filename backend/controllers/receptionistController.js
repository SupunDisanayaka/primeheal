const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. checkInPatient
 * Updates appointment status to 'Checked In' and generates/returns daily queue token.
 */
const checkInPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentID = Number(id);

    if (!appointmentID || isNaN(appointmentID)) {
      return res.status(400).json({ success: false, message: 'Valid appointment ID is required' });
    }

    const [apptRows] = await pool.query(
      'SELECT appointmentID, patientID, doctorID, status, appointmentDate FROM appointments WHERE appointmentID = ?',
      [appointmentID]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment record not found' });
    }

    const appt = apptRows[0];

    // Update appointment status to 'Checked In'
    await pool.query("UPDATE appointments SET status = 'Checked In' WHERE appointmentID = ?", [appointmentID]);

    // Check if token already exists for this appointment
    const [existingToken] = await pool.query(
      'SELECT tokenID, tokenNumber, status FROM queue_tokens WHERE appointmentID = ?',
      [appointmentID]
    );

    let tokenNumber;
    if (existingToken.length > 0) {
      tokenNumber = existingToken[0].tokenNumber;
    } else {
      // Calculate next queue token for today
      const today = new Date().toISOString().split('T')[0];
      const [maxToken] = await pool.query(
        'SELECT COALESCE(MAX(tokenNumber), 0) + 1 AS nextToken FROM queue_tokens WHERE queueDate = ?',
        [today]
      );
      tokenNumber = maxToken[0].nextToken;

      await pool.query(
        'INSERT INTO queue_tokens (appointmentID, patientID, tokenNumber, queueDate, status) VALUES (?, ?, ?, ?, ?)',
        [appointmentID, appt.patientID, tokenNumber, today, 'Waiting']
      );
    }

    return res.status(200).json({
      success: true,
      message: `Patient checked in successfully. Queue Token #${tokenNumber}`,
      appointmentID,
      tokenNumber,
      status: 'Checked In'
    });
  } catch (error) {
    console.error('Error checking in patient:', error);
    return res.status(500).json({ success: false, message: 'Server error checking in patient', error: error.message });
  }
};

/**
 * 2. createWalkInAppointment
 * Creates or finds patient user/profile and books an instant walk-in appointment.
 */
const createWalkInAppointment = async (req, res) => {
  try {
    const { patientName, patientEmail, patientPhone, patientGender, patientDob, docId, slotDate, slotTime, amount } = req.body;

    if (!patientName || !selectedDocId(docId) || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: 'Patient name, doctor, date, and time are required.' });
    }

    const doctorID = Number(docId);

    // 1. Find or create doctor in doctor table
    const [docRows] = await pool.query('SELECT d.doctorID, u.name AS doctorName, d.consultationFee FROM doctor d JOIN users u ON d.userID = u.userID WHERE d.doctorID = ? OR d.userID = ?', [doctorID, doctorID]);

    let resolvedDoctorID = doctorID;
    let resolvedDoctorName = 'Doctor';
    let resolvedFee = amount || 2500;

    if (docRows.length > 0) {
      resolvedDoctorID = docRows[0].doctorID;
      resolvedDoctorName = docRows[0].doctorName || 'Doctor';
      resolvedFee = amount || docRows[0].consultationFee || 2500;
    }

    // 2. Find or create patient user
    const emailToUse = patientEmail && patientEmail.trim() ? patientEmail.trim().toLowerCase() : `walkin_${Date.now()}@primeheal.com`;
    let userID;
    let patientID;

    const [userRows] = await pool.query('SELECT userID FROM users WHERE email = ?', [emailToUse]);
    if (userRows.length > 0) {
      userID = userRows[0].userID;
    } else {
      const defaultPassword = await bcrypt.hash('walkin123', 10);
      const [newUser] = await pool.query(
        `INSERT INTO users (name, email, password, phone, userType, isActive) VALUES (?, ?, ?, ?, 'patient', 1)`,
        [patientName, emailToUse, defaultPassword, patientPhone || null]
      );
      userID = newUser.insertId;
    }

    const [patientRows] = await pool.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
    if (patientRows.length > 0) {
      patientID = patientRows[0].patientID;
    } else {
      const [newPatient] = await pool.query(
        'INSERT INTO patient (userID, patientCode, dateOfBirth, gender) VALUES (?, ?, ?, ?)',
        [userID, `PT-WALKIN-${userID}`, patientDob || null, patientGender || 'Male']
      );
      patientID = newPatient.insertId;
    }

    // 3. Insert walk-in appointment
    const [result] = await pool.query(
      `INSERT INTO appointments
        (patientID, doctorID, doctorName, appointmentDate, appointmentTime, status, fee, totalCharge, patientName, patientPhone, patientEmail)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?)`,
      [patientID, resolvedDoctorID, resolvedDoctorName, slotDate, slotTime, resolvedFee, resolvedFee, patientName, patientPhone || null, emailToUse]
    );

    return res.status(201).json({
      success: true,
      message: 'Walk-in appointment created successfully',
      appointmentID: result.insertId,
      appointment: {
        appointmentId: result.insertId,
        patientName,
        patientEmail: emailToUse,
        patientPhone,
        docId: resolvedDoctorID,
        docName: resolvedDoctorName,
        slotDate,
        slotTime,
        amount: resolvedFee,
        status: 'Pending'
      }
    });
  } catch (error) {
    console.error('Error creating walk-in appointment:', error);
    return res.status(500).json({ success: false, message: 'Server error creating walk-in appointment', error: error.message });
  }
};

function selectedDocId(id) {
  return id !== undefined && id !== null && id !== '';
}

/**
 * 3. getReceptionistStats
 * Returns summary counts for receptionist dashboard.
 */
const getReceptionistStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalApts] = await pool.query('SELECT COUNT(*) AS total FROM appointments');
    const [pendingApts] = await pool.query("SELECT COUNT(*) AS pending FROM appointments WHERE status = 'Pending'");
    const [checkedInApts] = await pool.query("SELECT COUNT(*) AS checkedIn FROM appointments WHERE status = 'Checked In'");
    const [availableDocs] = await pool.query('SELECT COUNT(*) AS docs FROM doctor WHERE isAvailable = 1');

    return res.status(200).json({
      success: true,
      stats: {
        totalApts: totalApts[0].total,
        pendingApts: pendingApts[0].pending,
        checkedInApts: checkedInApts[0].checkedIn,
        availableDocs: availableDocs[0].docs
      }
    });
  } catch (error) {
    console.error('Error fetching receptionist stats:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching stats', error: error.message });
  }
};

module.exports = {
  checkInPatient,
  createWalkInAppointment,
  getReceptionistStats
};
