const express = require('express');
const router = express.Router();
const { login, register, createReceptionist, createAccountant } = require('../controllers/authController');
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

module.exports = router;
