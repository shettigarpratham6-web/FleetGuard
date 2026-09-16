/**
 * Compliance status calculation helpers.
 * Determines vehicle compliance status based on its documents.
 */

const MANDATORY_DOCUMENT_TYPES = ['Insurance', 'Inspection', 'PUC', 'Fitness Certificate'];

/**
 * Calculate the overall compliance status given an array of compliance documents.
 * @param {Array} documents - Array of compliance document objects
 * @returns {{ status: string, summary: object }}
 */
const calculateComplianceStatus = (documents = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get latest document per type
  const latestByType = {};
  for (const doc of documents) {
    const existing = latestByType[doc.document_type];
    if (!existing || new Date(doc.expiry_date) > new Date(existing.expiry_date)) {
      latestByType[doc.document_type] = doc;
    }
  }

  const expired = [];
  const missing = [];
  const valid = [];
  const expiringSoon = []; // within 30 days

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
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        valid.push({ type, expiry_date: doc.expiry_date, days_remaining: daysUntilExpiry });
        if (daysUntilExpiry <= 30) {
          expiringSoon.push({ type, expiry_date: doc.expiry_date, days_remaining: daysUntilExpiry });
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

/**
 * Determine if a single document is currently expired.
 * @param {string|Date} expiryDate
 * @returns {boolean}
 */
const isDocumentExpired = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
};

/**
 * Calculate days remaining until expiry (negative if already expired).
 * @param {string|Date} expiryDate
 * @returns {number}
 */
const daysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

module.exports = {
  MANDATORY_DOCUMENT_TYPES,
  calculateComplianceStatus,
  isDocumentExpired,
  daysUntilExpiry
};
