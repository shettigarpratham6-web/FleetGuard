const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

// Synchronize Firebase user with Supabase PostgreSQL users table
router.post('/sync', auth, authController.syncUser);

// Get current authenticated user profile
router.get('/me', auth, authController.getMe);

// Get all users (filtered by role)
router.get('/users', auth, authController.getUsers);

module.exports = router;
