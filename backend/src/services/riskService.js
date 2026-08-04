const db = require('../config/db');

/**
 * Recalculates and upserts the maintenance risk record for a specific vehicle.
 * Enforces Phase 2 Change Request rules:
 * 1. Vehicles > 5 years old require inspection every 6 months / 7,500 km (instead of 12 months / 10,000 km).
 * 2. Tiered Alert Routing:
 *    - Medium Risk: Route alerts to Fleet Managers.
 *    - High Risk: Route urgent alerts to Admins, Fleet Managers, and Service Center Mechanics simultaneously.
 *
 * @param {string} vehicleId - The UUID of the vehicle.
 * @param {number} [customInterval] - Optional custom maintenance interval.
 */
const recalculateMaintenanceRisk = async (vehicleId, customInterval) => {
  try {
    // 1. Get vehicle details including manufacturing_year
    const vehicleResult = await db.query(
      'SELECT id, vehicle_number, registration_number, current_mileage, manufacturing_year FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      throw new Error(`Vehicle ${vehicleId} not found.`);
    }

    const vehicle = vehicleResult.rows[0];
    const currentMileage = vehicle.current_mileage || 0;
    const currentYear = new Date().getFullYear();
    const mYear = vehicle.manufacturing_year ? Number(vehicle.manufacturing_year) : null;
    const vehicleAge = mYear ? (currentYear - mYear) : 0;

    // Phase 2 Rule: Vehicles > 5 years old have stricter 7,500 km / 6-month interval
    const recommendedInterval = customInterval || (vehicleAge > 5 ? 7500 : 10000);

    // 2. Find the mileage at the last completed service
    const serviceResult = await db.query(
      'SELECT current_mileage FROM service_records WHERE vehicle_id = $1 ORDER BY service_date DESC, current_mileage DESC, created_at DESC LIMIT 1',
      [vehicleId]
    );

    const lastServiceMileage = serviceResult.rows.length > 0
      ? serviceResult.rows[0].current_mileage
      : 0;

    // 3. Compute remaining distance
    const distanceSinceLastService = currentMileage - lastServiceMileage;
    const remainingDistance = recommendedInterval - distanceSinceLastService;

    // 4. Determine risk level & Tiered summary
    let riskLevel = 'Low';
    let summary = '';

    if (remainingDistance < 0) {
      riskLevel = 'High';
      summary = `CRITICAL ALERT (High Risk): Vehicle ${vehicle.vehicle_number} (${vehicleAge > 5 ? 'Aged >5 yrs' : 'Standard'}) has exceeded recommended interval by ${Math.abs(remainingDistance)} km. Immediate service required.`;
    } else if (remainingDistance === 0) {
      riskLevel = 'High';
      summary = `CRITICAL ALERT (High Risk): Vehicle ${vehicle.vehicle_number} has reached its service threshold. Immediate service required.`;
    } else if (remainingDistance <= 1000) {
      riskLevel = 'Medium';
      summary = `WARNING (Medium Risk): Vehicle ${vehicle.vehicle_number} has ${remainingDistance} km remaining before recommended service. Schedule maintenance soon.`;
    } else {
      riskLevel = 'Low';
      summary = `NORMAL (Low Risk): Approximately ${remainingDistance} km remaining before next scheduled service.`;
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

    // 6. Tiered Alert Routing
    if (riskLevel === 'High' || riskLevel === 'Medium') {
      try {
        const targetRoles = riskLevel === 'High' 
          ? ['Admin', 'Fleet Manager', 'Manager', 'Service Center']
          : ['Fleet Manager', 'Manager'];

        const usersRes = await db.query(
          `SELECT id FROM users WHERE role = ANY($1::text[])`,
          [targetRoles]
        );

        for (const u of usersRes.rows) {
          await db.query(
            `INSERT INTO notifications (user_id, title, message, is_read, created_at)
             VALUES ($1, $2, $3, FALSE, NOW())`,
            [u.id, `Tiered Alert: ${riskLevel} Maintenance Risk - ${vehicle.vehicle_number}`, summary]
          );
        }
      } catch (alertErr) {
        console.warn('Tiered alert routing notice:', alertErr.message);
      }
    }

    return upsertResult.rows[0];
  } catch (error) {
    console.error(`Failed to recalculate maintenance risk for vehicle ${vehicleId}:`, error);
    throw error;
  }
};

module.exports = {
  recalculateMaintenanceRisk
};
