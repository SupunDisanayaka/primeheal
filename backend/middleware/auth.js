const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userID = decoded.userID || decoded.userId || decoded.id;

    // Check user state in database
    const [rows] = await pool.query('SELECT isActive, tokenVersion FROM users WHERE userID = ?', [userID]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }

    const dbUser = rows[0];
    if (!dbUser.isActive) {
      return res.status(401).json({ success: false, message: 'User account has been deactivated' });
    }

    const tokenVersion = decoded.tokenVersion || 1;
    if (dbUser.tokenVersion !== undefined && dbUser.tokenVersion !== tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session has expired. Please login again.' });
    }

    req.user = {
      ...decoded,
      userID,
      userId: userID,
      id: userID,
      userType: decoded.userType || decoded.role,
      role: decoded.role || decoded.userType
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

const { requireRole } = require('./roleGuard');

module.exports = { verifyToken, requireRole };
