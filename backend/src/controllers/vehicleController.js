const db = require('../config/db');

exports.createVehicle = async (req, res, next) => {
  try {
    const {
      vehicle_number,
      registration_number,
      vehicle_type,
      manufacturer,
      model,
      manufacturing_year,
      fuel_type,
      current_mileage,
      purchase_date,
      branch_id,
      status
    } = req.body;

    if (!vehicle_number || !registration_number || !branch_id) {
      return res.status(400).json({ error: 'Vehicle number, registration number, and branch ID are required.' });
    }

    // Verify branch exists first
    const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1', [branch_id]);
    if (branchCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid branch ID. Branch does not exist.' });
    }

    const queryText = `
      INSERT INTO vehicles (
        vehicle_number, registration_number, vehicle_type, manufacturer, model,
        manufacturing_year, fuel_type, current_mileage, purchase_date, branch_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_number,
      registration_number,
      vehicle_type,
      manufacturer,
      model,
      manufacturing_year ? parseInt(manufacturing_year, 10) : null,
      fuel_type,
      current_mileage ? parseInt(current_mileage, 10) : 0,
      purchase_date || null,
      branch_id,
      status || 'Available'
    ]);

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      if (error.detail && error.detail.includes('vehicle_number')) {
        return res.status(400).json({ error: 'A vehicle with this vehicle number already exists.' });
      }
      if (error.detail && error.detail.includes('registration_number')) {
        return res.status(400).json({ error: 'A vehicle with this registration number already exists.' });
      }
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('check_vehicle_mileage')) {
        return res.status(400).json({ error: 'Vehicle mileage cannot be negative.' });
      }
      if (error.message && error.message.includes('check_manufacturing_year')) {
        return res.status(400).json({ error: 'Manufacturing year must be between 1900 and the current year.' });
      }
    }
    next(error);
  }
};

exports.getAllVehicles = async (req, res, next) => {
  try {
    const { branch_id, status, vehicle_type, search } = req.query;
    let queryText = `
      SELECT v.*, b.branch_name, b.city as branch_city
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id) {
      params.push(branch_id);
      conditions.push(`v.branch_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`v.status = $${params.length}`);
    }

    if (vehicle_type) {
      params.push(vehicle_type);
      conditions.push(`v.vehicle_type = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(v.vehicle_number ILIKE $${params.length} OR v.registration_number ILIKE $${params.length} OR v.manufacturer ILIKE $${params.length} OR v.model ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY v.created_at DESC';

    const result = await db.query(queryText, params);
    res.status(200).json({ vehicles: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get vehicle details
    const vehicleQuery = `
      SELECT v.*, b.branch_name, b.city as branch_city, b.manager_name as branch_manager
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
      WHERE v.id = $1
    `;
    const vehicleResult = await db.query(vehicleQuery, [id]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const vehicle = vehicleResult.rows[0];

    // Get associated compliance documents
    const docQuery = `
      SELECT cd.*, u.username as uploaded_by_username
      FROM compliance_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.vehicle_id = $1
      ORDER BY cd.expiry_date ASC
    `;
    const docResult = await db.query(docQuery, [id]);
    vehicle.compliance_documents = docResult.rows;

    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      vehicle_number,
      registration_number,
      vehicle_type,
      manufacturer,
      model,
      manufacturing_year,
      fuel_type,
      current_mileage,
      purchase_date,
      branch_id,
      status
    } = req.body;

    if (!vehicle_number || !registration_number || !branch_id) {
      return res.status(400).json({ error: 'Vehicle number, registration number, and branch ID are required.' });
    }

    // Verify branch exists
    const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1', [branch_id]);
    if (branchCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid branch ID. Branch does not exist.' });
    }

    const queryText = `
      UPDATE vehicles
      SET vehicle_number = $1, registration_number = $2, vehicle_type = $3, manufacturer = $4, model = $5,
          manufacturing_year = $6, fuel_type = $7, current_mileage = $8, purchase_date = $9, branch_id = $10, status = $11
      WHERE id = $12
      RETURNING *
    `;

    const result = await db.query(queryText, [
      vehicle_number,
      registration_number,
      vehicle_type,
      manufacturer,
      model,
      manufacturing_year ? parseInt(manufacturing_year, 10) : null,
      fuel_type,
      current_mileage ? parseInt(current_mileage, 10) : 0,
      purchase_date || null,
      branch_id,
      status || 'Available',
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      if (error.detail && error.detail.includes('vehicle_number')) {
        return res.status(400).json({ error: 'A vehicle with this vehicle number already exists.' });
      }
      if (error.detail && error.detail.includes('registration_number')) {
        return res.status(400).json({ error: 'A vehicle with this registration number already exists.' });
      }
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('check_vehicle_mileage')) {
        return res.status(400).json({ error: 'Vehicle mileage cannot be negative.' });
      }
      if (error.message && error.message.includes('check_manufacturing_year')) {
        return res.status(400).json({ error: 'Manufacturing year must be between 1900 and the current year.' });
      }
    }
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM vehicles WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json({
      message: 'Vehicle deleted successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
