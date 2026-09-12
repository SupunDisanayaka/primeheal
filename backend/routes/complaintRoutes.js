const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  submitComplaint,
  getMyComplaints,
  getAllComplaintsAdmin,
  updateComplaintStatus
} = require('../controllers/complaintController');

// Patient endpoints (any authenticated user)
router.post('/submit', verifyToken, submitComplaint);
router.post('/', verifyToken, submitComplaint);
router.get('/my', verifyToken, getMyComplaints);

// Admin endpoints (admin role)
router.get('/admin/all', verifyToken, requireRole(['admin']), getAllComplaintsAdmin);
router.put('/admin/:complaintId', verifyToken, requireRole(['admin']), updateComplaintStatus);

module.exports = router;
