const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createAppointment, getMyAppointments } = require('../controllers/appointmentController');

router.post('/create', verifyToken, createAppointment);
router.get('/my', verifyToken, getMyAppointments);

module.exports = router;
