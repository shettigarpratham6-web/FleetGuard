const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.getProfile = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const queryText = `
      SELECT id, username, email, role, full_name, phone_number, profile_picture, status, created_at, updated_at 
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(queryText, [driverId]);

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
    const driverId = req.user.id;
    const { full_name, phone_number, profile_picture } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const queryText = `
      UPDATE users
      SET full_name = $1, phone_number = $2, profile_picture = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, username, email, role, full_name, phone_number, profile_picture, status, created_at, updated_at
    `;
    const result = await db.query(queryText, [
      full_name.trim(),
      phone_number ? phone_number.trim() : null,
      profile_picture ? profile_picture.trim() : null,
      driverId
    ]);

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
    const driverId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [driverId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE id = $2
    `, [newPasswordHash, driverId]);

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};