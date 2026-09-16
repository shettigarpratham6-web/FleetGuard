/**
 * Notification Model — column definitions for the notifications table.
 */

const NOTIFICATION_TYPES = [
  'Compliance Alert', 'Maintenance Alert', 'Assignment', 'General', 'Alert'
];

const COLUMNS = [
  'id', 'user_id', 'vehicle_id', 'title', 'message',
  'notification_type', 'is_read', 'created_at'
];

module.exports = {
  TABLE: 'notifications',
  NOTIFICATION_TYPES,
  COLUMNS
};
