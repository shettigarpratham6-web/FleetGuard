/**
 * User Model — column definitions and query helpers for the users table.
 */

const USER_ROLES = ['Admin', 'Fleet Manager', 'Driver', 'Service Center', 'Manager', 'User'];
const USER_STATUSES = ['Active', 'Inactive'];

const PUBLIC_COLUMNS = [
  'id', 'firebase_uid', 'username', 'email', 'full_name',
  'phone_number', 'profile_picture', 'role', 'branch_id',
  'status', 'created_at', 'updated_at'
];

const SAFE_SELECT = PUBLIC_COLUMNS.join(', ');

module.exports = {
  TABLE: 'users',
  USER_ROLES,
  USER_STATUSES,
  PUBLIC_COLUMNS,
  SAFE_SELECT
};
