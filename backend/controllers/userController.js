const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendPasswordResetSuccessEmail } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const getAuthenticatedUserId = (req) => {
  if (!req.user) {
    return null;
  }
  return req.user.userID || req.user.userId || req.user.id || null;
};

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.userID}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp, gif) are allowed!'));
  }
});

// Profile image upload controller
const uploadProfileImage = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  if (!userID) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a photo' });
  }

  try {
    const relativePath = `/uploads/profile/${req.file.filename}`;

    // Get old image to delete it
    const [userRows] = await pool.query('SELECT profileImage FROM users WHERE userID = ?', [userID]);
    if (userRows.length > 0 && userRows[0].profileImage) {
      const oldImg = userRows[0].profileImage;
      if (oldImg.startsWith('/uploads/')) {
        const fullOldPath = path.join(__dirname, '..', oldImg);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    }

    await pool.query('UPDATE users SET profileImage = ? WHERE userID = ?', [relativePath, userID]);

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profileImage: relativePath
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to upload photo', error: error.message });
  }
};

// Profile image delete controller
const deleteProfileImage = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  if (!userID) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [userRows] = await pool.query('SELECT profileImage FROM users WHERE userID = ?', [userID]);
    if (userRows.length > 0 && userRows[0].profileImage) {
      const oldImg = userRows[0].profileImage;
      if (oldImg.startsWith('/uploads/')) {
        const fullOldPath = path.join(__dirname, '..', oldImg);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    }

    await pool.query('UPDATE users SET profileImage = NULL WHERE userID = ?', [userID]);

    res.json({
      success: true,
      message: 'Profile photo removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to remove photo', error: error.message });
  }
};

// @route   GET /api/users/profile
// @desc    Get current user profile
const getProfile = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  const userType = req.user && (req.user.userType || req.user.role);

  if (!userID || !userType) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token payload' });
  }

  try {
    let query = '';
    
    if (userType === 'patient') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               p.patientID, p.dateOfBirth, p.gender, p.address, p.emergencyContact,
               p.allergies, p.patientCode, p.nic, p.country
        FROM users u
        LEFT JOIN patient p ON u.userID = p.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'doctor') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               d.doctorID, d.specialization, d.licenseNumber, d.qualifications, d.bio,
               d.consultationFee, d.averageRating, d.isAvailable, d.experience, d.addressLine1, d.addressLine2
        FROM users u
        LEFT JOIN doctor d ON u.userID = d.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'receptionist') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               r.receptionistID, r.shiftTime, r.department
        FROM users u
        LEFT JOIN receptionist r ON u.userID = r.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'accountant') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               a.accountantID, a.accountingLicense, a.department
        FROM users u
        LEFT JOIN accountant a ON u.userID = a.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'admin' || userType === 'superadmin') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               a.adminID, a.permissions, a.accessLevel
        FROM users u
        LEFT JOIN admin a ON u.userID = a.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'labstaff') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               l.labstaffID, l.labSection, l.certificateNumber
        FROM users u
        LEFT JOIN labstaff l ON u.userID = l.userID
        WHERE u.userID = ?
      `;
    } else {
      query = `SELECT userID, name, email, phone, profileImage, userType FROM users WHERE userID = ?`;
    }

    const [rows] = await pool.query(query, [userID]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, profile: rows[0] });

  } catch (error) {
    console.error('Profile API Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/users/profile
// @desc    Update current user profile
const updateProfile = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  const userType = req.user && (req.user.userType || req.user.role);
  const updates = req.body;

  if (!userID || !userType) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (updates.name || updates.phone || updates.profileImage) {
      const userUpdates = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.phone) userUpdates.phone = updates.phone;
      if (updates.profileImage) userUpdates.profileImage = updates.profileImage;
      
      if (Object.keys(userUpdates).length > 0) {
        const setString = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(userUpdates);
        await connection.query(`UPDATE users SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    }

    if (userType === 'patient') {
      const pUpdates = {};
      const allowedP = ['dateOfBirth', 'gender', 'address', 'emergencyContact', 'allergies', 'nic', 'country'];
      
      allowedP.forEach(key => {
        if (updates[key] !== undefined) pUpdates[key] = updates[key];
      });

      if (Object.keys(pUpdates).length > 0) {
        const setString = Object.keys(pUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(pUpdates);
        await connection.query(`UPDATE patient SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    } else if (userType === 'doctor') {
      const dUpdates = {};
      if (updates.fees !== undefined) dUpdates.consultationFee = updates.fees;
      if (updates.about !== undefined) dUpdates.bio = updates.about;
      if (updates.available !== undefined) dUpdates.isAvailable = updates.available ? 1 : 0;
      if (updates.speciality !== undefined) dUpdates.specialization = updates.speciality;
      if (updates.degree !== undefined) dUpdates.qualifications = updates.degree;
      if (updates.experience !== undefined) dUpdates.experience = updates.experience;
      if (updates.addressLine1 !== undefined) dUpdates.addressLine1 = updates.addressLine1;
      if (updates.addressLine2 !== undefined) dUpdates.addressLine2 = updates.addressLine2;
      
      if (updates.address) {
        if (updates.address.line1 !== undefined) dUpdates.addressLine1 = updates.address.line1;
        if (updates.address.line2 !== undefined) dUpdates.addressLine2 = updates.address.line2;
      }

      if (Object.keys(dUpdates).length > 0) {
        const setString = Object.keys(dUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(dUpdates);
        await connection.query(`UPDATE doctor SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    } else if (userType === 'labstaff') {
      const lUpdates = {};
      if (updates.labSection !== undefined) lUpdates.labSection = updates.labSection;
      if (updates.certificateNumber !== undefined) lUpdates.certificateNumber = updates.certificateNumber;

      if (Object.keys(lUpdates).length > 0) {
        const setString = Object.keys(lUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(lUpdates);
        await connection.query(`UPDATE labstaff SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    }

    await logAudit(connection, userID, 'UPDATE_PROFILE', req);

    await connection.commit();
    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const isStrongPassword = (pass) => {
  if (pass.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// @route   POST /api/users/change-password
// @desc    Change password verifying current password, new strength, history, and logging out other sessions
const changePassword = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!userID) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Please provide all password fields' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch user password hash
    const [users] = await connection.query('SELECT name, email, password FROM users WHERE userID = ?', [userID]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // 2. Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // 3. Password history check (prevent reuse)
    const [history] = await connection.query('SELECT passwordHash FROM password_history WHERE userID = ?', [userID]);
    for (const record of history) {
      const isHistoryMatch = await bcrypt.compare(newPassword, record.passwordHash);
      if (isHistoryMatch) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'You cannot reuse any of your past passwords' });
      }
    }

    // 4. Hash new password & update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and increment tokenVersion to log out other devices
    await connection.query(
      'UPDATE users SET password = ?, tokenVersion = tokenVersion + 1 WHERE userID = ?',
      [hashedPassword, userID]
    );

    // Save to history
    await connection.query(
      'INSERT INTO password_history (userID, passwordHash) VALUES (?, ?)',
      [userID, hashedPassword]
    );

    // Audit Log
    await logAudit(connection, userID, 'CHANGE_PASSWORD', req);

    await connection.commit();

    // Send email success notification
    try {
      await sendPasswordResetSuccessEmail({ to: user.email, name: user.name });
    } catch (emailError) {
      console.error('Password change email error:', emailError);
    }

    res.json({ success: true, message: 'Password changed successfully. Other sessions logged out.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

const logAudit = async (connection, userID, action, req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  await connection.query(
    'INSERT INTO audit_logs (userID, action, ipAddress, userAgent) VALUES (?, ?, ?, ?)',
    [userID, action, ip, userAgent]
  ).catch(err => console.error('Audit log error in userController:', err));
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage,
  upload
};
