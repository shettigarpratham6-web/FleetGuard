const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT id, username, email, full_name, phone_number, role, profile_picture, status, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }
    res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone_number, profile_picture } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           phone_number = COALESCE($2, phone_number), 
           profile_picture = COALESCE($3, profile_picture),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, full_name, phone_number, role, profile_picture, status`,
      [full_name, phone_number, profile_picture, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    res.status(200).json({ 
      message: 'Profile updated successfully',
      profile: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }

    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};