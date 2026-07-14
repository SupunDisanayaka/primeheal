const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage,
  upload
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', verifyToken, getProfile);

// PUT /api/users/profile
router.put('/profile', verifyToken, updateProfile);

// POST /api/users/change-password
router.post('/change-password', verifyToken, changePassword);

// POST /api/users/profile-image
router.post('/profile-image', verifyToken, upload.single('profileImage'), uploadProfileImage);

// DELETE /api/users/profile-image
router.delete('/profile-image', verifyToken, deleteProfileImage);

module.exports = router;
