export interface IAssignment {
  id?: string;
  vehicle_id: string;
  driver_id: string;
  assigned_by: string;
  assigned_date: string;
  return_date?: string;
  assignment_status: 'Active' | 'Completed' | 'Cancelled';
  override_used?: boolean;
  override_log_id?: string;
  created_at?: string;
}

export const TABLE = 'assignments';

export const ASSIGNMENT_STATUSES: ('Active' | 'Completed' | 'Cancelled')[] = ['Active', 'Completed', 'Cancelled'];

export const COLUMNS: string[] = [
  'id', 'vehicle_id', 'driver_id', 'assigned_by', 'assigned_date',
  'return_date', 'assignment_status', 'override_used', 'override_log_id', 'created_at'
];

export default {
  TABLE,
  ASSIGNMENT_STATUSES,
  COLUMNS
};
