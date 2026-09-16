/**
 * Assignment Service — business logic for vehicle-driver assignments.
 * Extracted from assignmentController for reuse and testability.
 */
const db = require('../config/db');

/**
 * Get the active assignment for a vehicle.
 * @param {string} vehicleId
 * @returns {object|null}
 */
const getActiveAssignmentForVehicle = async (vehicleId) => {
  const result = await db.query(
    "SELECT * FROM assignments WHERE vehicle_id = $1 AND assignment_status = 'Active' LIMIT 1",
    [vehicleId]
  );
  return result.rows[0] || null;
};

/**
 * Get the active assignment for a driver.
 * @param {string} driverId
 * @returns {object|null}
 */
const getActiveAssignmentForDriver = async (driverId) => {
  const result = await db.query(
    "SELECT * FROM assignments WHERE driver_id = $1 AND assignment_status = 'Active' LIMIT 1",
    [driverId]
  );
  return result.rows[0] || null;
};

/**
 * Complete (close) any active assignment for a vehicle.
 * @param {string} vehicleId
 */
const closeActiveAssignment = async (vehicleId) => {
  await db.query(
    "UPDATE assignments SET assignment_status = 'Completed', return_date = NOW() WHERE vehicle_id = $1 AND assignment_status = 'Active'",
    [vehicleId]
  );
};

/**
 * Get assignment history for a vehicle.
 * @param {string} vehicleId
 * @returns {Array}
 */
const getAssignmentHistory = async (vehicleId) => {
  const result = await db.query(
    `SELECT a.*,
            u.full_name AS driver_name, u.email AS driver_email,
            m.full_name AS assigned_by_name
     FROM assignments a
     JOIN users u ON a.driver_id = u.id
     JOIN users m ON a.assigned_by = m.id
     WHERE a.vehicle_id = $1
     ORDER BY COALESCE(a.assigned_date, a.created_at, NOW()) DESC`,
    [vehicleId]
  );
  return result.rows;
};

module.exports = {
  getActiveAssignmentForVehicle,
  getActiveAssignmentForDriver,
  closeActiveAssignment,
  getAssignmentHistory
};
