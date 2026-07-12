const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  getAdminAppointments,
  getAdminRecentAppointments,
  getAdminDashboard,
  getAdminStats
} = require('../controllers/adminController');
const { updateAppointmentStatus } = require('../controllers/appointmentController');

router.get('/appointments', verifyToken, requireRole(['admin']), getAdminAppointments);
router.get('/recent-appointments', verifyToken, requireRole(['admin']), getAdminRecentAppointments);
router.get('/dashboard', verifyToken, requireRole(['admin']), getAdminDashboard);
router.get('/stats', verifyToken, requireRole(['admin']), getAdminStats);
router.patch('/appointments/:appointmentId/status', verifyToken, requireRole(['admin']), updateAppointmentStatus);

module.exports = router;