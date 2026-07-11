const crypto = require('crypto');

const pool = require('../config/db');
const { sendPaymentConfirmation } = require('../utils/emailService');

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || process.env.MERCHANT_ID || '';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || process.env.MERCHANT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const PAYHERE_RETURN_URL = process.env.PAYHERE_RETURN_URL || `${BACKEND_URL}/api/payment/success`;
const PAYHERE_CANCEL_URL = process.env.PAYHERE_CANCEL_URL || `${BACKEND_URL}/api/payment/cancel`;
const PAYHERE_NOTIFY_URL = process.env.PAYHERE_NOTIFY_URL || `${BACKEND_URL}/api/payment/notify`;

const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed', 'Cancelled'];

const md5 = (value) => crypto.createHash('md5').update(String(value ?? '')).digest('hex');

const normalizeAmount = (value) => Number(Number(value ?? 0).toFixed(2));

const formatAmount = (value) => normalizeAmount(value).toFixed(2);

const randomSuffix = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const createMerchantOrderId = (appointmentId) => `PH-${appointmentId}-${Date.now()}-${randomSuffix()}`;

const splitName = (fullName = '') => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'PrimeHeal', lastName: 'Patient' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Patient' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
};

const normalizePaymentStatus = (value) => {
  if (!value) return 'Pending';

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'completed' || normalized === 'paid' || normalized === 'success') return 'Completed';
  if (normalized === 'failed' || normalized === 'error') return 'Failed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return 'Pending';
};

const generatePayHereHash = ({ merchantId = PAYHERE_MERCHANT_ID, orderId, amount, currency, merchantSecret = PAYHERE_MERCHANT_SECRET }) => {
  const formattedAmount = formatAmount(amount);
  const normalizedCurrency = String(currency || 'LKR').toUpperCase();
  const secretHash = md5(merchantSecret).toUpperCase();
  return md5(`${merchantId}${orderId}${formattedAmount}${normalizedCurrency}${secretHash}`).toUpperCase();
};

const generateCallbackSignature = ({ merchantId = PAYHERE_MERCHANT_ID, orderId, amount, currency, statusCode, merchantSecret = PAYHERE_MERCHANT_SECRET }) => {
  const formattedAmount = formatAmount(amount);
  const normalizedCurrency = String(currency || 'LKR').toUpperCase();
  const secretHash = md5(merchantSecret).toUpperCase();
  const secretPlain = String(merchantSecret || '');

  const candidates = [
    `${merchantId}${orderId}${formattedAmount}${normalizedCurrency}${statusCode}${secretHash}`,
    `${merchantId}${orderId}${formattedAmount}${normalizedCurrency}${statusCode}${secretPlain}`,
    `${orderId}${formattedAmount}${normalizedCurrency}${statusCode}${secretHash}`
  ];

  return candidates.map((candidate) => md5(candidate).toUpperCase());
};

const getLatestPaymentFields = (alias = 'a') => `
  (SELECT p.paymentID
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentID,
  (SELECT p.merchantOrderId
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS merchantOrderId,
  (SELECT p.transactionId
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS transactionId,
  (SELECT p.paymentStatus
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentStatus,
  (SELECT p.amount
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentAmount,
  (SELECT p.currency
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentCurrency,
  (SELECT p.paymentMethod
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentMethod,
  (SELECT p.receiptUrl
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS receiptUrl,
  (SELECT p.verifiedAt
   FROM payments p
   WHERE p.appointmentID = ${alias}.appointmentID
   ORDER BY p.paymentID DESC
   LIMIT 1) AS paymentDate
`;

const getPatientIdentity = async (connection, userID) => {
  const [rows] = await connection.query('SELECT p.patientID, u.name, u.email, u.phone FROM patient p INNER JOIN users u ON u.userID = p.userID WHERE p.userID = ?', [userID]);
  return rows[0] || null;
};

const getDoctorIdentity = async (connection, doctorID) => {
  const [rows] = await connection.query('SELECT d.doctorID, u.name, u.email, u.phone, d.consultationFee FROM doctor d INNER JOIN users u ON u.userID = d.userID WHERE d.doctorID = ?', [doctorID]);
  return rows[0] || null;
};

const getAppointmentForPayment = async (connection, appointmentId, patientID) => {
  const [rows] = await connection.query(
    `SELECT
      a.appointmentID,
      a.patientID,
      a.doctorID,
      a.appointmentDate,
      a.appointmentTime,
      a.status,
      a.totalCharge,
      a.patientName,
      a.patientPhone,
      a.patientEmail,
      a.patientAddress,
      a.patientNo,
      a.docAddress,
      a.noShowRefund,
      a.createdAt,
      d.userID AS doctorUserID,
      d.consultationFee,
      u.name AS doctorName,
      u.email AS doctorEmail,
      u.phone AS doctorPhone,
      ${getLatestPaymentFields('a')}
    FROM appointments a
    INNER JOIN doctor d ON d.doctorID = a.doctorID
    INNER JOIN users u ON u.userID = d.userID
    WHERE a.appointmentID = ? AND a.patientID = ?
    LIMIT 1`,
    [appointmentId, patientID]
  );

  return rows[0] || null;
};

const getPaymentByMerchantOrderId = async (connection, merchantOrderId) => {
  const [rows] = await connection.query(
    `SELECT
      p.*,
      a.patientID,
      a.doctorID,
      a.appointmentDate,
      a.appointmentTime,
      a.patientName,
      a.patientEmail,
      a.patientPhone,
      a.patientAddress,
      a.docAddress,
      d.userID AS doctorUserID,
      u.name AS doctorName,
      u.email AS doctorEmail,
      u.phone AS doctorPhone
    FROM payments p
    INNER JOIN appointments a ON a.appointmentID = p.appointmentID
    INNER JOIN doctor d ON d.doctorID = a.doctorID
    INNER JOIN users u ON u.userID = d.userID
    WHERE p.merchantOrderId = ?
    LIMIT 1`,
    [merchantOrderId]
  );

  return rows[0] || null;
};

const findLatestPaymentForAppointment = async (connection, appointmentID) => {
  const [rows] = await connection.query(
    `SELECT *
     FROM payments
     WHERE appointmentID = ?
     ORDER BY paymentID DESC
     LIMIT 1
     FOR UPDATE`,
    [appointmentID]
  );

  return rows[0] || null;
};

const buildCheckoutPayload = ({ payment, appointment, patient, doctor }) => {
  const nameParts = splitName(patient.name || appointment.patientName || 'Patient');
  const amount = normalizeAmount(payment.amount ?? appointment.totalCharge ?? appointment.consultationFee ?? 0);
  const currency = String(payment.currency || 'LKR').toUpperCase();

  return {
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: PAYHERE_RETURN_URL,
    cancel_url: PAYHERE_CANCEL_URL,
    notify_url: PAYHERE_NOTIFY_URL,
    order_id: payment.merchantOrderId,
    items: `PrimeHeal appointment #${appointment.appointmentID}`,
    amount: formatAmount(amount),
    currency,
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    email: patient.email || appointment.patientEmail || '',
    phone: patient.phone || appointment.patientPhone || '',
    address: String(appointment.patientAddress || 'PrimeHeal Patient').slice(0, 255),
    city: 'Colombo',
    country: 'Sri Lanka',
    custom_1: String(appointment.appointmentID),
    custom_2: String(payment.paymentID),
    custom_3: String(patient.patientID || appointment.patientID),
    custom_4: String(doctor.doctorID || appointment.doctorID),
    custom_5: String(doctor.userID || appointment.doctorUserID || ''),
    hash: generatePayHereHash({
      merchantId: PAYHERE_MERCHANT_ID,
      orderId: payment.merchantOrderId,
      amount,
      currency,
      merchantSecret: PAYHERE_MERCHANT_SECRET
    })
  };
};

const createPayment = async ({ appointmentId, userID }) => {
  if (!appointmentId) {
    return { success: false, status: 400, message: 'Appointment ID is required.' };
  }

  if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
    return { success: false, status: 500, message: 'PayHere credentials are not configured.' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const patient = await getPatientIdentity(connection, userID);
    if (!patient) {
      await connection.rollback();
      return { success: false, status: 404, message: 'Patient record not found.' };
    }

    const appointment = await getAppointmentForPayment(connection, appointmentId, patient.patientID);
    if (!appointment) {
      await connection.rollback();
      return { success: false, status: 404, message: 'Appointment not found.' };
    }

    if (String(appointment.status).toLowerCase() === 'cancelled') {
      await connection.rollback();
      return { success: false, status: 400, message: 'Cancelled appointments cannot be paid.' };
    }

    const doctor = await getDoctorIdentity(connection, appointment.doctorID);
    const latestPayment = await findLatestPaymentForAppointment(connection, appointment.appointmentID);

    if (latestPayment && PAYMENT_STATUSES.includes(latestPayment.paymentStatus) && latestPayment.paymentStatus !== 'Failed') {
      await connection.commit();

      const responsePayment = {
        ...latestPayment,
        paymentStatus: normalizePaymentStatus(latestPayment.paymentStatus),
        appointmentID: appointment.appointmentID,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        doctorName: appointment.doctorName,
        patientName: appointment.patientName,
        paymentAmount: latestPayment.amount
      };

      return {
        success: true,
        status: 200,
        alreadyExists: true,
        message: latestPayment.paymentStatus === 'Completed' ? 'Payment has already been completed for this appointment.' : 'A pending payment already exists for this appointment.',
        payment: responsePayment,
        checkout: latestPayment.paymentStatus === 'Pending' ? buildCheckoutPayload({ payment: latestPayment, appointment, patient, doctor }) : null
      };
    }

    const merchantOrderId = createMerchantOrderId(appointment.appointmentID);
    const amount = normalizeAmount(appointment.totalCharge ?? appointment.consultationFee ?? 0);

    const [insertResult] = await connection.query(
      `INSERT INTO payments (
        appointmentID,
        patientID,
        doctorID,
        merchantOrderId,
        amount,
        currency,
        paymentStatus,
        paymentGateway,
        gatewayResponse
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'PayHere', JSON_OBJECT('source', 'checkout_create'))`,
      [appointment.appointmentID, patient.patientID, appointment.doctorID, merchantOrderId, amount, 'LKR']
    );

    const payment = {
      paymentID: insertResult.insertId,
      appointmentID: appointment.appointmentID,
      patientID: patient.patientID,
      doctorID: appointment.doctorID,
      merchantOrderId,
      amount,
      currency: 'LKR',
      paymentStatus: 'Pending',
      paymentGateway: 'PayHere'
    };

    await connection.commit();

    return {
      success: true,
      status: 201,
      message: 'Payment created successfully.',
      payment,
      checkout: buildCheckoutPayload({ payment, appointment, patient, doctor })
    };
  } catch (error) {
    await connection.rollback();
    return { success: false, status: 500, message: error.message || 'Failed to create payment.' };
  } finally {
    connection.release();
  }
};

const finalizeSuccessfulPayment = async (connection, paymentRow, gatewayPayload = {}) => {
  const receiptUrl = gatewayPayload.receipt_url || gatewayPayload.receiptUrl || paymentRow.receiptUrl || null;
  const transactionId = gatewayPayload.payment_id || gatewayPayload.transaction_id || gatewayPayload.transactionId || paymentRow.transactionId || null;
  const paymentMethod = gatewayPayload.method || gatewayPayload.payment_method || gatewayPayload.paymentMethod || paymentRow.paymentMethod || null;
  const statusCode = gatewayPayload.status_code || gatewayPayload.statusCode || '2';
  const amount = normalizeAmount(gatewayPayload.payhere_amount || gatewayPayload.amount || paymentRow.amount);
  const currency = String(gatewayPayload.payhere_currency || gatewayPayload.currency || paymentRow.currency || 'LKR').toUpperCase();
  const signature = String(gatewayPayload.md5sig || gatewayPayload.signature || '').trim();

  const signatureCandidates = generateCallbackSignature({
    merchantId: String(gatewayPayload.merchant_id || gatewayPayload.merchantId || PAYHERE_MERCHANT_ID),
    orderId: String(gatewayPayload.order_id || gatewayPayload.orderId || paymentRow.merchantOrderId),
    amount,
    currency,
    statusCode,
    merchantSecret: PAYHERE_MERCHANT_SECRET
  });

  if (signature && !signatureCandidates.includes(signature.toUpperCase())) {
    return { success: false, status: 400, message: 'Invalid payment signature.' };
  }

  if (paymentRow.paymentStatus === 'Completed' && paymentRow.notifyProcessedAt) {
    return {
      success: true,
      payment: paymentRow,
      appointmentId: paymentRow.appointmentID,
      alreadyProcessed: true,
      message: 'Payment notification was already processed.'
    };
  }

  await connection.query(
    `UPDATE payments
     SET transactionId = COALESCE(?, transactionId),
         paymentStatus = 'Completed',
         payhereStatusCode = ?,
         paymentMethod = COALESCE(?, paymentMethod),
         receiptUrl = COALESCE(?, receiptUrl),
         notifyPayload = ?,
         notifySignature = ?,
         verifiedAt = COALESCE(verifiedAt, NOW()),
         notifyProcessedAt = NOW()
     WHERE paymentID = ?`,
    [
      transactionId,
      String(statusCode),
      paymentMethod,
      receiptUrl,
      JSON.stringify(gatewayPayload),
      signature || null,
      paymentRow.paymentID
    ]
  );

  await connection.query('UPDATE appointments SET status = \'Paid\' WHERE appointmentID = ?', [paymentRow.appointmentID]);

  const [updatedRows] = await connection.query(
    `SELECT
      p.*,
      a.appointmentDate,
      a.appointmentTime,
      a.patientName,
      a.patientEmail,
      a.patientPhone,
      a.patientAddress,
      a.docAddress,
      d.userID AS doctorUserID,
      u.name AS doctorName,
      u.email AS doctorEmail,
      u.phone AS doctorPhone
     FROM payments p
     INNER JOIN appointments a ON a.appointmentID = p.appointmentID
     INNER JOIN doctor d ON d.doctorID = a.doctorID
     INNER JOIN users u ON u.userID = d.userID
     WHERE p.paymentID = ?
     LIMIT 1`,
    [paymentRow.paymentID]
  );

  const updatedPayment = updatedRows[0] || paymentRow;

  return {
    success: true,
    payment: updatedPayment,
    appointmentId: paymentRow.appointmentID,
    message: 'Payment verified successfully.'
  };
};

const verifyPayment = async ({ payload, userID }) => {
  const orderId = payload.order_id || payload.orderId;
  const amount = normalizeAmount(payload.payhere_amount || payload.amount);
  const currency = String(payload.payhere_currency || payload.currency || 'LKR').toUpperCase();
  const statusCode = String(payload.status_code || payload.statusCode || '2');

  if (!orderId) {
    return { success: false, status: 400, message: 'Order ID is required.' };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const paymentRow = await getPaymentByMerchantOrderId(connection, orderId);
    if (!paymentRow) {
      await connection.rollback();
      return { success: false, status: 404, message: 'Payment record not found.' };
    }

    if (Number(paymentRow.patientID) && Number(userID)) {
      const patient = await getPatientIdentity(connection, userID);
      if (!patient || Number(patient.patientID) !== Number(paymentRow.patientID)) {
        await connection.rollback();
        return { success: false, status: 403, message: 'You are not allowed to verify this payment.' };
      }
    }

    if (normalizeAmount(paymentRow.amount) !== amount || String(paymentRow.currency || 'LKR').toUpperCase() !== currency) {
      await connection.rollback();
      return { success: false, status: 400, message: 'Payment amount or currency mismatch.' };
    }

    if (statusCode !== '2') {
      const normalizedStatus = statusCode === '-1' ? 'Cancelled' : 'Failed';
      await connection.query(
        `UPDATE payments
         SET paymentStatus = ?,
             payhereStatusCode = ?,
             notifyPayload = ?,
             notifySignature = ?,
             verifiedAt = COALESCE(verifiedAt, NOW())
         WHERE paymentID = ?`,
        [normalizedStatus, statusCode, JSON.stringify(payload), String(payload.md5sig || payload.signature || '') || null, paymentRow.paymentID]
      );

      await connection.commit();

      return {
        success: true,
        status: 200,
        payment: { ...paymentRow, paymentStatus: normalizedStatus },
        message: 'Payment recorded with a non-success status.'
      };
    }

    const finalizeResult = await finalizeSuccessfulPayment(connection, paymentRow, payload);
    if (!finalizeResult.success) {
      await connection.rollback();
      return finalizeResult;
    }

    await connection.commit();

    try {
      const patient = {
        name: finalizeResult.payment.patientName || paymentRow.patientName,
        email: finalizeResult.payment.patientEmail || paymentRow.patientEmail
      };

      await sendPaymentConfirmation(patient, finalizeResult.payment);
    } catch (emailError) {
      console.error('Payment confirmation email error:', emailError);
    }

    return {
      success: true,
      status: 200,
      payment: finalizeResult.payment,
      message: finalizeResult.message
    };
  } catch (error) {
    await connection.rollback();
    return { success: false, status: 500, message: error.message || 'Failed to verify payment.' };
  } finally {
    connection.release();
  }
};

const handlePaymentNotification = async (payload = {}) => {
  const orderId = payload.order_id || payload.orderId;
  if (!orderId) {
    return { success: false, status: 400, message: 'Order ID is required.' };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const paymentRow = await getPaymentByMerchantOrderId(connection, orderId);
    if (!paymentRow) {
      await connection.rollback();
      return { success: false, status: 404, message: 'Payment record not found.' };
    }

    const amount = normalizeAmount(payload.payhere_amount || payload.amount);
    const currency = String(payload.payhere_currency || payload.currency || 'LKR').toUpperCase();
    const statusCode = String(payload.status_code || payload.statusCode || '2');

    if (normalizeAmount(paymentRow.amount) !== amount || String(paymentRow.currency || 'LKR').toUpperCase() !== currency) {
      await connection.rollback();
      return { success: false, status: 400, message: 'Payment amount or currency mismatch.' };
    }

    if (paymentRow.notifyProcessedAt && paymentRow.paymentStatus === 'Completed') {
      await connection.commit();
      return { success: true, status: 200, payment: paymentRow, message: 'Notification already processed.' };
    }

    if (statusCode !== '2') {
      const normalizedStatus = statusCode === '-1' ? 'Cancelled' : 'Failed';
      await connection.query(
        `UPDATE payments
         SET paymentStatus = ?,
             payhereStatusCode = ?,
             transactionId = COALESCE(?, transactionId),
             notifyPayload = ?,
             notifySignature = ?,
             verifiedAt = COALESCE(verifiedAt, NOW()),
             notifyProcessedAt = NOW()
         WHERE paymentID = ?`,
        [
          normalizedStatus,
          statusCode,
          payload.payment_id || payload.transaction_id || payload.transactionId || null,
          JSON.stringify(payload),
          String(payload.md5sig || payload.signature || '') || null,
          paymentRow.paymentID
        ]
      );

      await connection.commit();

      return {
        success: true,
        status: 200,
        payment: { ...paymentRow, paymentStatus: normalizedStatus },
        message: 'Notification recorded with a non-success status.'
      };
    }

    const finalizeResult = await finalizeSuccessfulPayment(connection, paymentRow, payload);
    if (!finalizeResult.success) {
      await connection.rollback();
      return finalizeResult;
    }

    await connection.commit();

    try {
      const patient = {
        name: finalizeResult.payment.patientName || paymentRow.patientName,
        email: finalizeResult.payment.patientEmail || paymentRow.patientEmail
      };

      await sendPaymentConfirmation(patient, finalizeResult.payment);
    } catch (emailError) {
      console.error('Payment confirmation email error:', emailError);
    }

    return {
      success: true,
      status: 200,
      payment: finalizeResult.payment,
      message: finalizeResult.message
    };
  } catch (error) {
    await connection.rollback();
    return { success: false, status: 500, message: error.message || 'Failed to process notification.' };
  } finally {
    connection.release();
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  handlePaymentNotification,
  generatePayHereHash,
  buildCheckoutPayload,
  normalizePaymentStatus
};