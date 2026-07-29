const db = require('../config/db');
const { recalculateMaintenanceRisk } = require('../services/riskService');

exports.getAllRisks = async (req, res, next) => {
  try {
    const { risk_level } = req.query;
    let queryText = `
      SELECT mr.*, v.vehicle_number, v.registration_number, v.manufacturer, v.model, b.branch_name
      FROM maintenance_risks mr
      JOIN vehicles v ON mr.vehicle_id = v.id
      JOIN branches b ON v.branch_id = b.id
    `;
    const params = [];
    const conditions = [];

    if (risk_level) {
      params.push(risk_level);
      conditions.push(`mr.risk_level = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY mr.remaining_distance ASC';

    const result = await db.query(queryText, params);
    res.status(200).json({ risks: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getRiskByVehicleId = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const queryText = `
      SELECT mr.*, v.vehicle_number, v.registration_number
      FROM maintenance_risks mr
      JOIN vehicles v ON mr.vehicle_id = v.id
      WHERE mr.vehicle_id = $1
    `;
    const result = await db.query(queryText, [vehicleId]);

    // If no risk record exists yet, dynamically calculate and return it
    if (result.rows.length === 0) {
      const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found.' });
      }
      
      const newRisk = await recalculateMaintenanceRisk(vehicleId);
      return res.status(200).json({ risk: newRisk });
    }

    res.status(200).json({ risk: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.triggerRecalculation = async (req, res, next) => {
  try {
    const { vehicle_id, recommended_interval } = req.body;

    if (vehicle_id) {
      // Recalculate for a single vehicle
      const risk = await recalculateMaintenanceRisk(vehicle_id, recommended_interval || 10000);
      return res.status(200).json({
        message: 'Maintenance risk calculated successfully',
        risk
      });
    } else {
      // Recalculate for all vehicles
      const vehiclesResult = await db.query('SELECT id FROM vehicles');
      const vehicles = vehiclesResult.rows;
      
      const results = [];
      for (const vehicle of vehicles) {
        const risk = await recalculateMaintenanceRisk(vehicle.id, recommended_interval || 10000);
        results.push(risk);
      }

      return res.status(200).json({
        message: `Maintenance risk calculated successfully for all ${vehicles.length} vehicles.`,
        risks: results
      });
    }
  } catch (error) {
    next(error);
  }
};
