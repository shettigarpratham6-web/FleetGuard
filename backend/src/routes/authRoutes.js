const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Synchronize Firebase user with Supabase PostgreSQL users table
router.post('/sync', auth, authController.syncUser);

// Get current authenticated user profile
router.get('/me', auth, authController.getMe);

module.exports = router;
