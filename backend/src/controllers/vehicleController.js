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
      WITH latest_docs AS (
        SELECT DISTINCT ON (vehicle_id, document_type)
          vehicle_id,
          document_type,
          expiry_date
        FROM compliance_documents
        ORDER BY vehicle_id, document_type, expiry_date DESC
      ),
      vehicle_compliance AS (
        SELECT
          v.id AS vehicle_id,
          CASE
            WHEN COUNT(ld.document_type) FILTER (WHERE ld.document_type IN ('Insurance', 'PUC', 'Fitness Certificate')) < 3 THEN 'Non-Compliant'
            WHEN BOOL_OR(ld.document_type IN ('Insurance', 'PUC', 'Fitness Certificate') AND ld.expiry_date < CURRENT_DATE) THEN 'Non-Compliant'
            ELSE 'Compliant'
          END AS compliance_status
        FROM vehicles v
        LEFT JOIN latest_docs ld ON v.id = ld.vehicle_id
        GROUP BY v.id
      ),
      latest_service AS (
        SELECT DISTINCT ON (vehicle_id)
          *
        FROM service_records
        ORDER BY vehicle_id, service_date DESC, created_at DESC
      )
      SELECT 
        v.*, 
        b.branch_name, 
        b.city as branch_city,
        COALESCE(vc.compliance_status, 'Non-Compliant') AS compliance_status,
        COALESCE(mr.risk_level, 'Low') AS maintenance_status,
        ls.service_date AS last_service_date,
        ls.service_type AS last_service_type,
        ls.next_service_date AS next_service_date,
        ls.next_service_mileage AS next_service_mileage
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
      LEFT JOIN vehicle_compliance vc ON v.id = vc.vehicle_id
      LEFT JOIN maintenance_risks mr ON v.id = mr.vehicle_id
      LEFT JOIN latest_service ls ON v.id = ls.vehicle_id
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
    
    const vehicles = result.rows.map(row => {
      const {
        last_service_date,
        last_service_type,
        next_service_date,
        next_service_mileage,
        ...vehicleData
      } = row;
      
      return {
        ...vehicleData,
        latest_maintenance: last_service_date ? {
          service_date: last_service_date,
          service_type: last_service_type,
          next_service_date: next_service_date,
          next_service_mileage: next_service_mileage
        } : null
      };
    });

    res.status(200).json({ vehicles });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID format.' });
    }

    // Get vehicle details with compliance and maintenance status
    const vehicleQuery = `
      WITH latest_docs AS (
        SELECT DISTINCT ON (vehicle_id, document_type)
          vehicle_id,
          document_type,
          expiry_date
        FROM compliance_documents
        ORDER BY vehicle_id, document_type, expiry_date DESC
      ),
      vehicle_compliance AS (
        SELECT
          v.id AS vehicle_id,
          CASE
            WHEN COUNT(ld.document_type) FILTER (WHERE ld.document_type IN ('Insurance', 'PUC', 'Fitness Certificate')) < 3 THEN 'Non-Compliant'
            WHEN BOOL_OR(ld.document_type IN ('Insurance', 'PUC', 'Fitness Certificate') AND ld.expiry_date < CURRENT_DATE) THEN 'Non-Compliant'
            ELSE 'Compliant'
          END AS compliance_status
        FROM vehicles v
        LEFT JOIN latest_docs ld ON v.id = ld.vehicle_id
        GROUP BY v.id
      ),
      latest_service AS (
        SELECT DISTINCT ON (vehicle_id)
          *
        FROM service_records
        ORDER BY vehicle_id, service_date DESC, created_at DESC
      )
      SELECT 
        v.*, 
        b.branch_name, 
        b.city as branch_city, 
        b.manager_name as branch_manager,
        COALESCE(vc.compliance_status, 'Non-Compliant') AS compliance_status,
        COALESCE(mr.risk_level, 'Low') AS maintenance_status,
        ls.service_date AS last_service_date,
        ls.service_type AS last_service_type,
        ls.next_service_date AS next_service_date,
        ls.next_service_mileage AS next_service_mileage
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
      LEFT JOIN vehicle_compliance vc ON v.id = vc.vehicle_id
      LEFT JOIN maintenance_risks mr ON v.id = mr.vehicle_id
      LEFT JOIN latest_service ls ON v.id = ls.vehicle_id
      WHERE v.id = $1
    `;
    const vehicleResult = await db.query(vehicleQuery, [id]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const row = vehicleResult.rows[0];
    const {
      last_service_date,
      last_service_type,
      next_service_date,
      next_service_mileage,
      ...vehicleData
    } = row;

    const vehicle = {
      ...vehicleData,
      latest_maintenance: last_service_date ? {
        service_date: last_service_date,
        service_type: last_service_type,
        next_service_date: next_service_date,
        next_service_mileage: next_service_mileage
      } : null
    };

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
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Delete dependent records first to avoid foreign key violations
    // (Some have ON DELETE CASCADE, but this ensures all related data is safely removed)
    await client.query('DELETE FROM override_logs WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM checklists WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM assignments WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM notifications WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM maintenance_risks WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM historical_services WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM service_records WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM compliance_documents WHERE vehicle_id = $1', [id]);

    const queryText = 'DELETE FROM vehicles WHERE id = $1 RETURNING *';
    const result = await client.query(queryText, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Vehicle and all related records deleted successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, current_mileage } = req.body;

    let queryParts = [];
    let values = [];
    let count = 1;

    if (status) {
      queryParts.push(`status = $${count++}`);
      values.push(status);
    }
    if (current_mileage !== undefined) {
      queryParts.push(`current_mileage = GREATEST(current_mileage, $${count++})`);
      values.push(current_mileage);
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    values.push(id);
    const queryText = `
      UPDATE vehicles
      SET ${queryParts.join(', ')}
      WHERE id = $${count}
      RETURNING *
    `;

    const result = await db.query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.status(200).json({
      message: 'Vehicle status updated successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
