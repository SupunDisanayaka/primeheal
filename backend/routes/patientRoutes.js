const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  getAllPatients,
  getPatientById,
  updatePatientByStaff,
  registerPatientIntake
} = require('../controllers/patientController');

// All patient endpoints require staff authentication
router.get('/', verifyToken, requireRole(['admin', 'receptionist']), getAllPatients);
router.get('/:id', verifyToken, requireRole(['admin', 'receptionist', 'doctor']), getPatientById);
router.put('/:id', verifyToken, requireRole(['admin', 'receptionist']), updatePatientByStaff);
router.post('/register', verifyToken, requireRole(['admin', 'receptionist']), registerPatientIntake);

module.exports = router;
