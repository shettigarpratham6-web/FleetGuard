export const MANDATORY_DOCUMENT_TYPES: string[] = ['Insurance', 'Inspection', 'PUC', 'Fitness Certificate'];

export interface ComplianceDocumentInput {
  document_type: string;
  expiry_date: string | Date;
  [key: string]: any;
}

export interface ComplianceSummary {
  status: 'Compliant' | 'Non-Compliant';
  expired_count: number;
  missing_count: number;
  valid_count: number;
  expiring_soon_count: number;
  expired: Array<{ type: string; expiry_date: string | Date }>;
  missing: string[];
  valid: Array<{ type: string; expiry_date: string | Date; days_remaining: number }>;
  expiring_soon: Array<{ type: string; expiry_date: string | Date; days_remaining: number }>;
}

export const calculateComplianceStatus = (documents: ComplianceDocumentInput[] = []): ComplianceSummary => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestByType: Record<string, ComplianceDocumentInput> = {};
  for (const doc of documents) {
    const existing = latestByType[doc.document_type];
    if (!existing || new Date(doc.expiry_date) > new Date(existing.expiry_date)) {
      latestByType[doc.document_type] = doc;
    }
  }

  const expired: Array<{ type: string; expiry_date: string | Date }> = [];
  const missing: string[] = [];
  const valid: Array<{ type: string; expiry_date: string | Date; days_remaining: number }> = [];
  const expiringSoon: Array<{ type: string; expiry_date: string | Date; days_remaining: number }> = [];

  for (const type of MANDATORY_DOCUMENT_TYPES) {
    const doc = latestByType[type];
    if (!doc) {
      missing.push(type);
    } else {
      const expiryDate = new Date(doc.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        expired.push({ type, expiry_date: doc.expiry_date });
      } else {
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        valid.push({ type, expiry_date: doc.expiry_date, days_remaining: daysRemaining });
        if (daysRemaining <= 30) {
          expiringSoon.push({ type, expiry_date: doc.expiry_date, days_remaining: daysRemaining });
        }
      }
    }
  }

  const isCompliant = expired.length === 0 && missing.length === 0;

  return {
    status: isCompliant ? 'Compliant' : 'Non-Compliant',
    expired_count: expired.length,
    missing_count: missing.length,
    valid_count: valid.length,
    expiring_soon_count: expiringSoon.length,
    expired,
    missing,
    valid,
    expiring_soon: expiringSoon
  };
};

export const isDocumentExpired = (expiryDate: string | Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
};

export const daysUntilExpiry = (expiryDate: string | Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default {
  MANDATORY_DOCUMENT_TYPES,
  calculateComplianceStatus,
  isDocumentExpired,
  daysUntilExpiry
};
