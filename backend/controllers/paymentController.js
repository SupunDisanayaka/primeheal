const {
  createPayment,
  verifyPayment,
  handlePaymentNotification
} = require('../services/paymentService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const createPaymentController = async (req, res) => {
  try {
    const result = await createPayment({
      appointmentId: req.body.appointmentId,
      userID: req.user?.userID
    });

    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  } catch (error) {
    console.error('Create payment controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const verifyPaymentController = async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await verifyPayment({
      payload,
      userID: req.user?.userID
    });

    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  } catch (error) {
    console.error('Verify payment controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const paymentNotifyController = async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await handlePaymentNotification(payload);

    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  } catch (error) {
    console.error('Payment notify controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const paymentSuccessController = async (req, res) => {
  try {
    const orderId = req.query.order_id || req.body?.order_id || '';
    return res.redirect(`${FRONTEND_URL}/my-appointments?status=success&order_id=${orderId}`);
  } catch (error) {
    console.error('Payment success redirect error:', error);
    return res.redirect(`${FRONTEND_URL}/my-appointments?status=error`);
  }
};

const paymentCancelController = async (req, res) => {
  try {
    const orderId = req.query.order_id || req.body?.order_id || '';
    return res.redirect(`${FRONTEND_URL}/my-appointments?status=cancelled&order_id=${orderId}`);
  } catch (error) {
    console.error('Payment cancel redirect error:', error);
    return res.redirect(`${FRONTEND_URL}/my-appointments?status=error`);
  }
};

module.exports = {
  createPaymentController,
  verifyPaymentController,
  paymentNotifyController,
  paymentSuccessController,
  paymentCancelController
};