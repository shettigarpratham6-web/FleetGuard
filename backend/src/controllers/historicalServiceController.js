const db = require('../config/db');

exports.createHistoricalService = async (req, res, next) => {
  try {
    const { vehicle_id, service_date, mileage, description, remarks } = req.body;
    const entered_by = req.user.id;

    if (!vehicle_id || !service_date) {
      return res.status(400).json({ error: 'Vehicle ID and service date are required.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid vehicle ID. Vehicle does not exist.' });
    }

    const queryText = `
      INSERT INTO historical_services (
        vehicle_id, service_date, mileage, description, entered_by, remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_id,
      service_date,
      mileage ? parseInt(mileage, 10) : null,
      description || null,
      entered_by,
      remarks || null
    ]);

    res.status(201).json({
      message: 'Historical service record logged successfully',
      record: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23514') {
      if (error.message && error.message.includes('mileage')) {
        return res.status(400).json({ error: 'Historical mileage cannot be negative.' });
      }
    }
    next(error);
  }
};

exports.getHistoricalServicesByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const queryText = `
      SELECT hs.*, u.username as entered_by_username
      FROM historical_services hs
      LEFT JOIN users u ON hs.entered_by = u.id
      WHERE hs.vehicle_id = $1
      ORDER BY hs.service_date DESC, hs.created_at DESC
    `;

    const result = await db.query(queryText, [vehicleId]);
    res.status(200).json({ records: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getAllHistoricalServices = async (req, res, next) => {
  try {
    const queryText = `
      SELECT hs.*, u.username as entered_by_username, v.vehicle_number, v.model, v.manufacturer
      FROM historical_services hs
      LEFT JOIN users u ON hs.entered_by = u.id
      LEFT JOIN vehicles v ON hs.vehicle_id = v.id
      ORDER BY hs.service_date DESC, hs.created_at DESC
    `;

    const result = await db.query(queryText);
    res.status(200).json({ records: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.deleteHistoricalService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM historical_services WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Historical service record not found.' });
    }

    res.status(200).json({
      message: 'Historical service record deleted successfully',
      record: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
