const db = require('../config/db');

/**
 * POST /api/auth/sync
 * Syncs authenticated Firebase user with Supabase PostgreSQL users table.
 * Creates a new user record if one does not exist, or updates existing profile details.
 */
exports.syncUser = async (req, res, next) => {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser || !firebaseUser.uid) {
      return res.status(401).json({ error: 'Invalid or missing Firebase user token.' });
    }

    const { full_name, profile_picture, role, branch_id } = req.body;

    const firebaseUid = firebaseUser.uid;
    const email = firebaseUser.email || req.body.email;

    if (!email) {
      return res.status(400).json({ error: 'User email is required for sync.' });
    }

    // Valid roles check
    const validRoles = ['Admin', 'Fleet Manager', 'Driver', 'Service Center', 'Manager', 'User'];
    const finalRole = role && validRoles.includes(role) ? role : null;
    const finalFullName = full_name || firebaseUser.name || email.split('@')[0] || 'User';
    const finalProfilePicture = profile_picture || firebaseUser.picture || null;
    const finalBranchId = branch_id || null;

    // Check if user exists by firebase_uid or email
    const existingUserQuery = 'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2 LIMIT 1';
    const existingResult = await db.query(existingUserQuery, [firebaseUid, email]);

    let user;

    if (existingResult.rows.length > 0) {
      // User exists -> Update profile
      const existingUser = existingResult.rows[0];
      const updateQuery = `
        UPDATE users
        SET 
          firebase_uid = $1,
          email = $2,
          full_name = COALESCE($3, full_name),
          profile_picture = COALESCE($4, profile_picture),
          role = COALESCE($5, role),
          branch_id = COALESCE($6, branch_id),
          updated_at = NOW()
        WHERE id = $7
        RETURNING id, firebase_uid, email, full_name, profile_picture, role, branch_id, created_at, updated_at
      `;
      const updateResult = await db.query(updateQuery, [
        firebaseUid,
        email,
        full_name || null,
        finalProfilePicture,
        finalRole,
        finalBranchId,
        existingUser.id
      ]);
      user = updateResult.rows[0];
    } else {
      // New user -> Insert record
      const insertQuery = `
        INSERT INTO users (firebase_uid, email, full_name, profile_picture, role, branch_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, firebase_uid, email, full_name, profile_picture, role, branch_id, created_at, updated_at
      `;
      const insertResult = await db.query(insertQuery, [
        firebaseUid,
        email,
        finalFullName,
        finalProfilePicture,
        finalRole || 'Driver',
        finalBranchId
      ]);
      user = insertResult.rows[0];
    }

    res.status(200).json({
      message: 'User profile synced successfully',
      user
    });
  } catch (error) {
    console.error('Error syncing user profile:', error);
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile from PostgreSQL database.
 */

