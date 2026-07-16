const pool = require('../config/db');
const { sendAppointmentConfirmation } = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const qr = require('qr-image');

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

const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const suffixParts = String(timeStr).trim().match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?$/i);
    if (suffixParts && suffixParts[4]) {
      const ampm = suffixParts[4].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  }
  return null;
};

const formatDateToISO = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  if (dateStr.includes('-')) {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } else {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
};

const getDayOfWeek = (normalizedDateStr) => {
  const [year, month, day] = normalizedDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[date.getDay()];
};

const createAppointment = async (req, res) => {
  let { doctorUserID, doctorName, appointmentDate, appointmentTime, fee, totalCharge, patientName, patientPhone, patientEmail, patientNic, patientAddress, noShowRefund, docAddress, currency } = req.body;
  const { userID, userType, name: loggedName, email: loggedEmail } = req.user;

  if (userType !== 'patient') {
    return res.status(403).json({ success: false, message: 'Only patients can create appointments' });
  }

  if (!doctorUserID || !appointmentDate || !appointmentTime || !patientName || !patientEmail) {
    return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
  }

  const normalizedDate = formatDateToISO(appointmentDate);
  if (!normalizedDate) {
    return res.status(400).json({ success: false, message: 'Invalid appointment date format' });
  }
  appointmentDate = normalizedDate;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [patientRows] = await connection.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
    if (patientRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const [doctorRows] = await connection.query('SELECT doctorID FROM doctor WHERE userID = ?', [doctorUserID]);
    if (doctorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Doctor record not found' });
    }

    const patientID = patientRows[0].patientID;
    const doctorID = doctorRows[0].doctorID;

    // 1. Verify doctor schedule & availability
    const dayOfWeekName = getDayOfWeek(appointmentDate);

    const [availabilities] = await connection.query(
      `SELECT * FROM doctoravailability 
       WHERE doctorID = ? AND isActive = 1 AND (
         (specificDate = ?) OR 
         (dayOfWeek = ? AND specificDate IS NULL)
       )`,
      [doctorID, appointmentDate, dayOfWeekName]
    );

    if (availabilities.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date' });
    }

    const reqMin = timeToMinutes(appointmentTime);
    let isWithinSchedule = false;

    for (const avail of availabilities) {
      const startMin = timeToMinutes(avail.startTime);
      const endMin = timeToMinutes(avail.endTime);
      const slotDuration = avail.slotDuration || 30;

      if (startMin !== null && endMin !== null && reqMin !== null) {
        if (reqMin >= startMin && reqMin + slotDuration <= endMin) {
          isWithinSchedule = true;
          break;
        }
      }
    }

    if (!isWithinSchedule) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Doctor is not available at the selected time slot' });
    }

    // 2. Prevent double booking using row-level lock (FOR UPDATE)
    const [existingAppointments] = await connection.query(
      `SELECT appointmentID FROM appointments 
       WHERE doctorID = ? AND appointmentDate = ? AND appointmentTime = ? 
       AND status NOT IN ('Cancelled', 'Expired') FOR UPDATE`,
      [doctorID, appointmentDate, appointmentTime]
    );

    if (existingAppointments.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This slot is already booked. Please choose another time.' });
    }

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
          u.profileImage AS docImage,
          d.specialization AS docSpeciality,
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
          u.profileImage AS docImage,
          d.specialization AS docSpeciality,
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

const rescheduleAppointment = async (req, res) => {
  const { userID, userType } = req.user;
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;

  if (!appointmentId || !newDate || !newTime) {
    return res.status(400).json({ success: false, message: 'Appointment ID, new date, and new time are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [appointmentRows] = await connection.query(
      'SELECT * FROM appointments WHERE appointmentID = ? FOR UPDATE',
      [appointmentId]
    );

    if (appointmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appointment = appointmentRows[0];

    if (userType === 'patient') {
      const [patientRows] = await connection.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (patientRows.length === 0 || patientRows[0].patientID !== appointment.patientID) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else if (userType === 'doctor') {
      const [doctorRows] = await connection.query('SELECT doctorID FROM doctor WHERE userID = ?', [userID]);
      if (doctorRows.length === 0 || doctorRows[0].doctorID !== appointment.doctorID) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else if (!['admin', 'receptionist'].includes(userType)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed' || appointment.status === 'No Show' || appointment.status === 'Expired') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot reschedule appointment in status '${appointment.status}'` });
    }

    // 1. Verify doctor schedule & availability
    const normalizedNewDate = formatDateToISO(newDate);
    if (!normalizedNewDate) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid reschedule date format' });
    }
    newDate = normalizedNewDate;

    const dayOfWeekName = getDayOfWeek(newDate);

    const [availabilities] = await connection.query(
      `SELECT * FROM doctoravailability 
       WHERE doctorID = ? AND isActive = 1 AND (
         (specificDate = ?) OR 
         (dayOfWeek = ? AND specificDate IS NULL)
       )`,
      [appointment.doctorID, newDate, dayOfWeekName]
    );

    if (availabilities.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date' });
    }

    const reqMin = timeToMinutes(newTime);
    let isWithinSchedule = false;

    for (const avail of availabilities) {
      const startMin = timeToMinutes(avail.startTime);
      const endMin = timeToMinutes(avail.endTime);
      const slotDuration = avail.slotDuration || 30;

      if (startMin !== null && endMin !== null && reqMin !== null) {
        if (reqMin >= startMin && reqMin + slotDuration <= endMin) {
          isWithinSchedule = true;
          break;
        }
      }
    }

    if (!isWithinSchedule) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Doctor is not available at the selected time slot' });
    }

    // 2. Prevent double booking on new slot
    const [existingAppointments] = await connection.query(
      `SELECT appointmentID FROM appointments 
       WHERE doctorID = ? AND appointmentDate = ? AND appointmentTime = ? 
       AND appointmentID <> ? AND status NOT IN ('Cancelled', 'Expired') FOR UPDATE`,
      [appointment.doctorID, newDate, newTime, appointmentId]
    );

    if (existingAppointments.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This slot is already booked. Please choose another time.' });
    }

    // 3. Update appointment
    await connection.query(
      'UPDATE appointments SET appointmentDate = ?, appointmentTime = ? WHERE appointmentID = ?',
      [newDate, newTime, appointmentId]
    );

    await logAudit(connection, userID, `RESCHEDULE_APPOINTMENT_ID_${appointmentId}`, { ip: req.ip, headers: req.headers, socket: req.socket });

    await connection.commit();

    res.json({ success: true, message: 'Appointment rescheduled successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const downloadInvoice = async (req, res) => {
  const { userID, userType } = req.user;
  const { appointmentId } = req.params;

  if (!appointmentId) {
    return res.status(400).json({ success: false, message: 'Appointment ID is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.patientCode, p.address as patientAddressStr,
              d.licenseNumber, d.specialization,
              i.invoiceNumber, i.subtotal, i.tax, i.discount, i.totalAmount, i.issueDate, i.status as invoiceStatus,
              pay.transactionId, pay.paymentMethod, pay.paymentStatus, pay.verifiedAt
       FROM appointments a
       INNER JOIN patient p ON a.patientID = p.patientID
       INNER JOIN doctor d ON a.doctorID = d.doctorID
       LEFT JOIN invoice i ON a.appointmentID = i.appointmentID
       LEFT JOIN payments pay ON a.appointmentID = pay.appointmentID AND pay.paymentStatus = 'Completed'
       WHERE a.appointmentID = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment details not found' });
    }

    const appointment = rows[0];

    // Ownership / IDOR check
    if (userType === 'patient') {
      const [patientRows] = await pool.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (patientRows.length === 0 || patientRows[0].patientID !== appointment.patientID) {
        return res.status(403).json({ success: false, message: 'You do not have permission to access this invoice' });
      }
    } else if (userType === 'doctor') {
      const [doctorRows] = await pool.query('SELECT doctorID FROM doctor WHERE userID = ?', [userID]);
      if (doctorRows.length === 0 || doctorRows[0].doctorID !== appointment.doctorID) {
        return res.status(403).json({ success: false, message: 'You do not have permission to access this invoice' });
      }
    } else if (!['admin', 'receptionist', 'accountant'].includes(userType)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    const invoiceNumber = appointment.invoiceNumber || `INV-${appointment.appointmentID}-${Date.now()}`;
    const invoiceDate = appointment.issueDate ? new Date(appointment.issueDate).toLocaleDateString() : new Date().toLocaleDateString();

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);
    doc.pipe(res);

    // Layout Design
    doc.fillColor('#00B4B4').fontSize(24).text('PRIMEHEAL CLINICAL HOSPITAL', { align: 'left' });
    doc.fillColor('#475569').fontSize(10).text('123 Health Ave, Colombo 03, Sri Lanka', { align: 'left' });
    doc.text('Hotline: +94 11 234 5678 | Email: billing@primeheal.com', { align: 'left' });
    doc.moveDown(1.5);

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 110).lineTo(562, 110).stroke();
    doc.moveDown(1);

    doc.fillColor('#1e293b').fontSize(16).text('INVOICE / PAYMENT RECEIPT', { align: 'left' });
    doc.fontSize(10).fillColor('#64748b').text(`Invoice Number: ${invoiceNumber}`, { align: 'left' });
    doc.text(`Invoice Date: ${invoiceDate}`, { align: 'left' });
    doc.text(`Appointment Reference ID: PH-APT-${appointment.appointmentID}`, { align: 'left' });
    doc.moveDown(1.5);

    const startY = doc.y;
    doc.fillColor('#00B4B4').fontSize(11).text('PATIENT DETAILS', 50, startY);
    doc.fillColor('#1e293b').fontSize(10);
    doc.text(`Name: ${appointment.patientName}`);
    doc.text(`Patient Code: ${appointment.patientCode || 'N/A'}`);
    doc.text(`NIC: ${appointment.patientNic || 'N/A'}`);
    doc.text(`Phone: ${appointment.patientPhone || 'N/A'}`);
    doc.text(`Email: ${appointment.patientEmail || 'N/A'}`);

    doc.fillColor('#00B4B4').fontSize(11).text('CHANNELING DETAILS', 320, startY);
    doc.fillColor('#1e293b').fontSize(10);
    doc.text(`Consultant: ${appointment.doctorName}`, 320);
    doc.text(`Specialization: ${appointment.specialization || 'N/A'}`, 320);
    doc.text(`SLMC License: ${appointment.licenseNumber || 'N/A'}`, 320);
    doc.text(`Appointment Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}`, 320);
    doc.text(`Scheduled Time: ${appointment.appointmentTime}`, 320);
    doc.moveDown(2);

    const tableY = Math.max(doc.y, 280);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, tableY).lineTo(562, tableY).stroke();
    doc.fillColor('#00B4B4').fontSize(10).text('DESCRIPTION', 55, tableY + 8);
    doc.text('AMOUNT', 480, tableY + 8, { align: 'right', width: 80 });
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, tableY + 24).lineTo(562, tableY + 24).stroke();

    const itemY = tableY + 32;
    doc.fillColor('#1e293b').fontSize(10).text(`Doctor Channeling Fee (${appointment.doctorName})`, 55, itemY);
    doc.text(`LKR ${Number(appointment.fee).toFixed(2)}`, 480, itemY, { align: 'right', width: 80 });

    const subtotalY = itemY + 24;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(320, subtotalY).lineTo(562, subtotalY).stroke();
    
    doc.fillColor('#64748b').text('Subtotal:', 320, subtotalY + 8);
    doc.fillColor('#1e293b').text(`LKR ${Number(appointment.fee).toFixed(2)}`, 480, subtotalY + 8, { align: 'right', width: 80 });

    doc.fillColor('#64748b').text('Tax / Vat (0.0%):', 320, subtotalY + 22);
    doc.fillColor('#1e293b').text(`LKR ${Number(appointment.tax || 0).toFixed(2)}`, 480, subtotalY + 22, { align: 'right', width: 80 });

    doc.fillColor('#64748b').text('Discount:', 320, subtotalY + 36);
    doc.fillColor('#1e293b').text(`LKR ${Number(appointment.discount || 0).toFixed(2)}`, 480, subtotalY + 36, { align: 'right', width: 80 });

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(320, subtotalY + 50).lineTo(562, subtotalY + 50).stroke();

    doc.fillColor('#00B4B4').fontSize(11).text('Total Charge:', 320, subtotalY + 58);
    doc.fillColor('#00B4B4').text(`LKR ${Number(appointment.totalCharge || appointment.fee).toFixed(2)}`, 480, subtotalY + 58, { align: 'right', width: 80 });

    const paymentY = subtotalY + 90;
    doc.fillColor('#64748b').fontSize(10).text('Payment Status:', 50, paymentY);
    const pStatus = appointment.paymentStatus || (appointment.status === 'Paid' || appointment.status === 'Confirmed' ? 'Completed' : 'Pending');
    doc.fillColor(pStatus === 'Completed' ? '#10b981' : '#f59e0b').text(pStatus.toUpperCase(), 140, paymentY);

    if (pStatus === 'Completed') {
      doc.fillColor('#64748b').text('Payment Method:', 50, paymentY + 14);
      doc.fillColor('#1e293b').text(appointment.paymentMethod || 'PayHere Sandbox', 140, paymentY + 14);

      doc.fillColor('#64748b').text('Transaction Reference:', 50, paymentY + 28);
      doc.fillColor('#1e293b').text(appointment.transactionId || 'N/A', 140, paymentY + 28);

      doc.fillColor('#64748b').text('Paid Date:', 50, paymentY + 42);
      const paidDate = appointment.verifiedAt ? new Date(appointment.verifiedAt).toLocaleString() : new Date().toLocaleString();
      doc.fillColor('#1e293b').text(paidDate, 140, paymentY + 42);
    }

    try {
      const qrData = JSON.stringify({
        invoice: invoiceNumber,
        reference: `PH-APT-${appointment.appointmentID}`,
        patient: appointment.patientName,
        doctor: appointment.doctorName,
        amount: `LKR ${Number(appointment.totalCharge || appointment.fee).toFixed(2)}`,
        status: pStatus
      });
      const qrImageBuffer = qr.imageSync(qrData, { type: 'png', margin: 1 });
      doc.image(qrImageBuffer, 462, paymentY, { width: 100, height: 100 });
      doc.fillColor('#64748b').fontSize(8).text('Scan to verify invoice', 465, paymentY + 105, { align: 'center', width: 94 });
    } catch (qrErr) {
      console.error('Failed to generate QR Code:', qrErr);
    }

    doc.fillColor('#94a3b8').fontSize(9).text('Thank you for choosing PrimeHeal Hospital.', 50, 700, { align: 'center', width: 512 });
    doc.text('This is a computer-generated invoice receipt. No signature is required.', 50, 712, { align: 'center', width: 512 });

    doc.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF Invoice', error: error.message });
    }
  }
};

const logAudit = async (connection, userID, action, req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  await connection.query(
    'INSERT INTO audit_logs (userID, action, ipAddress, userAgent) VALUES (?, ?, ?, ?)',
    [userID, action, ip, userAgent]
  ).catch(err => console.error('Audit logging failed in appController:', err));
};

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  downloadInvoice
};
