const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Register a new user
router.post('/register', authController.register);
router.get('/register', (req, res) => res.json({ message: 'FleetGuard Auth Register API endpoint. Send a POST request with { username, email, password, full_name, role }.' }));

// Login a user
router.post('/login', authController.login);
router.get('/login', (req, res) => res.json({ message: 'FleetGuard Auth Login API endpoint. Send a POST request with { email, password } to log in.' }));

// Synchronize Firebase user with Supabase PostgreSQL users table
router.post('/sync', auth, authController.syncUser);

// Get current authenticated user profile
router.get('/me', auth, authController.getMe);

// Get all users (filtered by role)
router.get('/users', auth, authController.getUsers);

module.exports = router;
