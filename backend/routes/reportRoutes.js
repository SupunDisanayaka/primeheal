const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  getAppointmentReports,
  getFinancialReports,
  getAuditLogs
} = require('../controllers/reportController');

// Appointment reports (Admin & Receptionist)
router.get('/appointments', verifyToken, requireRole(['admin', 'receptionist']), getAppointmentReports);

// Financial reports (Admin & Accountant)
router.get('/financial', verifyToken, requireRole(['admin', 'accountant']), getFinancialReports);

// Security & Audit Activity Logs (Admin only)
router.get('/audit-logs', verifyToken, requireRole(['admin']), getAuditLogs);

module.exports = router;
