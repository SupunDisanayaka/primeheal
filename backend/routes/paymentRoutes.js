const express = require('express');

const { verifyToken } = require('../middleware/auth');
const {
  createPaymentController,
  verifyPaymentController,
  paymentNotifyController,
  paymentSuccessController,
  paymentCancelController
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/create', verifyToken, createPaymentController);
router.post('/verify', verifyToken, verifyPaymentController);
router.post('/notify', paymentNotifyController);

router.get('/success', paymentSuccessController);
router.get('/cancel', paymentCancelController);

module.exports = router;