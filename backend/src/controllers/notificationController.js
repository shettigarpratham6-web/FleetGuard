const db = require('../config/db');
const { sendEmail } = require('../services/notificationService');

exports.createNotification = async (req, res, next) => {
  try {
    const { user_id, vehicle_id, title, message, notification_type } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ error: 'User ID, title, and message are required.' });
    }

    // Verify user exists and retrieve contact information
    const userCheck = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify vehicle exists if provided
    if (vehicle_id) {
      const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found.' });
      }
    }

    const queryText = `
      INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      user_id,
      vehicle_id || null,
      title,
      message,
      notification_type || 'Alert'
    ]);

    const createdNotification = result.rows[0];
    res.status(201).json({
      message: 'Notification created successfully',
      notification: createdNotification
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { is_read } = req.query;

    let queryText = `
      SELECT n.*, 
             v.vehicle_number, v.registration_number
      FROM notifications n
      LEFT JOIN vehicles v ON n.vehicle_id = v.id
      WHERE n.user_id = $1
    `;
    const params = [user_id];

    if (is_read !== undefined) {
      params.push(is_read === 'true');
      queryText += ` AND n.is_read = $2`;
    }

    queryText += ' ORDER BY n.created_at DESC';

    const result = await db.query(queryText, params);
    res.status(200).json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const queryText = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(queryText, [id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Notification marked as read successfully',
      notification: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const queryText = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(queryText, [id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
      notification: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
