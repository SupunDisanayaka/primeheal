const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. getAllPatients
 * Returns paginated & searchable list of all registered patients.
 * Accessible to administrators and receptionists.
 */
const getAllPatients = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM patient p
      INNER JOIN users u ON p.userID = u.userID
      WHERE u.userType = 'patient'
    `;
    const queryParams = [];

    if (search.trim()) {
      baseQuery += ` AND (
        u.name LIKE ? OR
        u.email LIKE ? OR
        u.phone LIKE ? OR
        p.nic LIKE ? OR
        p.patientCode LIKE ?
      )`;
      const wild = `%${search.trim()}%`;
      queryParams.push(wild, wild, wild, wild, wild);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
    const totalPatients = countRows[0]?.total || 0;

    const selectQuery = `
      SELECT
        p.patientID,
        p.patientCode,
        p.nic,
        p.dateOfBirth,
        p.gender,
        p.address,
        p.emergencyContact,
        p.allergies,
        p.country,
        u.userID,
        u.name,
        u.email,
        u.phone,
        u.profileImage,
        u.isActive,
        u.createdAt,
        (SELECT COUNT(*) FROM appointments a WHERE a.patientID = p.patientID) AS totalAppointments,
        (SELECT MAX(a.appointmentDate) FROM appointments a WHERE a.patientID = p.patientID) AS lastAppointmentDate
      ${baseQuery}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...queryParams, limit, offset]);

    return res.json({
      success: true,
      total: totalPatients,
      page,
      limit,
      totalPages: Math.ceil(totalPatients / limit) || 1,
      patients: rows
    });
  } catch (error) {
    console.error('getAllPatients error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving patients', error: error.message });
  }
};

/**
 * 2. getPatientById
 * Fetches comprehensive patient profile with past appointments and medical history.
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientID = Number(id);

    if (!patientID || isNaN(patientID)) {
      return res.status(400).json({ success: false, message: 'Valid patient ID is required' });
    }

    const [patientRows] = await pool.query(
      `SELECT
        p.patientID,
        p.patientCode,
        p.nic,
        p.dateOfBirth,
        p.gender,
        p.address,
        p.emergencyContact,
        p.allergies,
        p.country,
        u.userID,
        u.name,
        u.email,
        u.phone,
        u.profileImage,
        u.isActive,
        u.createdAt
       FROM patient p
       INNER JOIN users u ON p.userID = u.userID
       WHERE p.patientID = ? OR p.userID = ?`,
      [patientID, patientID]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const patient = patientRows[0];

    // Fetch appointment history
    const [appointments] = await pool.query(
      `SELECT
        a.appointmentID,
        a.appointmentDate,
        a.appointmentTime,
        a.status,
        a.doctorName,
        a.fee,
        a.totalCharge,
        a.doctorNotes,
        d.specialization
       FROM appointments a
       LEFT JOIN doctor d ON a.doctorID = d.doctorID
       WHERE a.patientID = ?
       ORDER BY a.appointmentDate DESC, a.appointmentTime DESC`,
      [patient.patientID]
    );

    // Fetch invoices
    const [invoices] = await pool.query(
      `SELECT
        invoiceID,
        invoiceNumber,
        subtotal,
        tax,
        discount,
        totalAmount,
        issueDate,
        dueDate,
        status
       FROM invoice
       WHERE patientID = ?
       ORDER BY issueDate DESC`,
      [patient.patientID]
    );

    return res.json({
      success: true,
      patient: {
        ...patient,
        appointments,
        invoices
      }
    });
  } catch (error) {
    console.error('getPatientById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving patient details', error: error.message });
  }
};

/**
 * 3. updatePatientByStaff
 * Allows administrators and receptionists to update patient demographics and records.
 */
const updatePatientByStaff = async (req, res) => {
  const { id } = req.params;
  const patientID = Number(id);

  if (!patientID || isNaN(patientID)) {
    return res.status(400).json({ success: false, message: 'Valid patient ID is required' });
  }

  const { name, phone, dateOfBirth, gender, address, emergencyContact, allergies, nic, country, isActive } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [patientRows] = await connection.query(
      'SELECT patientID, userID FROM patient WHERE patientID = ?',
      [patientID]
    );

    if (patientRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const { userID } = patientRows[0];

    // Update users table
    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (phone !== undefined) userUpdates.phone = phone;
    if (isActive !== undefined) userUpdates.isActive = isActive ? 1 : 0;

    if (Object.keys(userUpdates).length > 0) {
      const setStr = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
      await connection.query(`UPDATE users SET ${setStr} WHERE userID = ?`, [...Object.values(userUpdates), userID]);
    }

    // Update patient table
    const pUpdates = {};
    if (dateOfBirth !== undefined) pUpdates.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) pUpdates.gender = gender;
    if (address !== undefined) pUpdates.address = address;
    if (emergencyContact !== undefined) pUpdates.emergencyContact = emergencyContact;
    if (allergies !== undefined) pUpdates.allergies = allergies;
    if (nic !== undefined) pUpdates.nic = nic;
    if (country !== undefined) pUpdates.country = country;

    if (Object.keys(pUpdates).length > 0) {
      const setStr = Object.keys(pUpdates).map(k => `${k} = ?`).join(', ');
      await connection.query(`UPDATE patient SET ${setStr} WHERE patientID = ?`, [...Object.values(pUpdates), patientID]);
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Patient records updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('updatePatientByStaff error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating patient', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * 4. registerPatientIntake
 * Direct receptionist/admin patient intake registration without requiring an immediate appointment booking.
 */
const registerPatientIntake = async (req, res) => {
  const { name, email, phone, nic, dateOfBirth, gender, address, emergencyContact, allergies, country } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Patient name and email are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check email uniqueness
    const [existing] = await connection.query('SELECT userID FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email is already registered in the system' });
    }

    // Check NIC uniqueness if provided
    if (nic) {
      const [existingNic] = await connection.query('SELECT patientID FROM patient WHERE nic = ?', [nic]);
      if (existingNic.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'NIC is already registered to an existing patient' });
      }
    }

    // Default secure password for staff-registered patient
    const defaultPassword = await bcrypt.hash('PrimeHeal@' + Math.floor(1000 + Math.random() * 9000), 10);

    const [userRes] = await connection.query(
      `INSERT INTO users (name, email, password, phone, userType, isActive) VALUES (?, ?, ?, ?, 'patient', 1)`,
      [name, email.trim().toLowerCase(), defaultPassword, phone || null]
    );

    const userId = userRes.insertId;
    const patientCode = `PT-${String(userId).padStart(5, '0')}`;

    const [patientRes] = await connection.query(
      `INSERT INTO patient (userID, patientCode, nic, dateOfBirth, gender, address, emergencyContact, allergies, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        patientCode,
        nic || null,
        dateOfBirth || null,
        gender || 'Male',
        address || null,
        emergencyContact || null,
        allergies || null,
        country || 'Sri Lanka'
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patientID: patientRes.insertId,
      patientCode,
      userID: userId
    });
  } catch (error) {
    await connection.rollback();
    console.error('registerPatientIntake error:', error);
    return res.status(500).json({ success: false, message: 'Server error registering patient', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatientByStaff,
  registerPatientIntake
};
