const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  checkInPatient,
  createWalkInAppointment,
  getReceptionistStats,
  collectCounterPayment
} = require('../controllers/receptionistController');
const { getAdminAppointments } = require('../controllers/adminController');

// Receptionist & Accountant shared operations
router.get('/appointments', verifyToken, requireRole(['admin', 'receptionist', 'accountant']), getAdminAppointments);
router.post('/collect-payment', verifyToken, requireRole(['admin', 'receptionist', 'accountant']), collectCounterPayment);
router.put('/check-in/:id', verifyToken, requireRole(['admin', 'receptionist']), checkInPatient);
router.post('/walkin', verifyToken, requireRole(['admin', 'receptionist']), createWalkInAppointment);
router.get('/stats', verifyToken, requireRole(['admin', 'receptionist', 'accountant']), getReceptionistStats);

module.exports = router;
