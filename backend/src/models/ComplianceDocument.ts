/**
 * ComplianceDocument Model — column definitions and constants for compliance_documents.
 */

export interface IComplianceDocument {
  id?: string;
  vehicle_id: string;
  document_type: 'Insurance' | 'Inspection' | 'PUC' | 'Fitness Certificate';
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  file_url?: string;
  status: 'Valid' | 'Expired' | 'Pending';
  uploaded_by?: string;
  created_at?: string;
}

export const TABLE = 'compliance_documents';

export const DOCUMENT_TYPES: ('Insurance' | 'Inspection' | 'PUC' | 'Fitness Certificate')[] = [
  'Insurance', 'Inspection', 'PUC', 'Fitness Certificate'
];

export const DOCUMENT_STATUSES: ('Valid' | 'Expired' | 'Pending')[] = ['Valid', 'Expired', 'Pending'];

export const COLUMNS: string[] = [
  'id', 'vehicle_id', 'document_type', 'document_number',
  'issue_date', 'expiry_date', 'file_url', 'status',
  'uploaded_by', 'created_at'
];

export default {
  TABLE,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  COLUMNS
};
