/**
 * OverrideLog Model — column definitions for the override_logs table.
 */

const APPROVAL_STATUSES = ['Approved', 'Rejected', 'Pending'];

const COLUMNS = [
  'id', 'vehicle_id', 'manager_id', 'reason',
  'approval_status', 'approved_by', 'created_at'
];

module.exports = {
  TABLE: 'override_logs',
  APPROVAL_STATUSES,
  COLUMNS
};
