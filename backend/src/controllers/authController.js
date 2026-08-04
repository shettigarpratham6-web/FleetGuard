const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * POST /api/auth/register
 * Register a new user in PostgreSQL and return a JWT.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role, phone_number, profile_picture } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    // Check if email or username already exists
    const checkUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR (username = $2 AND username IS NOT NULL) LIMIT 1',
      [email.toLowerCase(), username || null]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default profile picture if none provided
    const finalProfilePicture = profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyNWRLx_E1OWgPi7aT-s7keymJamS_sAULSOKC77sBamBVVEH8asmCa3f4NYOaE3mG3geTNRGrCEk9EHHGtRbopLaZ52J0biD4pjdRExkF4tELoYtoq-zasE6so0CeaGSIAvvheeL2qrq5EGlYXYnXy2LFAAHWpIX7MRS7rUU0FgN3ulrekGF7ncrztv17tLcE_3HUrNuSMCnC1wGiBZ6Az6Q7ajamDg6nZkmfN3G0rW9Vloo_heFU';

    // Save to Postgres
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, full_name, role, phone_number, profile_picture, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, username, email, full_name, role, phone_number, profile_picture, created_at, updated_at
    `;
    
    const validRoles = ['Admin', 'Fleet Manager', 'Driver', 'Service Center', 'Manager', 'User'];
    const finalRole = role && validRoles.includes(role) ? role : 'Driver';
    const initialStatus = finalRole === 'Driver' ? 'Pending' : 'Active';

    // Forcefully fix the DB constraint just in case it wasn't updated on restart
    try {
      await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;`);
      await db.query(`ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('Active','Inactive','Pending','Rejected'));`);
    } catch (dbErr) {
      console.warn("Could not alter constraint on the fly:", dbErr);
    }

    const insertResult = await db.query(insertQuery, [
      username || null,
      email.toLowerCase(),
      passwordHash,
      full_name,
      finalRole,
      phone_number || null,
      finalProfilePicture,
      initialStatus
    ]);

    const user = insertResult.rows[0];

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET || 'supersecretkeyreplaceinproduction',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Log in using email and password and return a JWT.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await db.query(
      'SELECT id, username, email, password_hash, full_name, role, phone_number, profile_picture, status FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({ error: 'This user is registered via an external service (e.g. Firebase). Please log in using that service.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your account is pending approval from a Fleet Manager.' });
    }
    if (user.status === 'Rejected') {
      return res.status(403).json({ error: 'Your account application was rejected.' });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact support.' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET || 'supersecretkeyreplaceinproduction',
      { expiresIn: '24h' }
    );

    // Don't send back password_hash
    delete user.password_hash;

    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    next(error);
  }
};

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
exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const firebaseUid = req.user.firebase_uid || req.firebaseUser?.uid;
    const userId = req.user.id;
    const email = req.user.email || req.firebaseUser?.email;

    const queryText = `
      SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at
      FROM users
      WHERE firebase_uid = $1 OR id = $2 OR email = $3
      LIMIT 1
    `;
    const result = await db.query(queryText, [firebaseUid || null, userId || null, email || null]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    next(error);
  }
};

/**
 * GET /api/auth/users
 * Returns a list of all users, optionally filtered by role.
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    let queryText = 'SELECT id, username, email, full_name, role, phone_number, profile_picture, status, created_at FROM users';
    const params = [];
    const conditions = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await db.query(queryText, params);
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
};
