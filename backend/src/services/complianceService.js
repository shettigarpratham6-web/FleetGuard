/**
 * Compliance Service — business logic for compliance document management.
 */
const db = require('../config/db');
const { calculateComplianceStatus, daysUntilExpiry } = require('../utils/complianceCalculator');

/**
 * Get all compliance documents for a vehicle.
 * @param {string} vehicleId
 * @returns {Array}
 */
const getDocumentsByVehicle = async (vehicleId) => {
  const result = await db.query(
    `SELECT cd.*, u.username AS uploaded_by_username
     FROM compliance_documents cd
     LEFT JOIN users u ON cd.uploaded_by = u.id
     WHERE cd.vehicle_id = $1
     ORDER BY cd.expiry_date ASC`,
    [vehicleId]
  );
  return result.rows;
};

/**
 * Get the compliance status summary for a vehicle.
 * @param {string} vehicleId
 * @returns {{ overall_status: string, expired: Array, missing: Array, valid: Array }}
 */
const getVehicleComplianceSummary = async (vehicleId) => {
  const documents = await getDocumentsByVehicle(vehicleId);
  const statusReport = calculateComplianceStatus(documents);
  return {
    vehicle_id: vehicleId,
    overall_status: statusReport.status,
    ...statusReport
  };
};

/**
 * Get all documents expiring within the given number of days across all vehicles.
 * @param {number} days
 * @returns {Array}
 */
const getExpiringDocuments = async (days = 30) => {
  const result = await db.query(
    `SELECT cd.*, v.vehicle_number, v.registration_number, u.email AS uploaded_by_email
     FROM compliance_documents cd
     JOIN vehicles v ON cd.vehicle_id = v.id
     LEFT JOIN users u ON cd.uploaded_by = u.id
     WHERE cd.expiry_date <= CURRENT_DATE + $1::INTEGER
       AND cd.expiry_date >= CURRENT_DATE
     ORDER BY cd.expiry_date ASC`,
    [days]
  );
  return result.rows.map((doc) => ({
    ...doc,
    days_remaining: daysUntilExpiry(doc.expiry_date)
  }));
};

/**
 * Get all expired documents.
 * @returns {Array}
 */
const getExpiredDocuments = async () => {
  const result = await db.query(
    `SELECT cd.*, v.vehicle_number, v.registration_number
     FROM compliance_documents cd
     JOIN vehicles v ON cd.vehicle_id = v.id
     WHERE cd.expiry_date < CURRENT_DATE
     ORDER BY cd.expiry_date ASC`
  );
  return result.rows.map((doc) => ({
    ...doc,
    days_expired: Math.abs(daysUntilExpiry(doc.expiry_date))
  }));
};

module.exports = {
  getDocumentsByVehicle,
  getVehicleComplianceSummary,
  getExpiringDocuments,
  getExpiredDocuments
};
