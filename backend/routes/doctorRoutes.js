const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById, addDoctor, updateDoctor, toggleAvailability, getDoctorSlots, updateAvailability } = require('../controllers/doctorController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { upload } = require('../controllers/userController');

// GET /api/doctors - Get all doctors (public)
router.get('/', getAllDoctors);

// GET /api/doctors/:id/slots - Get doctor slot availability (public)
router.get('/:id/slots', getDoctorSlots);

// GET /api/doctors/:id - Get single doctor (public)
router.get('/:id', getDoctorById);

// POST /api/doctors - Add new doctor (admin only)
router.post('/', verifyToken, requireRole(['admin']), upload.single('image'), addDoctor);

// PUT /api/doctors/:id - Update doctor profile
router.put('/:id', verifyToken, requireRole(['admin', 'doctor']), updateDoctor);

// PUT /api/doctors/:id/availability - Toggle availability
router.put('/:id/availability', verifyToken, requireRole(['admin', 'doctor']), toggleAvailability);

// POST /api/doctors/:id/availability - Save specific date availability slots
router.post('/:id/availability', verifyToken, requireRole(['admin', 'doctor']), updateAvailability);

module.exports = router;
