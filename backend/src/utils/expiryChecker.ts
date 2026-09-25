/**
 * Document expiry checking utilities.
 * Used by cron jobs and alert systems to identify expiring documents.
 */

import { daysUntilExpiry, isDocumentExpired } from './complianceCalculator';

/**
 * Alert threshold days — notifications are sent at these intervals before expiry.
 */
export const ALERT_THRESHOLDS_DAYS: number[] = [30, 10, 7, 5, 2];

export interface ExpiryCheckResult {
  shouldAlert: boolean;
  daysRemaining: number;
}

/**
 * Determine if a document should trigger an alert based on remaining days.
 */
export const checkExpiryAlert = (expiryDate: string | Date): ExpiryCheckResult => {
  const days = daysUntilExpiry(expiryDate);
  const shouldAlert = ALERT_THRESHOLDS_DAYS.includes(days) || days < 0;
  return { shouldAlert, daysRemaining: days };
};

/**
 * Filter an array of documents to those requiring alerts.
 */
export const getDocumentsRequiringAlerts = <T extends { expiry_date: string | Date }>(documents: T[] = []): Array<T & { days_remaining: number }> => {
  return documents
    .map((doc) => {
      const days = daysUntilExpiry(doc.expiry_date);
      return { ...doc, days_remaining: days };
    })
    .filter((doc) => ALERT_THRESHOLDS_DAYS.includes(doc.days_remaining) || doc.days_remaining < 0);
};

export interface CategorizedUrgency<T> {
  critical: Array<T & { days_remaining: number }>;
  warning: Array<T & { days_remaining: number }>;
  notice: Array<T & { days_remaining: number }>;
}

/**
 * Categorize documents by urgency level.
 */
export const categorizeByUrgency = <T extends { expiry_date: string | Date }>(documents: T[] = []): CategorizedUrgency<T> => {
  const critical: Array<T & { days_remaining: number }> = [];  // expired or <= 5 days
  const warning: Array<T & { days_remaining: number }> = [];   // 6-10 days
  const notice: Array<T & { days_remaining: number }> = [];    // 11-30 days

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
export const formatExpiryMessage = (
  documentType: string,
  vehicleNumber: string,
  expiryDate: string | Date,
  daysRemaining: number
): string => {
  if (daysRemaining < 0) {
    return `EXPIRED: ${documentType} for vehicle ${vehicleNumber} expired ${Math.abs(daysRemaining)} day(s) ago on ${new Date(expiryDate).toDateString()}.`;
  }
  return `${documentType} for vehicle ${vehicleNumber} will expire in ${daysRemaining} day(s) on ${new Date(expiryDate).toDateString()}.`;
};

export { isDocumentExpired, daysUntilExpiry };

export default {
  ALERT_THRESHOLDS_DAYS,
  checkExpiryAlert,
  getDocumentsRequiringAlerts,
  categorizeByUrgency,
  formatExpiryMessage,
  isDocumentExpired,
  daysUntilExpiry
};
