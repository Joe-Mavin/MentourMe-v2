const express = require('express');
const router = express.Router();
const { searchUsers, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

// Search users
router.get('/search', searchUsers);

// Get user profile
router.get('/:userId', getUserProfile);

// Update user profile
router.put('/:userId', updateUserProfile);

module.exports = router;
