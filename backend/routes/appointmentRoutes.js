const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  downloadInvoice,
  updateDoctorNotes
} = require('../controllers/appointmentController');

router.post('/create', verifyToken, createAppointment);
router.get('/my', verifyToken, getMyAppointments);
router.patch('/:appointmentId/cancel', verifyToken, cancelAppointment);
router.patch('/:appointmentId/status', verifyToken, updateAppointmentStatus);
router.patch('/:appointmentId/reschedule', verifyToken, rescheduleAppointment);
router.patch('/:appointmentId/notes', verifyToken, updateDoctorNotes);
router.get('/:appointmentId/invoice', verifyToken, downloadInvoice);

module.exports = router;
