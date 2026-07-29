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
    const targetUser = userCheck.rows[0];

    // Build standard premium notification template
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">FleetGuard 🚛</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Unified Fleet Compliance & Management</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 25px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hello <strong>${targetUser.full_name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">You have received a new administrative update on your FleetGuard account:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${title}</h3>
            <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">"${message}"</p>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">Please log in to your dashboard to view or resolve this notification.</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated system alert from FleetGuard. Please do not reply directly to this message.</p>
        </div>
      </div>
    `;

    // Send email asynchronously so API response time is not blocked
    sendEmail(targetUser.email, `[FleetGuard Alert] ${title}`, message, emailHtml).catch(err => {
      console.error('⚠️ Failed to send email alert:', err);
    });

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
