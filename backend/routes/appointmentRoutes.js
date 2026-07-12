const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createAppointment, getMyAppointments, cancelAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');

router.post('/create', verifyToken, createAppointment);
router.get('/my', verifyToken, getMyAppointments);
router.patch('/:appointmentId/cancel', verifyToken, cancelAppointment);
router.patch('/:appointmentId/status', verifyToken, updateAppointmentStatus);

module.exports = router;
