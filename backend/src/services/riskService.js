const db = require('../config/db');

/**
 * Recalculates and upserts the maintenance risk record for a specific vehicle.
 * @param {string} vehicleId - The UUID of the vehicle.
 * @param {number} [customInterval] - Optional custom maintenance interval (default: 10000).
 */
const recalculateMaintenanceRisk = async (vehicleId, customInterval = 10000) => {
  try {
    // 1. Get vehicle details
    const vehicleResult = await db.query(
      'SELECT id, current_mileage FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      throw new Error(`Vehicle ${vehicleId} not found.`);
    }

    const vehicle = vehicleResult.rows[0];
    const currentMileage = vehicle.current_mileage;

    // 2. Find the mileage at the last completed service
    const serviceResult = await db.query(
      'SELECT current_mileage FROM service_records WHERE vehicle_id = $1 ORDER BY service_date DESC, current_mileage DESC, created_at DESC LIMIT 1',
      [vehicleId]
    );

    const lastServiceMileage = serviceResult.rows.length > 0
      ? serviceResult.rows[0].current_mileage
      : 0; // Default to 0 if no service records exist yet

    // 3. Compute remaining distance
    const recommendedInterval = customInterval;
    const distanceSinceLastService = currentMileage - lastServiceMileage;
    const remainingDistance = recommendedInterval - distanceSinceLastService;

    // 4. Determine risk level
    let riskLevel = 'Low';
    let summary = '';

    if (remainingDistance < 0) {
      riskLevel = 'High';
      summary = `High maintenance risk because the vehicle has exceeded its recommended service interval by ${Math.abs(remainingDistance)} km. Immediate servicing is recommended.`;

    } else if (remainingDistance === 0) {
      riskLevel = 'High';
      summary = `High maintenance risk because the vehicle has reached its recommended service interval. Immediate servicing is recommended.`;

    } else if (remainingDistance <= 1000) {
      riskLevel = 'Medium';
      summary = `Medium maintenance risk because only ${remainingDistance} km remain before the next scheduled service. Plan maintenance soon.`;

    } else {
      riskLevel = 'Low';
      summary = `Low maintenance risk because approximately ${remainingDistance} km remain before the next scheduled service. No immediate maintenance is required.`;
    }

    // 5. Upsert into maintenance_risks
    const upsertQuery = `
      INSERT INTO maintenance_risks (
        vehicle_id, current_mileage, last_service_mileage, recommended_interval, remaining_distance, risk_level, summary, last_updated
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (vehicle_id)
      DO UPDATE SET
        current_mileage = EXCLUDED.current_mileage,
        last_service_mileage = EXCLUDED.last_service_mileage,
        recommended_interval = EXCLUDED.recommended_interval,
        remaining_distance = EXCLUDED.remaining_distance,
        risk_level = EXCLUDED.risk_level,
        summary = EXCLUDED.summary,
        last_updated = NOW()
      RETURNING *
    `;

    const upsertResult = await db.query(upsertQuery, [
      vehicleId,
      currentMileage,
      lastServiceMileage,
      recommendedInterval,
      remainingDistance,
      riskLevel,
      summary
    ]);

    return upsertResult.rows[0];
  } catch (error) {
    console.error(`Failed to recalculate maintenance risk for vehicle ${vehicleId}:`, error);
    throw error;
  }
};

module.exports = {
  recalculateMaintenanceRisk
};
