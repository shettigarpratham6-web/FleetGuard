/**
 * Auth Service — authentication business logic.
 * Handles user lookup, password validation, and token generation.
 */
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const JWT_SECRET = env.JWT_SECRET || 'supersecretkeyreplaceinproduction';
const JWT_EXPIRES_IN = '24h';

/**
 * Find a user by email (case-insensitive).
 * @param {string} email
 * @returns {object|null}
 */
const findUserByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by their UUID.
 * @param {string} id
 * @returns {object|null}
 */
const findUserById = async (id) => {
  const result = await db.query(
    'SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Hash a plaintext password.
 * @param {string} password
 * @returns {string} Bcrypt hash
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Sign a JWT token for a user.
 * @param {object} user - User object with id, email, role
 * @returns {string} JWT token
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Check whether an email is already registered.
 * @param {string} email
 * @returns {boolean}
 */
const isEmailTaken = async (email) => {
  const result = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
  return result.rows.length > 0;
};

module.exports = {
  findUserByEmail,
  findUserById,
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  isEmailTaken
};
