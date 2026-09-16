const admin = require('../config/firebaseAdmin');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Authentication Middleware
 * Verifies custom JWT or Firebase ID Token passed in Authorization header (Bearer <token>)
 * Attaches decoded user data and synced PostgreSQL user record to req.user
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token missing.' });
    }

    // 1. Try Custom JWT Token first
    // Inside backend/src/middleware/auth.js
    try {
      const secretKey = env.JWT_SECRET || 'supersecretkeyreplaceinproduction';
      const decoded = jwt.verify(token, secretKey);

      if (decoded && decoded.id) {
        try {
          const queryText = `
            SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
            FROM users
            WHERE id::text = $1::text OR email = $2
            LIMIT 1
          `;
          const result = await db.query(queryText, [String(decoded.id), decoded.email || null]);
          if (result.rows.length > 0) {
            req.user = result.rows[0];
            return next();
          }
        } catch (dbErr) {
          console.warn('⚠️ Database query failed during token verification, using decoded token as fallback:', dbErr.message);
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            full_name: decoded.email ? decoded.email.split('@')[0] : 'Demo User',
            status: 'Active'
          };
          return next();
        }

        // Fallback if token has decoded info even if DB record wasn't found directly
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        return next();
      }
    } catch (jwtErr) {
      // If it's an invalid custom JWT, proceed to try Firebase verification
    }

    // 2. Try Firebase ID Token fallback
    try {
      let decodedToken;

      if (!admin.apps.length) {
        // Firebase Admin is not initialized
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Authentication service configuration error.' });
        }

        // Development fallback only
        decodedToken = jwt.decode(token);

        if (!decodedToken || (!decodedToken.uid && !decodedToken.user_id)) {
          return res.status(401).json({ error: 'Invalid authentication token format.' });
        }

        // Normalize Firebase token fields
        decodedToken.uid = decodedToken.uid || decodedToken.user_id;
      } else {
        decodedToken = await admin.auth().verifyIdToken(token);
      }

      req.firebaseUser = decodedToken;
      const userEmail = decodedToken.email || null;

      // Fetch matching user record from PostgreSQL
      try {
        const queryText = `
          SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
          FROM users
          WHERE firebase_uid = $1 OR (email IS NOT NULL AND email = $2)
          LIMIT 1
        `;
        const result = await db.query(queryText, [decodedToken.uid, userEmail]);

        if (result.rows.length > 0) {
          req.user = result.rows[0];
        } else {
          // User is verified by Firebase but not yet synced in PostgreSQL
          req.user = {
            firebase_uid: decodedToken.uid,
            email: userEmail,
            full_name: decodedToken.name || (userEmail ? userEmail.split('@')[0] : 'User'),
            profile_picture: decodedToken.picture || null,
            role: 'Driver',
            branch_id: null
          };
        }
      } catch (dbErr) {
        console.warn('⚠️ Database query failed during Firebase token verification, using decoded token as fallback:', dbErr.message);
        req.user = {
          firebase_uid: decodedToken.uid,
          email: userEmail,
          full_name: decodedToken.name || (userEmail ? userEmail.split('@')[0] : 'User'),
          profile_picture: decodedToken.picture || null,
          role: 'Driver',
          branch_id: null
        };
      }
      return next();
    } catch (firebaseErr) {
      console.error('Firebase Auth Error:', firebaseErr.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

/**
 * Authorization Middleware
 * Checks if req.user has one of the allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { auth, authorize };