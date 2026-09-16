/**
 * Document expiry checking utilities.
 * Used by cron jobs and alert systems to identify expiring documents.
 */

const { daysUntilExpiry, isDocumentExpired } = require('./complianceCalculator');

/**
 * Alert threshold days — notifications are sent at these intervals before expiry.
 */
const ALERT_THRESHOLDS_DAYS = [30, 10, 7, 5, 2];

/**
 * Determine if a document should trigger an alert based on remaining days.
 * @param {string|Date} expiryDate
 * @returns {{ shouldAlert: boolean, daysRemaining: number }}
 */
const checkExpiryAlert = (expiryDate) => {
  const days = daysUntilExpiry(expiryDate);
  const shouldAlert = ALERT_THRESHOLDS_DAYS.includes(days) || days < 0;
  return { shouldAlert, daysRemaining: days };
};

/**
 * Filter an array of documents to those requiring alerts.
 * @param {Array} documents - Array of objects with an expiry_date field
 * @returns {Array} Documents that need alerts
 */
const getDocumentsRequiringAlerts = (documents = []) => {
  return documents
    .map((doc) => {
      const days = daysUntilExpiry(doc.expiry_date);
      return { ...doc, days_remaining: days };
    })
    .filter((doc) => ALERT_THRESHOLDS_DAYS.includes(doc.days_remaining) || doc.days_remaining < 0);
};

/**
 * Categorize documents by urgency level.
 * @param {Array} documents
 * @returns {{ critical: Array, warning: Array, notice: Array }}
 */
const categorizeByUrgency = (documents = []) => {
  const critical = [];  // expired or <= 5 days
  const warning = [];   // 6-10 days
  const notice = [];    // 11-30 days

  for (const doc of documents) {
    const days = daysUntilExpiry(doc.expiry_date);
    const enriched = { ...doc, days_remaining: days };

    if (days <= 5) {
      critical.push(enriched);
    } else if (days <= 10) {
      warning.push(enriched);
    } else if (days <= 30) {
      notice.push(enriched);
    }
  }

  return { critical, warning, notice };
};

/**
 * Format expiry alert message for a compliance document.
 */
const formatExpiryMessage = (documentType, vehicleNumber, expiryDate, daysRemaining) => {
  if (daysRemaining < 0) {
    return `EXPIRED: ${documentType} for vehicle ${vehicleNumber} expired ${Math.abs(daysRemaining)} day(s) ago on ${new Date(expiryDate).toDateString()}.`;
  }
  return `${documentType} for vehicle ${vehicleNumber} will expire in ${daysRemaining} day(s) on ${new Date(expiryDate).toDateString()}.`;
};

module.exports = {
  ALERT_THRESHOLDS_DAYS,
  checkExpiryAlert,
  getDocumentsRequiringAlerts,
  categorizeByUrgency,
  formatExpiryMessage,
  isDocumentExpired,
  daysUntilExpiry
};
