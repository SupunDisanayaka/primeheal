const pool = require('../config/db');

const getAuthenticatedUserId = (req) => {
  if (!req.user) {
    return null;
  }

  return req.user.userID || req.user.userId || req.user.id || null;
};

// @route   GET /api/users/profile
// @desc    Get current user profile (patient, doctor, admin, etc.)
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
               p.allergies, p.patientCode
        FROM users u
        LEFT JOIN patient p ON u.userID = p.userID
        WHERE u.userID = ?
      `;
    } else if (userType === 'doctor') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               d.doctorID, d.specialization, d.licenseNumber, d.qualifications, d.bio,
               d.consultationFee, d.averageRating, d.isAvailable
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
    } else if (userType === 'admin') {
      query = `
        SELECT u.userID, u.name, u.email, u.phone, u.profileImage, u.userType,
               a.adminID, a.permissions, a.accessLevel
        FROM users u
        LEFT JOIN admin a ON u.userID = a.userID
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
    console.error('Profile API Error:', {
      userID,
      userType,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/users/profile
// @desc    Update current user profile
const updateProfile = async (req, res) => {
  const userID = getAuthenticatedUserId(req);
  const userType = req.user && (req.user.userType || req.user.role);
  const updates = req.body; // Depends on userType

  if (!userID || !userType) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token payload' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update basic user info if provided
    if (updates.name || updates.phone || updates.profileImage) {
      const userUpdates = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.phone) userUpdates.phone = updates.phone;
      if (updates.profileImage) userUpdates.profileImage = updates.profileImage;

      // Note: we don't update email here to avoid complexity with unique constraint, or we can handle it if needed
      
      if (Object.keys(userUpdates).length > 0) {
        const setString = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(userUpdates);
        await connection.query(`UPDATE users SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    }

    // 2. Update role-specific info
    if (userType === 'patient') {
      const pUpdates = {};
      const allowedP = ['dateOfBirth', 'gender', 'address', 'emergencyContact', 'allergies'];
      
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
      const allowedD = ['bio', 'consultationFee', 'isAvailable']; // Some fields like address usually are parsed to bio/custom field, we can use bio for now
      // Actually doctor has: specialization, qualifications, bio, consultationFee, isAvailable
      
      allowedD.forEach(key => {
        if (updates[key] !== undefined) dUpdates[key] = updates[key];
      });

      // Handle address1, address2 mapping from frontend profile to bio or separate table
      // Let's store address in bio as JSON for now or just append if needed.
      // Wait, frontend sends { fees, about, available, address: { line1, line2 } }
      if (updates.fees !== undefined) dUpdates.consultationFee = updates.fees;
      if (updates.about !== undefined) dUpdates.bio = updates.about;
      if (updates.available !== undefined) dUpdates.isAvailable = updates.available ? 1 : 0;
      
      // If address is provided, we can stringify it and store in bio, or we'd need to add address to doctor table.
      // For now, let's just update the known fields.

      if (Object.keys(dUpdates).length > 0) {
        const setString = Object.keys(dUpdates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(dUpdates);
        await connection.query(`UPDATE doctor SET ${setString} WHERE userID = ?`, [...values, userID]);
      }
    }

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

module.exports = {
  getProfile,
  updateProfile
};
