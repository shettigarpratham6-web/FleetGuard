const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { recalculateMaintenanceRisk } = require('../services/riskService');

const safeUnlinkFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete file at ${filePath}:`, err);
    }
  }
};

exports.createServiceRecord = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      mechanic_id,
      service_date,
      current_mileage,
      service_type,
      description,
      parts_changed,
      labour_cost,
      parts_cost,
      next_service_mileage,
      next_service_date
    } = req.body;

    if (!vehicle_id || !service_date || !current_mileage || !service_type) {
      if (req.file) {
        safeUnlinkFile(req.file.path);
      }
      return res.status(400).json({ error: 'Vehicle ID, service date, current mileage, and service type are required.' });
    }

    // 1. Verify vehicle exists and retrieve current mileage
    const vehicleCheck = await db.query('SELECT current_mileage FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      if (req.file) {
        safeUnlinkFile(req.file.path);
      }
      return res.status(400).json({ error: 'Invalid vehicle ID. Vehicle does not exist.' });
    }

    const vehicleMileage = vehicleCheck.rows[0].current_mileage;

    // 2. File upload processing
    const invoice_url = req.file ? `/uploads/${req.file.filename}` : null;

    // 3. Insert service record
    const queryText = `
      INSERT INTO service_records (
        vehicle_id, mechanic_id, service_date, current_mileage, service_type,
        description, parts_changed, labour_cost, parts_cost, invoice_url,
        next_service_mileage, next_service_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const parsedLabour = labour_cost ? parseFloat(labour_cost) : 0;
    const parsedParts = parts_cost ? parseFloat(parts_cost) : 0;
    const parsedMileage = parseInt(current_mileage, 10);

    const result = await db.query(queryText, [
      vehicle_id,
      mechanic_id || null,
      service_date,
      parsedMileage,
      service_type,
      description || null,
      parts_changed || null,
      parsedLabour,
      parsedParts,
      invoice_url,
      next_service_mileage ? parseInt(next_service_mileage, 10) : null,
      next_service_date || null
    ]);

    const serviceRecord = result.rows[0];

    // 4. If the service mileage is higher than vehicle's current mileage, update the vehicle
    if (parsedMileage > vehicleMileage) {
      await db.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [parsedMileage, vehicle_id]);
    }

    // 5. Recalculate Maintenance Risk
    await recalculateMaintenanceRisk(vehicle_id);

    res.status(201).json({
      message: 'Service record added successfully',
      record: serviceRecord
    });
  } catch (error) {
    if (req.file) {
      safeUnlinkFile(req.file.path);
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('current_mileage')) {
        return res.status(400).json({ error: 'Current mileage cannot be negative.' });
      }
      if (error.message && error.message.includes('labour_cost')) {
        return res.status(400).json({ error: 'Labour cost cannot be negative.' });
      }
      if (error.message && error.message.includes('parts_cost')) {
        return res.status(400).json({ error: 'Parts cost cannot be negative.' });
      }
      if (error.message && error.message.includes('next_service_mileage')) {
        return res.status(400).json({ error: 'Next service mileage must be greater than or equal to current service mileage.' });
      }
    }
    next(error);
  }
};

exports.getAllServiceRecords = async (req, res, next) => {
  try {
    const { vehicle_id, service_type } = req.query;
    let queryText = `
      SELECT sr.*, v.vehicle_number, v.registration_number, u.username as mechanic_name
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN users u ON sr.mechanic_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (vehicle_id) {
      params.push(vehicle_id);
      conditions.push(`sr.vehicle_id = $${params.length}`);
    }

    if (service_type) {
      params.push(`%${service_type}%`);
      conditions.push(`sr.service_type ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY sr.service_date DESC, sr.created_at DESC';

    const result = await db.query(queryText, params);
    res.status(200).json({ records: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getServiceRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT sr.*, v.vehicle_number, v.registration_number, u.username as mechanic_name
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN users u ON sr.mechanic_id = u.id
      WHERE sr.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service record not found.' });
    }

    res.status(200).json({ record: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateServiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      mechanic_id,
      service_date,
      current_mileage,
      service_type,
      description,
      parts_changed,
      labour_cost,
      parts_cost,
      next_service_mileage,
      next_service_date
    } = req.body;

    if (!service_date || !current_mileage || !service_type) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Service date, current mileage, and service type are required.' });
    }

    // Fetch existing record
    const existingResult = await db.query('SELECT vehicle_id, invoice_url FROM service_records WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Service record not found.' });
    }

    const oldRecord = existingResult.rows[0];
    const vehicle_id = oldRecord.vehicle_id;

    let invoice_url = oldRecord.invoice_url;
    if (req.file) {
      invoice_url = `/uploads/${req.file.filename}`;
      if (oldRecord.invoice_url) {
        const relativePath = oldRecord.invoice_url.startsWith('/') ? oldRecord.invoice_url.substring(1) : oldRecord.invoice_url;
        const oldFilePath = path.join(__dirname, '../..', relativePath);
        safeUnlinkFile(oldFilePath);
      }
    }

    const queryText = `
      UPDATE service_records
      SET mechanic_id = $1, service_date = $2, current_mileage = $3, service_type = $4,
          description = $5, parts_changed = $6, labour_cost = $7, parts_cost = $8,
          invoice_url = $9, next_service_mileage = $10, next_service_date = $11
      WHERE id = $12
      RETURNING *
    `;

    const parsedLabour = labour_cost ? parseFloat(labour_cost) : 0;
    const parsedParts = parts_cost ? parseFloat(parts_cost) : 0;
    const parsedMileage = parseInt(current_mileage, 10);

    const result = await db.query(queryText, [
      mechanic_id || null,
      service_date,
      parsedMileage,
      service_type,
      description || null,
      parts_changed || null,
      parsedLabour,
      parsedParts,
      invoice_url,
      next_service_mileage ? parseInt(next_service_mileage, 10) : null,
      next_service_date || null,
      id
    ]);

    const updatedRecord = result.rows[0];

    // Trigger update of mileage if higher
    const vehicleCheck = await db.query('SELECT current_mileage FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length > 0 && parsedMileage > vehicleCheck.rows[0].current_mileage) {
      await db.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [parsedMileage, vehicle_id]);
    }

    // Recalculate Maintenance Risk
    await recalculateMaintenanceRisk(vehicle_id);

    // Check if the updated next_service_date is exactly 10, 5, or 2 days from now
    try {
      if (updatedRecord.next_service_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDate = new Date(updatedRecord.next_service_date);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if ([10, 5, 2].includes(daysRemaining)) {
          const title = `Scheduled Maintenance in ${daysRemaining} Days`;
          const message = `Vehicle is due for ${updatedRecord.service_type || 'Routine Maintenance'} on ${nextDate.toLocaleDateString()} (${daysRemaining} days remaining). Please prepare the vehicle for maintenance.`;

          // 1. Fetch mechanic details
          const mechanicRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [updatedRecord.mechanic_id || req.user.id]);
          const mechanic = mechanicRes.rows[0];

          // 2. Fetch active driver for the vehicle
          const driverRes = await db.query(`
            SELECT u.id, u.email, u.full_name 
            FROM assignments a 
            JOIN users u ON a.driver_id = u.id 
            WHERE a.vehicle_id = $1 AND a.assignment_status = 'Active'
            LIMIT 1
          `, [updatedRecord.vehicle_id]);
          const driver = driverRes.rows[0];

          // 3. Fetch Admin/Manager details
          const adminRes = await db.query("SELECT id, email, full_name FROM users WHERE role = 'Admin' OR role = 'Fleet Manager'");
          const admins = adminRes.rows;

          // Insert in-app notifications
          const userIds = new Set();
          admins.forEach(a => userIds.add(a.id));
          if (mechanic) userIds.add(mechanic.id);
          if (driver) userIds.add(driver.id);

          for (const userId of userIds) {
            await db.query(`
              INSERT INTO notifications (user_id, vehicle_id, title, message, notification_type)
              VALUES ($1, $2, $3, $4, $5)
            `, [userId, updatedRecord.vehicle_id, title, message, 'Maintenance Alert']);
          }
          console.log(`[Service Update Alert] In-app notifications generated for ${daysRemaining} days remaining.`);
        }
      }
    } catch (err) {
      console.error('⚠️ Could not process instant alert on service record update:', err.message);
    }

    res.status(200).json({
      message: 'Service record updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    if (req.file) {
      safeUnlinkFile(req.file.path);
    }
    if (error.code === '23514') {
      if (error.message && error.message.includes('current_mileage')) {
        return res.status(400).json({ error: 'Current mileage cannot be negative.' });
      }
      if (error.message && error.message.includes('labour_cost')) {
        return res.status(400).json({ error: 'Labour cost cannot be negative.' });
      }
      if (error.message && error.message.includes('parts_cost')) {
        return res.status(400).json({ error: 'Parts cost cannot be negative.' });
      }
      if (error.message && error.message.includes('next_service_mileage')) {
        return res.status(400).json({ error: 'Next service mileage must be greater than or equal to current service mileage.' });
      }
    }
    next(error);
  }
};

exports.getVehicleServiceHistory = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    // Verify vehicle exists
    const vehicleResult = await db.query(
      `SELECT id, vehicle_number, registration_number, manufacturer, model
       FROM vehicles
       WHERE id = $1`,
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vehicle not found.'
      });
    }

    // Fetch complete service history
    const historyQuery = `
      SELECT
        sr.id,
        sr.service_date,
        sr.current_mileage,
        sr.service_type,
        sr.description,
        sr.parts_changed,
        sr.labour_cost,
        sr.parts_cost,
        sr.total_cost,
        sr.invoice_url,
        sr.next_service_mileage,
        sr.next_service_date,
        sr.created_at,
        sr.updated_at,

        u.username AS mechanic_name

      FROM service_records sr

      LEFT JOIN users u
        ON sr.mechanic_id = u.id

      WHERE sr.vehicle_id = $1

      ORDER BY
        sr.service_date DESC,
        sr.created_at DESC;
    `;

    const historyResult = await db.query(historyQuery, [vehicleId]);

    res.status(200).json({
      vehicle: vehicleResult.rows[0],
      total_records: historyResult.rows.length,
      history: historyResult.rows
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteServiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM service_records WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service record not found.' });
    }

    const deletedRecord = result.rows[0];
    const { vehicle_id, invoice_url } = deletedRecord;

    // Delete invoice file
    if (invoice_url) {
      const relativePath = invoice_url.startsWith('/') ? invoice_url.substring(1) : invoice_url;
      const filePath = path.join(__dirname, '../..', relativePath);
      safeUnlinkFile(filePath);
    }

    // Recalculate Maintenance Risk
    await recalculateMaintenanceRisk(vehicle_id);

    res.status(200).json({
      message: 'Service record deleted successfully',
      record: deletedRecord
    });
  } catch (error) {
    next(error);
  }
};
