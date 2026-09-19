/**
 * OverrideLog Model — column definitions for the override_logs table.
 */

export interface IOverrideLog {
  id?: string;
  vehicle_id: string;
  manager_id: string;
  reason: string;
  approval_status: 'Approved' | 'Rejected' | 'Pending';
  approved_by?: string;
  created_at?: string;
}

export const TABLE = 'override_logs';

export const APPROVAL_STATUSES: ('Approved' | 'Rejected' | 'Pending')[] = ['Approved', 'Rejected', 'Pending'];

export const COLUMNS: string[] = [
  'id', 'vehicle_id', 'manager_id', 'reason',
  'approval_status', 'approved_by', 'created_at'
];

export default {
  TABLE,
  APPROVAL_STATUSES,
  COLUMNS
};
