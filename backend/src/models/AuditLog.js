/**
 * AuditLog Model — column definitions for the audit_logs table.
 */

const AUDIT_ACTIONS = [
  'LOGIN', 'LOGOUT', 'REGISTER',
  'CREATE_VEHICLE', 'UPDATE_VEHICLE', 'DELETE_VEHICLE',
  'CREATE_COMPLIANCE', 'UPDATE_COMPLIANCE', 'DELETE_COMPLIANCE',
  'CREATE_SERVICE', 'UPDATE_SERVICE', 'DELETE_SERVICE',
  'CREATE_ASSIGNMENT', 'RETURN_VEHICLE', 'CANCEL_ASSIGNMENT',
  'CREATE_OVERRIDE', 'SUBMIT_CHECKLIST',
  'CREATE_BRANCH', 'UPDATE_BRANCH', 'DELETE_BRANCH',
  'CREATE_NOTIFICATION', 'DELETE_NOTIFICATION'
];

const ENTITY_TYPES = [
  'user', 'vehicle', 'compliance_document', 'service_record',
  'assignment', 'override_log', 'checklist', 'notification', 'branch'
];

const COLUMNS = [
  'id', 'user_id', 'action', 'entity_type',
  'entity_id', 'details', 'ip_address', 'created_at'
];

module.exports = {
  TABLE: 'audit_logs',
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  COLUMNS
};
