const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

async function seedDemoDatabase() {
  console.log('🌱 Starting PrimeHeal Demo Database Seed...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'primeheal_db',
    port: process.env.DB_PORT || 3306,
  };

  const pool = mysql.createPool(dbConfig);

  try {
    console.log('1. Disabling Foreign Key Checks...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('2. Truncating Transactional Tables...');
    const tablesToTruncate = [
      'appointments', 'payments', 'feedback', 'medicalreport', 
      'invoice', 'complaint', 'notification', 'doctoravailability'
    ];
    for (const table of tablesToTruncate) {
      await pool.query(`TRUNCATE TABLE ${table}`);
      console.log(`   - Truncated ${table}`);
    }

    console.log('3. Deleting non-admin users and profiles...');
    await pool.query('TRUNCATE TABLE doctor');
    await pool.query('TRUNCATE TABLE patient');
    await pool.query('TRUNCATE TABLE receptionist');
    await pool.query('TRUNCATE TABLE accountant');
    await pool.query(`DELETE FROM users WHERE userType != 'admin'`);

    console.log('4. Generating Fresh Demo Data...');
    const hashedPassword = await bcrypt.hash('password', 10);

    // Insert Doctors
    const doctors = [
      { name: 'Dr. Sarah Mitchell', email: 'sarah@primeheal.com', spec: 'Cardiologist', phone: '0711111111', fee: 15 },
      { name: 'Dr. James Wilson', email: 'james@primeheal.com', spec: 'Neurologist', phone: '0711111112', fee: 18 },
      { name: 'Dr. Emily Chen', email: 'emily@primeheal.com', spec: 'Pediatrician', phone: '0711111113', fee: 12 },
      { name: 'Dr. Michael Brown', email: 'michael@primeheal.com', spec: 'Dermatologist', phone: '0711111114', fee: 10 },
      { name: 'Dr. Lisa Wong', email: 'lisa@primeheal.com', spec: 'General Physician', phone: '0711111115', fee: 8 }
    ];

    const doctorIds = [];
    let docIndex = 1;
    for (const doc of doctors) {
      const [uRes] = await pool.query(
        'INSERT INTO users (name, email, password, phone, userType, isActive) VALUES (?, ?, ?, ?, ?, 1)',
        [doc.name, doc.email, hashedPassword, doc.phone, 'doctor']
      );
      const userId = uRes.insertId;
      const [dRes] = await pool.query(
        'INSERT INTO doctor (userID, specialization, experience, consultationFee, licenseNumber) VALUES (?, ?, ?, ?, ?)',
        [userId, doc.spec, '10 Years', doc.fee, `LIC${1000 + docIndex}`]
      );
      doctorIds.push(dRes.insertId);
      docIndex++;
    }

    // Insert Staff
    await pool.query('INSERT INTO users (name, email, password, userType) VALUES (?, ?, ?, ?)', ['Jane Doe', 'receptionist1@primeheal.com', hashedPassword, 'receptionist']);
    const [rRes1] = await pool.query('SELECT LAST_INSERT_ID() as id');
    await pool.query('INSERT INTO receptionist (userID, department) VALUES (?, ?)', [rRes1[0].id, 'Front Desk']);

    await pool.query('INSERT INTO users (name, email, password, userType) VALUES (?, ?, ?, ?)', ['John Smith', 'accountant1@primeheal.com', hashedPassword, 'accountant']);
    const [aRes1] = await pool.query('SELECT LAST_INSERT_ID() as id');
    await pool.query('INSERT INTO accountant (userID, accountingLicense, department) VALUES (?, ?, ?)', [aRes1[0].id, 'CPA-12345', 'Finance']);

    // Insert Patients
    const patientIds = [];
    for (let i = 1; i <= 10; i++) {
      const [uRes] = await pool.query(
        'INSERT INTO users (name, email, password, phone, userType) VALUES (?, ?, ?, ?, ?)',
        [`Patient ${i}`, `patient${i}@demo.com`, hashedPassword, `077700000${i}`, 'patient']
      );
      const [pRes] = await pool.query(
        'INSERT INTO patient (userID, patientCode, nic, country) VALUES (?, ?, ?, ?)',
        [uRes.insertId, `PT00${i}`, `99000000${i}V`, 'Sri Lanka']
      );
      patientIds.push(pRes.insertId);
    }

    // Insert Appointments
    console.log('5. Generating Appointments & Payments...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    let apptCounter = 0;
    for (let i = 0; i < 20; i++) {
      const docId = doctorIds[i % doctors.length];
      const patId = patientIds[i % patientIds.length];
      const date = i < 10 ? today : tomorrow;
      const status = i < 5 ? 'Completed' : (i < 15 ? 'Paid' : 'Pending');
      const time = `10:00 AM`; // Simplified time
      
      const [apptRes] = await pool.query(
        'INSERT INTO appointments (doctorID, patientID, appointmentDate, appointmentTime, status, totalCharge) VALUES (?, ?, ?, ?, ?, ?)',
        [docId, patId, date, time, status, 25.00]
      );
      
      if (status !== 'Pending') {
        const merchantOrderId = `DEMO-PAY-${Date.now()}-${i}`;
        await pool.query(
          'INSERT INTO payments (appointmentID, patientID, doctorID, merchantOrderId, amount, paymentMethod, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [apptRes.insertId, patId, docId, merchantOrderId, 25.00, 'Cash', 'Completed']
        );
      }
    }

    console.log('✅ Demo Data Seeded Successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
  } finally {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
    pool.end();
  }
}

seedDemoDatabase();
