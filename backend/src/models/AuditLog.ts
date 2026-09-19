/**
 * AuditLog Model — column definitions for the audit_logs table.
 */

export interface IAuditLog {
  id?: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  created_at?: string;
}

export const TABLE = 'audit_logs';

export const AUDIT_ACTIONS: string[] = [
  'LOGIN', 'LOGOUT', 'REGISTER',
  'CREATE_VEHICLE', 'UPDATE_VEHICLE', 'DELETE_VEHICLE',
  'CREATE_COMPLIANCE', 'UPDATE_COMPLIANCE', 'DELETE_COMPLIANCE',
  'CREATE_SERVICE', 'UPDATE_SERVICE', 'DELETE_SERVICE',
  'CREATE_ASSIGNMENT', 'RETURN_VEHICLE', 'CANCEL_ASSIGNMENT',
  'CREATE_OVERRIDE', 'SUBMIT_CHECKLIST',
  'CREATE_BRANCH', 'UPDATE_BRANCH', 'DELETE_BRANCH',
  'CREATE_NOTIFICATION', 'DELETE_NOTIFICATION'
];

export const ENTITY_TYPES: string[] = [
  'user', 'vehicle', 'compliance_document', 'service_record',
  'assignment', 'override_log', 'checklist', 'notification', 'branch'
];

export const COLUMNS: string[] = [
  'id', 'user_id', 'action', 'entity_type',
  'entity_id', 'details', 'ip_address', 'created_at'
];

export default {
  TABLE,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  COLUMNS
};
