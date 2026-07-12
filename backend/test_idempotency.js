const { createPayment } = require('./services/paymentService');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'primeheal',
  };

  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('1. Finding a Paid/Completed appointment ID in the database...');
    const [appointments] = await connection.query(
      "SELECT appointmentID, patientID FROM appointments WHERE status = 'Paid' LIMIT 1"
    );

    if (appointments.length === 0) {
      console.log('No paid appointments found. Run the webhook test first.');
      return;
    }

    const apt = appointments[0];
    console.log(`Found paid appointment ID: ${apt.appointmentID}`);

    // Retrieve the userID for the patient to call createPayment
    const [patients] = await connection.query(
      "SELECT userID FROM patient WHERE patientID = ?",
      [apt.patientID]
    );
    const userID = patients[0].userID;
    console.log(`Using patient userID: ${userID}`);

    console.log('\n2. Trying to create a payment session for this already-paid appointment...');
    const result = await createPayment({ appointmentId: apt.appointmentID, userID });
    console.log('Result:', result);

    if (result.success === false && result.status === 409 && result.message.includes('already been paid for')) {
      console.log('\n🎉 SUCCESS: Backend successfully prevented double payments!');
    } else {
      console.error('\n❌ FAILURE: Backend did not reject the already-paid appointment correctly.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

run();
