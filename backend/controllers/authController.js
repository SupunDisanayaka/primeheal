const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
  sendWelcomeEmail,
  sendLoginEmail,
  sendPasswordResetRequestEmail,
  sendPasswordResetSuccessEmail
} = require('../utils/emailService');

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Validators
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  if (!phone) return true;
  return /^(?:\+94|0)?7[0-9]{8}$/.test(phone);
};

const isValidNIC = (nic) => {
  if (!nic) return true;
  return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
};

const isStrongPassword = (pass) => {
  if (pass.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// Custom IP Rate Limiter for Login Attempts
const loginAttempts = {};
const checkLoginRateLimit = (ip) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxFailedAttempts = 5;

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = [];
  }
  loginAttempts[ip] = loginAttempts[ip].filter(timestamp => now - timestamp < windowMs);
  return loginAttempts[ip].length >= maxFailedAttempts;
};

const recordFailedLoginAttempt = (ip) => {
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = [];
  }
  loginAttempts[ip].push(Date.now());
};

// General Audit Logger
const logAudit = async (connectionOrPool, userID, action, req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  await connectionOrPool.query(
    'INSERT INTO audit_logs (userID, action, ipAddress, userAgent) VALUES (?, ?, ?, ?)',
    [userID, action, ip, userAgent]
  ).catch(err => console.error('Audit logging failed:', err));
};

const createAuthToken = (user, roleId = null) => jwt.sign(
  {
    userID: user.userID || user.id,
    userId: user.userID || user.id,
    id: user.userID || user.id,
    userType: user.userType,
    role: user.userType,
    name: user.name,
    roleID: roleId,
    tokenVersion: user.tokenVersion || 1
  },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

const getRoleIdForUser = async (user) => {
  let roleId = null;

  if (user.userType === 'patient') {
    const [rows] = await pool.query('SELECT patientID FROM patient WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].patientID;
  } else if (user.userType === 'doctor') {
    const [rows] = await pool.query('SELECT doctorID FROM doctor WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].doctorID;
  } else if (user.userType === 'receptionist') {
    const [rows] = await pool.query('SELECT receptionistID FROM receptionist WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].receptionistID;
  } else if (user.userType === 'accountant') {
    const [rows] = await pool.query('SELECT accountantID FROM accountant WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].accountantID;
  } else if (user.userType === 'admin' || user.userType === 'superadmin') {
    const [rows] = await pool.query('SELECT adminID FROM admin WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].adminID;
  } else if (user.userType === 'labstaff') {
    const [rows] = await pool.query('SELECT labstaffID FROM labstaff WHERE userID = ?', [user.userID]);
    if (rows.length > 0) roleId = rows[0].labstaffID;
  }

  return roleId;
};

const register = async (req, res) => {
  const { name, email, password, phone, nic, dob, address, emergencyContact, allergies } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid Sri Lankan phone number format (e.g. 0771234567)' });
  }

  if (nic && !isValidNIC(nic)) {
    return res.status(400).json({ success: false, message: 'Invalid Sri Lankan NIC format (e.g. 199912345678 or 991234567v)' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if email exists
    const [existingUsers] = await connection.query('SELECT userID FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if phone exists
    if (phone) {
      const [existingPhone] = await connection.query('SELECT userID FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      }
    }

    // Check if NIC exists
    if (nic) {
      const [existingNic] = await connection.query('SELECT patientID FROM patient WHERE nic = ?', [nic]);
      if (existingNic.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'NIC already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert into users table
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, phone, userType, isActive, tokenVersion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'patient', 1, 1]
    );
    
    const userId = userResult.insertId;

    // Generate a unique patient code
    const patientCode = `PT-${String(userId).padStart(5, '0')}`;

    // Insert into patient table
    await connection.query(
      'INSERT INTO patient (userID, patientCode, nic, dateOfBirth, address, emergencyContact, allergies) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        patientCode,
        nic || null,
        dob || null,
        address || null,
        emergencyContact || null,
        allergies || null
      ]
    );

    // Insert into password history
    await connection.query(
      'INSERT INTO password_history (userID, passwordHash) VALUES (?, ?)',
      [userId, hashedPassword]
    );

    // Audit log
    await logAudit(connection, userId, 'REGISTER_PATIENT', req);

    await connection.commit();

    // Send registration email
    try {
      await sendWelcomeEmail({ email, name, userType: 'patient' });
    } catch (emailError) {
      console.error('Registration email error:', emailError);
    }

    // Create token
    const token = createAuthToken({ userID: userId, userType: 'patient', name, tokenVersion: 1 }, userId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: userId,
        userId,
        id: userId,
        name,
        email,
        phone,
        userType: 'patient',
        role: 'patient'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @route   POST /api/auth/register-receptionist
// @desc    Register a new receptionist (admin only)
const createReceptionist = async (req, res) => {
  const { name, email, password, phone, deskBlock, shift } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, phone, userType, isActive, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'receptionist', 1, null]
    );

    const userId = userResult.insertId;
    await connection.query(
      'INSERT INTO receptionist (userID, department) VALUES (?, ?)',
      [userId, deskBlock || shift || 'Front Desk']
    );

    await connection.commit();

    try {
      await sendWelcomeEmail({ email, name, userType: 'receptionist' });
    } catch (emailError) {
      console.error('Receptionist registration email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Receptionist account created successfully',
      user: {
        _id: userId,
        name,
        email,
        userType: 'receptionist'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @route   POST /api/auth/register-accountant
// @desc    Register a new accountant (admin only)
const createAccountant = async (req, res) => {
  const { name, email, password, phone, department, shift } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, phone, userType, isActive, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'accountant', 1, null]
    );

    const userId = userResult.insertId;
    await connection.query(
      'INSERT INTO accountant (userID, department, accountingLicense) VALUES (?, ?, ?)',
      [userId, department || 'Billing & Insurance', `ACC-${String(userId).padStart(5, '0')}`]
    );

    await connection.commit();

    try {
      await sendWelcomeEmail({ email, name, userType: 'accountant' });
    } catch (emailError) {
      console.error('Accountant registration email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Accountant account created successfully',
      user: {
        _id: userId,
        name,
        email,
        userType: 'accountant'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @route   POST /api/auth/login
// @desc    Login user (any type)
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (checkLoginRateLimit(ip)) {
    return res.status(429).json({ success: false, message: 'Too many failed login attempts. Please try again after 15 minutes.' });
  }

  try {
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      recordFailedLoginAttempt(ip);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      recordFailedLoginAttempt(ip);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get specific role ID
    const roleId = await getRoleIdForUser(user);

    // Create token with tokenVersion
    const token = createAuthToken(user, roleId);

    // Log login success audit
    await logAudit(pool, user.userID, 'LOGIN_SUCCESS', req);

    try {
      await sendLoginEmail({ to: user.email, name: user.name, userType: user.userType });
    } catch (emailError) {
      console.error('Login notification email error:', emailError);
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user.userID,
        userId: user.userID,
        id: user.userID,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.userType,
        roleID: roleId
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   POST /api/auth/google
// @desc    Login or register a patient using Google access token
const googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ success: false, message: 'Google access token is required' });
  }

  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Unable to verify Google account' });
    }

    const profile = await response.json();
    if (!profile.email) {
      return res.status(400).json({ success: false, message: 'Google account does not include an email address' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [profile.email]);
      let user = users[0];

      if (user && user.userType !== 'patient') {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Please sign in with the account type assigned to this email' });
      }

      if (!user) {
        const fallbackName = profile.name || profile.given_name || profile.email.split('@')[0];
        const fallbackPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
        const [userResult] = await connection.query(
          'INSERT INTO users (name, email, password, userType, profileImage, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          [fallbackName, profile.email, fallbackPassword, 'patient', profile.picture || null, 1]
        );

        const userId = userResult.insertId;
        const patientCode = `PT-${String(userId).padStart(5, '0')}`;

        await connection.query(
          'INSERT INTO patient (userID, patientCode) VALUES (?, ?)',
          [userId, patientCode]
        );

        user = {
          userID: userId,
          name: fallbackName,
          email: profile.email,
          userType: 'patient'
        };

        await connection.commit();

        try {
          await sendWelcomeEmail({ email: profile.email, name: fallbackName, userType: 'patient' });
        } catch (emailError) {
          console.error('Google sign-in welcome email error:', emailError);
        }
      } else {
        if (profile.picture && !user.profileImage) {
          await connection.query('UPDATE users SET profileImage = ? WHERE userID = ?', [profile.picture, user.userID]);
        }

        await connection.commit();
      }

      const roleId = await getRoleIdForUser(user);
      const token = createAuthToken(user, roleId);

      try {
        await sendLoginEmail({ to: profile.email, name: user.name, userType: 'patient' });
      } catch (emailError) {
        console.error('Google login notification email error:', emailError);
      }

      return res.json({
        success: true,
        message: 'Google login successful',
        token,
        user: {
          _id: user.userID,
          userId: user.userID,
          id: user.userID,
          name: user.name,
          email: profile.email,
          userType: 'patient',
          role: 'patient',
          roleID: roleId
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   POST /api/auth/password-reset-request
// @desc    Send a reset link to the user's email
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.json({ success: true, message: 'If your email exists in our system, a reset link has been sent.' });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (userID, token, expiresAt, used) VALUES (?, ?, ?, 0)',
      [user.userID, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    try {
      await sendPasswordResetRequestEmail({ to: user.email, name: user.name, resetUrl });
    } catch (emailError) {
      console.error('Password reset request email error:', emailError);
    }

    res.json({ success: true, message: 'If your email exists in our system, a reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   POST /api/auth/password-reset
// @desc    Reset the user's password using a token
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expiresAt > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const resetRecord = rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('UPDATE users SET password = ? WHERE userID = ?', [hashedPassword, resetRecord.userID]);
      await connection.query('UPDATE password_reset_tokens SET used = 1 WHERE tokenID = ?', [resetRecord.tokenID]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [userRows] = await pool.query('SELECT * FROM users WHERE userID = ?', [resetRecord.userID]);
    if (userRows.length > 0) {
      try {
        await sendPasswordResetSuccessEmail({ to: userRows[0].email, name: userRows[0].name });
      } catch (emailError) {
        console.error('Password reset confirmation email error:', emailError);
      }
    }

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  createReceptionist,
  createAccountant,
  login,
  googleLogin,
  requestPasswordReset,
  resetPassword
};
