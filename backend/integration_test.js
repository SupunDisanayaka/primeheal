const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const md5 = (value) => crypto.createHash('md5').update(String(value ?? '')).digest('hex');

async function runTest() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'primeheal',
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('1. Checking for existing pending payment in database...');
    const [payments] = await connection.query(
      `SELECT p.*, a.totalCharge 
       FROM payments p 
       JOIN appointments a ON p.appointmentID = a.appointmentID 
       WHERE p.paymentStatus = 'Pending' 
       LIMIT 1`
    );

    let payment;
    if (payments.length === 0) {
      console.log('No pending payment found. Creating a mock appointment and a pending payment...');
      // Find a patient and a doctor to link to
      const [patients] = await connection.query("SELECT patientID FROM patient LIMIT 1");
      const [doctors] = await connection.query("SELECT doctorID, consultationFee FROM doctor LIMIT 1");

      if (patients.length === 0 || doctors.length === 0) {
        throw new Error('No patients or doctors found in the database. Please seed the database first.');
      }

      const patientId = patients[0].patientID;
      const doctorId = doctors[0].doctorID;
      const consultationFee = doctors[0].consultationFee || 2000.00;

      // Insert mock appointment
      const [appResult] = await connection.query(
        `INSERT INTO appointments (patientID, doctorID, doctorName, appointmentDate, appointmentTime, status, fee, totalCharge, patientName, patientEmail)
         VALUES (?, ?, 'Test Doctor', CURDATE(), '10:00 AM', 'Pending', ?, ?, 'Test Patient', 'test@example.com')`,
        [patientId, doctorId, consultationFee, consultationFee]
      );
      const appointmentId = appResult.insertId;

      // Insert pending payment
      const merchantOrderId = `PH-${appointmentId}-${Date.now()}`;
      const [payResult] = await connection.query(
        `INSERT INTO payments (appointmentID, patientID, doctorID, merchantOrderId, amount, currency, paymentStatus, paymentGateway)
         VALUES (?, ?, ?, ?, ?, 'LKR', 'Pending', 'PayHere')`,
        [appointmentId, patientId, doctorId, merchantOrderId, consultationFee]
      );

      payment = {
        paymentID: payResult.insertId,
        appointmentID: appointmentId,
        merchantOrderId: merchantOrderId,
        amount: consultationFee,
        currency: 'LKR'
      };
      console.log(`Created mock payment ID: ${payment.paymentID}, order ID: ${payment.merchantOrderId}`);
    } else {
      payment = payments[0];
      payment.amount = payment.amount ?? payment.totalCharge;
      console.log(`Found pending payment ID: ${payment.paymentID}, order ID: ${payment.merchantOrderId}, amount: ${payment.amount}`);
    }

    console.log('\n2. Constructing mock PayHere webhook notification payload...');
    const merchantId = process.env.PAYHERE_MERCHANT_ID || '1236606';
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'NDI3MjExMzk5MTMxNDg3NDQxODAxMDg4NTM3NzgwNzI3ODUxNTI4';
    const orderId = payment.merchantOrderId;
    const amount = Number(payment.amount).toFixed(2);
    const currency = payment.currency || 'LKR';
    const statusCode = '2'; // Success code in PayHere
    const paymentId = `MOCK-TXN-${Date.now()}`;

    // Compute signature (MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret).toUpperCase()))
    const secretHash = md5(merchantSecret).toUpperCase();
    const signatureSource = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
    const md5sig = md5(signatureSource).toUpperCase();

    const payload = {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: paymentId,
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig: md5sig,
      method: 'VISA',
      status_message: 'Success'
    };

    console.log('Payload:', payload);

    console.log('\n3. Triggering mock webhook notification endpoint locally...');
    const response = await fetch('http://localhost:5000/api/payment/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Response Status:', response.status);
    const responseData = await response.json();
    console.log('Response Data:', responseData);

    console.log('\n4. Verifying database state update...');
    const [updatedPayments] = await connection.query(
      "SELECT paymentStatus, transactionId, notifyProcessedAt FROM payments WHERE paymentID = ?",
      [payment.paymentID]
    );

    const updatedPayment = updatedPayments[0];
    console.log('Updated Payment status in DB:', updatedPayment.paymentStatus);
    console.log('Updated Transaction ID in DB:', updatedPayment.transactionId);
    console.log('Processed at timestamp:', updatedPayment.notifyProcessedAt);

    const [updatedAppointments] = await connection.query(
      "SELECT status FROM appointments WHERE appointmentID = ?",
      [payment.appointmentID]
    );
    console.log('Updated Appointment status in DB:', updatedAppointments[0].status);

    if (updatedPayment.paymentStatus === 'Completed' && updatedAppointments[0].status === 'Paid') {
      console.log('\n🎉 SUCCESS: Webhook processing completed successfully!');
    } else {
      console.error('\n❌ FAILURE: Database status did not transition correctly.');
    }

  } catch (error) {
    console.error('Test run failed:', error.message);
  } finally {
    await connection.end();
  }
}

runTest();
