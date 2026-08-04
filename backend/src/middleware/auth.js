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
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Authentication required. Token missing or invalid.' });
    }

    // Unverified payload decode to determine issuer/type
    const decodedUnverified = jwt.decode(token);

    // 1. Try Custom JWT Token first
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET || 'supersecretkeyreplaceinproduction');
      if (decoded && decoded.id) {
        const queryText = `
          SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
          FROM users
          WHERE id = $1
          LIMIT 1
        `;
        const result = await db.query(queryText, [decoded.id]);
        if (result.rows.length > 0) {
          req.user = result.rows[0];
          return next();
        } else {
          return res.status(401).json({ error: 'User account associated with this token no longer exists.' });
        }
      }
    } catch (jwtErr) {
      // Check if it's a backend custom JWT (has `id` in payload and not Google/Firebase issuer)
      const isFirebaseToken = decodedUnverified && (
        (decodedUnverified.iss && (decodedUnverified.iss.includes('google.com') || decodedUnverified.iss.includes('firebase'))) ||
        decodedUnverified.aud === env.FIREBASE_PROJECT_ID ||
        decodedUnverified.uid ||
        decodedUnverified.user_id
      );

      if (decodedUnverified && decodedUnverified.id && !isFirebaseToken) {
        return res.status(401).json({
          error: jwtErr.name === 'TokenExpiredError' 
            ? 'Authentication token has expired. Please log in again.' 
            : 'Invalid authentication token.'
        });
      }
    }

    // 2. Try Firebase ID Token fallback
    try {
      let decodedToken;
      
      if (!admin.apps.length) {
        // Firebase Admin is not initialized (likely missing service account key).
        // For development/demo, we can manually decode the JWT to get the user info.
        decodedToken = decodedUnverified;
        
        if (!decodedToken || (!decodedToken.uid && !decodedToken.user_id && !decodedToken.sub && !decodedToken.id)) {
          return res.status(401).json({ error: 'Invalid authentication token format.' });
        }
        
        // Normalize Firebase token fields
        decodedToken.uid = decodedToken.uid || decodedToken.user_id || decodedToken.sub || decodedToken.id;
      } else {
        decodedToken = await admin.auth().verifyIdToken(token);
      }
      
      req.firebaseUser = decodedToken;

      // Fetch matching user record from PostgreSQL
      const queryText = `
        SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
        FROM users
        WHERE firebase_uid = $1 OR email = $2
        LIMIT 1
      `;
      const result = await db.query(queryText, [decodedToken.uid, decodedToken.email]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      } else {
        // User is verified by Firebase but not yet synced in PostgreSQL
        req.user = {
          firebase_uid: decodedToken.uid,
          email: decodedToken.email,
          full_name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
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
    
    let effectiveRole = req.user.role;
    if (effectiveRole === 'Manager' && roles.includes('Fleet Manager')) {
      effectiveRole = 'Fleet Manager';
    }

    if (roles.length && !roles.includes(effectiveRole)) {
      return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { auth, authorize };
