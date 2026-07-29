const admin = require('../config/firebaseAdmin');
const db = require('../config/db');

/**
 * Authentication Middleware
 * Verifies Firebase ID Token passed in Authorization header (Bearer <token>)
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

    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;

    // Fetch matching user record from PostgreSQL
    const queryText = `
      SELECT id, firebase_uid, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
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
        full_name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        profile_picture: decodedToken.picture || null,
        role: 'Driver',
        branch_id: null
      };
    }

    next();
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
