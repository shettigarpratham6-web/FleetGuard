/**
 * ComplianceDocument Model — column definitions and constants for compliance_documents.
 */

const DOCUMENT_TYPES = ['Insurance', 'Inspection', 'PUC', 'Fitness Certificate'];
const DOCUMENT_STATUSES = ['Valid', 'Expired', 'Pending'];

const COLUMNS = [
  'id', 'vehicle_id', 'document_type', 'document_number',
  'issue_date', 'expiry_date', 'file_url', 'status',
  'uploaded_by', 'created_at'
];

module.exports = {
  TABLE: 'compliance_documents',
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  COLUMNS
};
