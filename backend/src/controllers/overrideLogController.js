const db = require('../config/db');

exports.createOverrideLog = async (req, res, next) => {
  try {
    const { vehicle_id, reason, approval_status } = req.body;
    const manager_id = req.user.id;

    if (!vehicle_id || !reason) {
      return res.status(400).json({ error: 'Vehicle ID and reason are required.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const queryText = `
      INSERT INTO override_logs (vehicle_id, manager_id, reason, approval_status, approved_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const status = approval_status || 'Approved';
    const approvedBy = status === 'Approved' ? manager_id : null;

    const result = await db.query(queryText, [
      vehicle_id,
      manager_id,
      reason,
      status,
      approvedBy
    ]);

    res.status(201).json({
      message: 'Override log created successfully',
      overrideLog: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Invalid approval status. Must be Approved, Rejected, or Pending.' });
    }
    next(error);
  }
};

exports.getAllOverrideLogs = async (req, res, next) => {
  try {
    const queryText = `
      SELECT ol.*, 
             v.vehicle_number, v.registration_number,
             m.full_name as manager_name,
             ab.full_name as approved_by_name
      FROM override_logs ol
      JOIN vehicles v ON ol.vehicle_id = v.id
      JOIN users m ON ol.manager_id = m.id
      LEFT JOIN users ab ON ol.approved_by = ab.id
      ORDER BY ol.created_at DESC
    `;
    const result = await db.query(queryText);
    res.status(200).json({ overrideLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getOverrideLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT ol.*, 
             v.vehicle_number, v.registration_number,
             m.full_name as manager_name,
             ab.full_name as approved_by_name
      FROM override_logs ol
      JOIN vehicles v ON ol.vehicle_id = v.id
      JOIN users m ON ol.manager_id = m.id
      LEFT JOIN users ab ON ol.approved_by = ab.id
      WHERE ol.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Override log not found.' });
    }

    res.status(200).json({ overrideLog: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
