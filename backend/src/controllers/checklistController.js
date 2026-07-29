const db = require('../config/db');

exports.createChecklist = async (req, res, next) => {
  try {
    const { vehicle_id, tyres_ok, brakes_ok, lights_ok, horn_ok, mirrors_ok, remarks, status } = req.body;
    const driver_id = req.user.id; // The logged-in user submitting this checklist

    if (!vehicle_id) {
      return res.status(400).json({ error: 'Vehicle ID is required.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const queryText = `
      INSERT INTO checklists (
        vehicle_id, driver_id, tyres_ok, brakes_ok, lights_ok, horn_ok, mirrors_ok, remarks, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_id,
      driver_id,
      tyres_ok !== undefined ? tyres_ok : true,
      brakes_ok !== undefined ? brakes_ok : true,
      lights_ok !== undefined ? lights_ok : true,
      horn_ok !== undefined ? horn_ok : true,
      mirrors_ok !== undefined ? mirrors_ok : true,
      remarks || null,
      status || 'Completed'
    ]);

    res.status(201).json({
      message: 'Daily checklist submitted successfully',
      checklist: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllChecklists = async (req, res, next) => {
  try {
    const queryText = `
      SELECT c.*, 
             v.vehicle_number, v.registration_number,
             u.full_name as driver_name, u.email as driver_email
      FROM checklists c
      JOIN vehicles v ON c.vehicle_id = v.id
      JOIN users u ON c.driver_id = u.id
      ORDER BY c.checklist_date DESC, c.id DESC
    `;
    const result = await db.query(queryText);
    res.status(200).json({ checklists: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getMyChecklists = async (req, res, next) => {
  try {
    const driver_id = req.user.id;
    const queryText = `
      SELECT c.*, 
             v.vehicle_number, v.registration_number
      FROM checklists c
      JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.driver_id = $1
      ORDER BY c.checklist_date DESC, c.id DESC
    `;
    const result = await db.query(queryText, [driver_id]);
    res.status(200).json({ checklists: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getChecklistsByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const queryText = `
      SELECT c.*, 
             u.full_name as driver_name, u.email as driver_email
      FROM checklists c
      JOIN users u ON c.driver_id = u.id
      WHERE c.vehicle_id = $1
      ORDER BY c.checklist_date DESC, c.id DESC
    `;
    const result = await db.query(queryText, [vehicleId]);
    res.status(200).json({ checklists: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getChecklistById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT c.*, 
             v.vehicle_number, v.registration_number,
             u.full_name as driver_name, u.email as driver_email
      FROM checklists c
      JOIN vehicles v ON c.vehicle_id = v.id
      JOIN users u ON c.driver_id = u.id
      WHERE c.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found.' });
    }

    res.status(200).json({ checklist: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
