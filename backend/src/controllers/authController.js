const supabase = require('../config/supabase');

/**
 * POST /api/auth/sync
 * Syncs authenticated Firebase user with the Supabase PostgreSQL users table.
 * Creates a new user record if one does not exist, or updates existing profile details.
 * Firebase token verification is handled upstream in the auth middleware.
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

    // Valid roles for the application
    const validRoles = ['Admin', 'Fleet Manager', 'Driver', 'Service Center', 'Manager', 'User'];
    const finalRole      = role && validRoles.includes(role) ? role : null;
    const finalFullName  = full_name || firebaseUser.name || email.split('@')[0] || 'User';
    const finalPicture   = profile_picture || firebaseUser.picture || null;
    const finalBranchId  = branch_id || null;

    // Check if this Firebase UID or email already has a record
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .or(`firebase_uid.eq.${firebaseUid},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let user;

    if (existing) {
      // User exists → update profile fields (only non-null values overwrite existing)
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          firebase_uid:    firebaseUid,
          email:           email,
          full_name:       full_name       || existing.full_name,
          profile_picture: finalPicture    || existing.profile_picture,
          role:            finalRole       || existing.role,
          branch_id:       finalBranchId   ?? existing.branch_id,
          updated_at:      new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, firebase_uid, email, full_name, profile_picture, role, branch_id, created_at, updated_at')
        .single();

      if (updateError) throw updateError;
      user = updated;
    } else {
      // New user → insert record
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid:    firebaseUid,
          email:           email,
          full_name:       finalFullName,
          profile_picture: finalPicture,
          role:            finalRole || 'Driver',
          branch_id:       finalBranchId
        })
        .select('id, firebase_uid, email, full_name, profile_picture, role, branch_id, created_at, updated_at')
        .single();

      if (insertError) throw insertError;
      user = inserted;
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
 * Returns the authenticated user's profile from the Supabase users table.
 */
exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const firebaseUid = req.user.firebase_uid || req.firebaseUser?.uid;
    const userId      = req.user.id;
    const email       = req.user.email || req.firebaseUser?.email;

    // Build OR filter — at least one identifier must be present
    const orFilters = [
      firebaseUid ? `firebase_uid.eq.${firebaseUid}` : null,
      userId      ? `id.eq.${userId}`                : null,
      email       ? `email.eq.${email}`              : null
    ].filter(Boolean).join(',');

    if (!orFilters) {
      return res.status(400).json({ error: 'No valid user identifier available.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, firebase_uid, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at')
      .or(orFilters)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    next(error);
  }
};