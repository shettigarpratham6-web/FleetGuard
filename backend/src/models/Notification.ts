/**
 * Notification Model — column definitions for the notifications table.
 */

export interface INotification {
  id?: string;
  user_id: string;
  vehicle_id?: string;
  title: string;
  message: string;
  notification_type: 'Compliance Alert' | 'Maintenance Alert' | 'Assignment' | 'General' | 'Alert';
  is_read?: boolean;
  created_at?: string;
}

export const TABLE = 'notifications';

export const NOTIFICATION_TYPES: ('Compliance Alert' | 'Maintenance Alert' | 'Assignment' | 'General' | 'Alert')[] = [
  'Compliance Alert', 'Maintenance Alert', 'Assignment', 'General', 'Alert'
];

export const COLUMNS: string[] = [
  'id', 'user_id', 'vehicle_id', 'title', 'message',
  'notification_type', 'is_read', 'created_at'
];

export default {
  TABLE,
  NOTIFICATION_TYPES,
  COLUMNS
};
