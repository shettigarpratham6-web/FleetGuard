/**
 * Mileage Service — handles vehicle mileage tracking and updates.
 */
const db = require('../config/db');

/**
 * Update vehicle current mileage if the new mileage is higher.
 * @param {string} vehicleId
 * @param {number} newMileage
 * @returns {object|null} Updated vehicle or null if no update needed
 */
const updateVehicleMileageIfHigher = async (vehicleId, newMileage) => {
  const result = await db.query(
    `UPDATE vehicles
     SET current_mileage = $1
     WHERE id = $2 AND current_mileage < $1
     RETURNING id, vehicle_number, current_mileage`,
    [newMileage, vehicleId]
  );
  return result.rows[0] || null;
};

/**
 * Get the mileage at the last recorded service for a vehicle.
 * @param {string} vehicleId
 * @returns {number} Last service mileage (0 if no records)
 */
const getLastServiceMileage = async (vehicleId) => {
  const result = await db.query(
    `SELECT current_mileage
     FROM service_records
     WHERE vehicle_id = $1
     ORDER BY service_date DESC, current_mileage DESC, created_at DESC
     LIMIT 1`,
    [vehicleId]
  );
  return result.rows.length > 0 ? result.rows[0].current_mileage : 0;
};

/**
 * Get current mileage for a vehicle.
 * @param {string} vehicleId
 * @returns {number}
 */
const getCurrentMileage = async (vehicleId) => {
  const result = await db.query('SELECT current_mileage FROM vehicles WHERE id = $1', [vehicleId]);
  return result.rows.length > 0 ? result.rows[0].current_mileage : 0;
};

/**
 * Calculate distance driven since last service.
 * @param {string} vehicleId
 * @returns {number}
 */
const getDistanceSinceLastService = async (vehicleId) => {
  const [current, lastService] = await Promise.all([
    getCurrentMileage(vehicleId),
    getLastServiceMileage(vehicleId)
  ]);
  return Math.max(0, current - lastService);
};

/**
 * Get mileage statistics for a vehicle.
 * @param {string} vehicleId
 * @returns {object}
 */
const getMileageStats = async (vehicleId) => {
  const current = await getCurrentMileage(vehicleId);
  const lastService = await getLastServiceMileage(vehicleId);
  const distanceSinceService = Math.max(0, current - lastService);

  // Fetch total service count
  const serviceCountResult = await db.query(
    'SELECT COUNT(*) FROM service_records WHERE vehicle_id = $1',
    [vehicleId]
  );
  const totalServices = parseInt(serviceCountResult.rows[0].count, 10);

  return {
    vehicle_id: vehicleId,
    current_mileage: current,
    last_service_mileage: lastService,
    distance_since_last_service: distanceSinceService,
    total_service_records: totalServices
  };
};

module.exports = {
  updateVehicleMileageIfHigher,
  getLastServiceMileage,
  getCurrentMileage,
  getDistanceSinceLastService,
  getMileageStats
};
