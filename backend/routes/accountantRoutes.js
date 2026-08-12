const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  collectCounterPayment,
  issueRefund,
  getFinancialSummary
} = require('../controllers/accountantController');

// All accountant endpoints require logged in token and accountant/admin role
router.post('/collect-payment', verifyToken, requireRole(['admin', 'accountant']), collectCounterPayment);
router.post('/refund', verifyToken, requireRole(['admin', 'accountant']), issueRefund);
router.get('/financial-reports', verifyToken, requireRole(['admin', 'accountant']), getFinancialSummary);

module.exports = router;
