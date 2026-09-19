/**
 * User Model — column definitions and query helpers for the users table.
 */

export interface IUser {
  id?: string;
  firebase_uid?: string;
  username: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  profile_picture?: string;
  role: 'Admin' | 'Fleet Manager' | 'Driver' | 'Service Center' | 'Manager' | 'User';
  branch_id?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export const TABLE = 'users';

export const USER_ROLES: ('Admin' | 'Fleet Manager' | 'Driver' | 'Service Center' | 'Manager' | 'User')[] = [
  'Admin', 'Fleet Manager', 'Driver', 'Service Center', 'Manager', 'User'
];

export const USER_STATUSES: ('Active' | 'Inactive')[] = ['Active', 'Inactive'];

export const PUBLIC_COLUMNS: string[] = [
  'id', 'firebase_uid', 'username', 'email', 'full_name',
  'phone_number', 'profile_picture', 'role', 'branch_id',
  'status', 'created_at', 'updated_at'
];

export const SAFE_SELECT: string = PUBLIC_COLUMNS.join(', ');

export default {
  TABLE,
  USER_ROLES,
  USER_STATUSES,
  PUBLIC_COLUMNS,
  SAFE_SELECT
};
