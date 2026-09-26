import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin';
import db from '../config/db';
import env from '../config/env';

export interface AuthRequest extends Request {
  user?: any;
  firebaseUser?: any;
}

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token missing.' });
    }

    try {
      const secretKey = env.JWT_SECRET || 'supersecretkeyreplaceinproduction';
      const decoded = jwt.verify(token, secretKey) as any;

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
        } catch (dbErr: any) {
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

        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        return next();
      }
    } catch (jwtErr) {
    }

    try {
      let decodedToken: any;

      if (!admin.apps.length) {
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Authentication service configuration error.' });
        }

        decodedToken = jwt.decode(token);

        if (!decodedToken || (!decodedToken.uid && !decodedToken.user_id)) {
          return res.status(401).json({ error: 'Invalid authentication token format.' });
        }

        decodedToken.uid = decodedToken.uid || decodedToken.user_id;
      } else {
        decodedToken = await admin.auth().verifyIdToken(token);
      }

      req.firebaseUser = decodedToken;
      const userEmail = decodedToken.email || null;

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
          req.user = {
            firebase_uid: decodedToken.uid,
            email: userEmail,
            full_name: decodedToken.name || (userEmail ? userEmail.split('@')[0] : 'User'),
            profile_picture: decodedToken.picture || null,
            role: 'Driver',
            branch_id: null
          };
        }
      } catch (dbErr: any) {
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
    } catch (firebaseErr: any) {
      console.error('Firebase Auth Error:', firebaseErr.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
  } catch (error: any) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
    }

    next();
  };
};

export default { auth, authorize };
