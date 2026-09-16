/**
 * Assignment Model — column definitions and constants for the assignments table.
 */

const ASSIGNMENT_STATUSES = ['Active', 'Completed', 'Cancelled'];

const COLUMNS = [
  'id', 'vehicle_id', 'driver_id', 'assigned_by', 'assigned_date',
  'return_date', 'assignment_status', 'override_used', 'override_log_id', 'created_at'
];

module.exports = {
  TABLE: 'assignments',
  ASSIGNMENT_STATUSES,
  COLUMNS
};
