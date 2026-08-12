const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  submitFeedback,
  getDoctorFeedback,
  getAllFeedbackAdmin,
  approveFeedback,
  toggleVisibility
} = require('../controllers/feedbackController');

// Patient submit feedback
router.post('/', verifyToken, submitFeedback);
router.post('/submit', verifyToken, submitFeedback);

// Get doctor feedback (public / authenticated)
router.get('/doctor/:id', getDoctorFeedback);
router.get('/doctor/by-id/:doctorId', getDoctorFeedback);

// Admin routes
router.get('/admin', verifyToken, requireRole(['admin', 'superadmin']), getAllFeedbackAdmin);
router.get('/all', verifyToken, requireRole(['admin', 'superadmin']), getAllFeedbackAdmin);

router.put('/approve/:id', verifyToken, requireRole(['admin', 'superadmin']), approveFeedback);
router.put('/visibility/:id', verifyToken, requireRole(['admin', 'superadmin']), toggleVisibility);

module.exports = router;
