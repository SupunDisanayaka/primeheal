const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendPaymentConfirmation } = require('../services/emailService');

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

const formatDateToISO = (dateStr) => {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Fallback JS Date parsing (e.g. '15, September, 2026')
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 2. createWalkInAppointment
 * Creates or finds patient user/profile and books an instant walk-in appointment,
 * saving appointment, payment (Cash/Card boolean logic), and invoice records in DB.
 */
const createWalkInAppointment = async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      patientGender,
      patientDob,
      docId,
      slotDate,
      slotTime,
      amount,
      isCard,
      isCash,
      paymentMethod,
      patientNic,
      patientAddress,
      patientNo
    } = req.body;

    if (!patientName || !selectedDocId(docId) || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: 'Patient name, doctor, date, and time are required.' });
    }

    const normalizedDate = formatDateToISO(slotDate);
    if (!normalizedDate) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date format. Please use calendar picker or DD/MM/YYYY.' });
    }

    // Boolean logic for payment method: Cash vs Card
    const cardSelected =
      isCard === true ||
      isCard === 'true' ||
      String(paymentMethod).toLowerCase() === 'card' ||
      (isCash === false || isCash === 'false');
    const resolvedPaymentMethod = cardSelected ? 'Card' : 'Cash';
    const resolvedIsCard = cardSelected;
    const resolvedIsCash = !cardSelected;

    const doctorID = Number(docId);

    // 1. Find doctor in doctor table
    const [docRows] = await pool.query(
      `SELECT d.doctorID, d.userID, u.name AS doctorName, d.consultationFee, d.addressLine1, d.addressLine2
       FROM doctor d
       JOIN users u ON d.userID = u.userID
       WHERE d.doctorID = ? OR d.userID = ?`,
      [doctorID, doctorID]
    );

    let resolvedDoctorID = doctorID;
    let resolvedDoctorName = 'Doctor';
    let resolvedFee = amount ? Number(amount) : 2500;
    let resolvedDocAddress = null;

    if (docRows.length > 0) {
      resolvedDoctorID = docRows[0].doctorID;
      resolvedDoctorName = docRows[0].doctorName || 'Doctor';
      resolvedFee = amount ? Number(amount) : (docRows[0].consultationFee || 2500);
      resolvedDocAddress = {
        line1: docRows[0].addressLine1 || '',
        line2: docRows[0].addressLine2 || ''
      };
    }

    // 2. Find or create patient in users & patient table
    const emailToUse = patientEmail && patientEmail.trim()
      ? patientEmail.trim().toLowerCase()
      : `walkin_${Date.now()}@primeheal.com`;

    let userID;
    let patientID;

    const [userRows] = await pool.query('SELECT userID FROM users WHERE email = ?', [emailToUse]);
    if (userRows.length > 0) {
      userID = userRows[0].userID;
      if (patientPhone) {
        await pool.query('UPDATE users SET phone = COALESCE(phone, ?) WHERE userID = ?', [patientPhone, userID]);
      }
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
      const patientCode = `PT-${String(userID).padStart(5, '0')}`;
      const [newPatient] = await pool.query(
        'INSERT INTO patient (userID, patientCode, dateOfBirth, gender, nic, address) VALUES (?, ?, ?, ?, ?, ?)',
        [userID, patientCode, patientDob || null, patientGender || 'Male', patientNic || null, patientAddress || null]
      );
      patientID = newPatient.insertId;
    }

    // 3. Insert walk-in appointment matching patient portal schema
    const assignedPatientNo = patientNo || `PT-${Math.floor(10000 + Math.random() * 90000)}`;

    const [result] = await pool.query(
      `INSERT INTO appointments
        (patientID, doctorID, doctorName, appointmentDate, appointmentTime, status, fee, totalCharge,
         patientName, patientPhone, patientEmail, patientNic, patientAddress, patientNo, docAddress, noShowRefund)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        patientID,
        resolvedDoctorID,
        resolvedDoctorName,
        normalizedDate,
        slotTime,
        resolvedFee,
        resolvedFee,
        patientName,
        patientPhone || null,
        emailToUse,
        patientNic || null,
        patientAddress || null,
        assignedPatientNo,
        resolvedDocAddress ? JSON.stringify(resolvedDocAddress) : null
      ]
    );

    const appointmentID = result.insertId;

    // 4. Record front-desk payment in payments table
    const merchantOrderId = `WALKIN-${Date.now()}-${appointmentID}`;
    const transactionId = `TXN-${resolvedPaymentMethod.toUpperCase()}-${Date.now()}`;
    await pool.query(
      `INSERT INTO payments
        (appointmentID, patientID, doctorID, merchantOrderId, transactionId, paymentGateway, amount, currency, paymentStatus, paymentMethod, verifiedAt)
       VALUES (?, ?, ?, ?, ?, 'Counter', ?, 'LKR', 'Completed', ?, CURRENT_TIMESTAMP)`,
      [appointmentID, patientID, resolvedDoctorID, merchantOrderId, transactionId, resolvedFee, resolvedPaymentMethod]
    );

    // 5. Generate paid invoice for the walk-in appointment
    const invoiceNumber = `INV-REC-${Date.now()}`;
    await pool.query(
      `INSERT INTO invoice (appointmentID, patientID, invoiceNumber, subtotal, tax, discount, totalAmount, issueDate, dueDate, status)
       VALUES (?, ?, ?, ?, 0.00, 0.00, ?, CURDATE(), CURDATE(), 'paid')`,
      [appointmentID, patientID, invoiceNumber, resolvedFee, resolvedFee]
    ).catch(err => console.log('Invoice generation note:', err.message));

    // Send Payment Confirmation Email
    await sendPaymentConfirmation(
      { name: patientName, email: emailToUse },
      { amount: resolvedFee, currency: 'LKR', method: resolvedPaymentMethod, date: normalizedDate, time: slotTime }
    ).catch(err => console.error('Failed to send payment confirmation email:', err));

    // 6. Record confirmation notification
    await pool.query(
      `INSERT INTO notification (userID, appointmentID, message, notificationType, status, recipientEmail)
       VALUES (?, ?, ?, 'email', 'sent', ?)`,
      [userID, appointmentID, `Walk-in appointment confirmed for Dr. ${resolvedDoctorName} on ${normalizedDate} at ${slotTime}. Payment received via ${resolvedPaymentMethod}.`, emailToUse]
    ).catch(err => console.log('Notification note:', err.message));

    return res.status(201).json({
      success: true,
      message: `Walk-in appointment booked successfully. Payment collected via ${resolvedPaymentMethod}.`,
      appointmentID,
      appointment: {
        _id: appointmentID,
        appointmentId: appointmentID,
        patientID,
        patientName,
        patientEmail: emailToUse,
        patientPhone,
        docId: resolvedDoctorID,
        doctorName: resolvedDoctorName,
        slotDate: normalizedDate,
        slotTime,
        amount: resolvedFee,
        status: 'Pending',
        paymentMethod: resolvedPaymentMethod,
        isCard: resolvedIsCard,
        isCash: resolvedIsCash,
        patientNo: assignedPatientNo
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

/**
 * 4. collectCounterPayment
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
      'SELECT a.appointmentID, a.patientID, a.doctorID, a.status, a.fee, a.totalCharge, a.patientName, a.patientEmail, u.name, u.email FROM appointments a LEFT JOIN patient p ON a.patientID = p.patientID LEFT JOIN users u ON p.userID = u.userID WHERE a.appointmentID = ?',
      [aptID]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment record not found.' });
    }

    const appt = apptRows[0];
    const finalAmount = amount ? Number(amount) : Number(appt.totalCharge || appt.fee || 0);
    const methodToUse = paymentMethod || 'Cash';
    const patientName = appt.patientName || appt.name || 'Patient';
    const patientEmail = appt.patientEmail || appt.email;

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

    // Send Payment Confirmation Email
    if (patientEmail) {
      await sendPaymentConfirmation(
        { name: patientName, email: patientEmail },
        { amount: finalAmount, currency: 'LKR', method: methodToUse }
      ).catch(err => console.error('Failed to send payment confirmation email:', err));
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

module.exports = {
  checkInPatient,
  createWalkInAppointment,
  getReceptionistStats,
  collectCounterPayment
};
