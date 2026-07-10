const express = require('express');
const router = express.Router();
const { login, register, createReceptionist, createAccountant, googleLogin, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/register-receptionist
router.post('/register-receptionist', verifyToken, requireRole(['admin']), createReceptionist);

// POST /api/auth/register-accountant
router.post('/register-accountant', verifyToken, requireRole(['admin']), createAccountant);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /api/auth/password-reset-request
router.post('/password-reset-request', requestPasswordReset);

// POST /api/auth/password-reset
router.post('/password-reset', resetPassword);

module.exports = router;
