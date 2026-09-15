const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  checkInPatient,
  createWalkInAppointment,
  getReceptionistStats
} = require('../controllers/receptionistController');
const { getAdminAppointments } = require('../controllers/adminController');

// All receptionist endpoints require logged in token and receptionist/admin role
router.get('/appointments', verifyToken, requireRole(['admin', 'receptionist']), getAdminAppointments);
router.put('/check-in/:id', verifyToken, requireRole(['admin', 'receptionist']), checkInPatient);
router.post('/walkin', verifyToken, requireRole(['admin', 'receptionist']), createWalkInAppointment);
router.get('/stats', verifyToken, requireRole(['admin', 'receptionist']), getReceptionistStats);

module.exports = router;
