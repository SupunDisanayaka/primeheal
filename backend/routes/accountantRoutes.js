const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  collectCounterPayment,
  issueRefund,
  getFinancialSummary,
  recreateInvoice,
  getAllInvoices
} = require('../controllers/accountantController');

// All accountant endpoints require logged in token and accountant/admin role
router.post('/collect-payment', verifyToken, requireRole(['admin', 'accountant']), collectCounterPayment);
router.post('/refund', verifyToken, requireRole(['admin', 'accountant']), issueRefund);
router.get('/financial-reports', verifyToken, requireRole(['admin', 'accountant']), getFinancialSummary);
router.post('/recreate-invoice', verifyToken, requireRole(['admin', 'accountant']), recreateInvoice);
router.get('/invoices', verifyToken, requireRole(['admin', 'accountant']), getAllInvoices);

module.exports = router;
