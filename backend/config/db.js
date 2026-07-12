const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const databaseName = process.env.DB_NAME || 'primeheal_db';
let poolPromise;

async function initializePool() {
  const initialConnection = await mysql.createConnection({
    ...dbConfig,
    database: undefined
  });

  try {
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await initialConnection.end();
  }

  const pool = mysql.createPool({
    ...dbConfig,
    database: databaseName
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      userID INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      userType ENUM('patient','doctor','receptionist','accountant','admin') NOT NULL,
      isActive TINYINT(1) DEFAULT 1,
      profileImage VARCHAR(255) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_userType (userType),
      INDEX idx_isActive (isActive)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profileImage VARCHAR(255) DEFAULT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin (
      adminID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL UNIQUE,
      permissions JSON DEFAULT NULL,
      accessLevel ENUM('super','standard','limited') DEFAULT 'standard',
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient (
      patientID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL UNIQUE,
      patientCode VARCHAR(50) DEFAULT NULL,
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    ALTER TABLE patient
    ADD COLUMN IF NOT EXISTS patientCode VARCHAR(50) DEFAULT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctor (
      doctorID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL UNIQUE,
      specialization VARCHAR(100) DEFAULT NULL,
      licenseNumber VARCHAR(50) DEFAULT NULL,
      qualifications TEXT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      consultationFee DECIMAL(10,2) DEFAULT 0.00,
      averageRating DECIMAL(3,2) DEFAULT 0.00,
      totalPatients INT DEFAULT 0,
      isAvailable TINYINT(1) DEFAULT 1,
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS receptionist (
      receptionistID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL UNIQUE,
      department VARCHAR(100) DEFAULT NULL,
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accountant (
      accountantID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL UNIQUE,
      accountingLicense VARCHAR(50) DEFAULT NULL,
      department VARCHAR(100) DEFAULT NULL,
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      appointmentID INT AUTO_INCREMENT PRIMARY KEY,
      patientID INT NOT NULL,
      doctorID INT NOT NULL,
      doctorName VARCHAR(100) NOT NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime VARCHAR(50) NOT NULL,
      status ENUM('Pending', 'Paid', 'Confirmed', 'Completed', 'Cancelled', 'Expired', 'No Show') DEFAULT 'Pending',
      fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      totalCharge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      patientName VARCHAR(100) NOT NULL,
      patientPhone VARCHAR(50) DEFAULT NULL,
      patientEmail VARCHAR(100) NOT NULL,
      patientNic VARCHAR(50) DEFAULT NULL,
      patientAddress TEXT DEFAULT NULL,
      patientNo VARCHAR(50) DEFAULT NULL,
      docAddress TEXT DEFAULT NULL,
      noShowRefund TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patientID) REFERENCES patient(patientID) ON DELETE CASCADE,
      FOREIGN KEY (doctorID) REFERENCES doctor(doctorID) ON DELETE CASCADE,
      INDEX idx_patientID (patientID),
      INDEX idx_doctorID (doctorID),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      paymentID INT AUTO_INCREMENT PRIMARY KEY,
      appointmentID INT NOT NULL,
      patientID INT NOT NULL,
      doctorID INT NOT NULL,
      merchantOrderId VARCHAR(120) NOT NULL UNIQUE,
      transactionId VARCHAR(120) DEFAULT NULL UNIQUE,
      paymentGateway VARCHAR(50) DEFAULT 'PayHere',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'LKR',
      paymentStatus ENUM('Pending','Completed','Failed','Cancelled') DEFAULT 'Pending',
      payhereStatusCode VARCHAR(20) DEFAULT NULL,
      paymentMethod VARCHAR(50) DEFAULT NULL,
      receiptUrl VARCHAR(255) DEFAULT NULL,
      gatewayResponse JSON DEFAULT NULL,
      notifyPayload JSON DEFAULT NULL,
      notifySignature VARCHAR(255) DEFAULT NULL,
      verifiedAt TIMESTAMP NULL DEFAULT NULL,
      notifyProcessedAt TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (appointmentID) REFERENCES appointments(appointmentID) ON DELETE CASCADE,
      FOREIGN KEY (patientID) REFERENCES patient(patientID) ON DELETE CASCADE,
      FOREIGN KEY (doctorID) REFERENCES doctor(doctorID) ON DELETE CASCADE,
      INDEX idx_payments_patientID (patientID),
      INDEX idx_payments_doctorID (doctorID),
      INDEX idx_payments_status (paymentStatus),
      INDEX idx_payments_createdAt (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      tokenID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL,
      token VARCHAR(128) NOT NULL UNIQUE,
      expiresAt DATETIME NOT NULL,
      used TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
      INDEX idx_token (token),
      INDEX idx_userID (userID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@primeheal.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `UPDATE users
     SET password = ?, userType = 'admin', isActive = 1
     WHERE email = ?
    `,
    [hashedPassword, adminEmail]
  );

  await pool.query(
    `INSERT INTO users (name, email, password, userType, isActive)
     SELECT ?, ?, ?, 'admin', 1
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)
    `,
    ['Admin User', adminEmail, hashedPassword, adminEmail]
  );

  await pool.query(
    `INSERT INTO admin (userID, permissions, accessLevel)
     SELECT userID, ?, 'super'
     FROM users
     WHERE email = ? AND NOT EXISTS (SELECT 1 FROM admin WHERE admin.userID = users.userID)
    `,
    ['{"manage_users": true, "view_reports": true, "manage_settings": true, "handle_complaints": true}', adminEmail]
  );

  return pool;
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = initializePool();
  }

  return poolPromise;
}

module.exports = {
  getPool,
  query: (...args) => getPool().then((pool) => pool.query(...args)),
  getConnection: (...args) => getPool().then((pool) => pool.getConnection(...args))
};
