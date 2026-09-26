import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../config/db';
import { recalculateMaintenanceRisk } from '../services/riskService';

export interface AuthenticatedRequest extends Request {
  file?: Express.Multer.File;
  user?: {
    id: string | number;
    email?: string;
    full_name?: string;
    role?: string;
    [key: string]: any;
  };
}

interface CreateServiceRecordBody {
  vehicle_id?: string;
  mechanic_id?: string;
  service_date?: string;
  current_mileage?: string | number;
  service_type?: string;
  description?: string;
  parts_changed?: string;
  labour_cost?: string | number;
  parts_cost?: string | number;
  next_service_mileage?: string | number;
  next_service_date?: string;
}

interface UpdateServiceRecordBody {
  mechanic_id?: string;
  service_date?: string;
  current_mileage?: string | number;
  service_type?: string;
  description?: string;
  parts_changed?: string;
  labour_cost?: string | number;
  parts_cost?: string | number;
  next_service_mileage?: string | number;
  next_service_date?: string;
}

interface GetAllQuery {
  vehicle_id?: string;
  service_type?: string;
}

const safeUnlinkFile = (filePath?: string | null): void => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete file at ${filePath}:`, err);
    }
  }
};

export const createServiceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
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
    }: CreateServiceRecordBody = req.body;

    if (!vehicle_id || !service_date || !current_mileage || !service_type) {
      if (req.file) {
        safeUnlinkFile(req.file.path);
      }
      return res.status(400).json({ error: 'Vehicle ID, service date, current mileage, and service type are required.' });
    }

    const vehicleCheck = await db.query('SELECT current_mileage FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      if (req.file) {
        safeUnlinkFile(req.file.path);
      }
      return res.status(400).json({ error: 'Invalid vehicle ID. Vehicle does not exist.' });
    }

    const vehicleMileage: number = vehicleCheck.rows[0].current_mileage;

    const invoice_url: string | null = req.file ? `/uploads/${req.file.filename}` : null;

    const queryText = `
      INSERT INTO service_records (
        vehicle_id, mechanic_id, service_date, current_mileage, service_type,
        description, parts_changed, labour_cost, parts_cost, invoice_url,
        next_service_mileage, next_service_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const parsedLabour: number = labour_cost ? parseFloat(labour_cost.toString()) : 0;
    const parsedParts: number = parts_cost ? parseFloat(parts_cost.toString()) : 0;
    const parsedMileage: number = parseInt(current_mileage.toString(), 10);

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
      next_service_mileage ? parseInt(next_service_mileage.toString(), 10) : null,
      next_service_date || null
    ]);

    const serviceRecord = result.rows[0];

    if (parsedMileage > vehicleMileage) {
      await db.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [parsedMileage, vehicle_id]);
    }

    await recalculateMaintenanceRisk(vehicle_id);

    return res.status(201).json({
      message: 'Service record added successfully',
      record: serviceRecord
    });
  } catch (error: any) {
    if (req.file) {
      safeUnlinkFile(req.file.path);
    }
    if (error && error.code === '23514') {
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
    return next(error);
  }
};

export const getAllServiceRecords = async (
  req: Request<{}, {}, {}, GetAllQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vehicle_id, service_type } = req.query;
    let queryText = `
      SELECT sr.*, v.vehicle_number, v.registration_number, u.username as mechanic_name
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN users u ON sr.mechanic_id = u.id
    `;
    const params: string[] = [];
    const conditions: string[] = [];

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

export const getServiceRecordById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
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

    return res.status(200).json({ record: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const updateServiceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
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
    }: UpdateServiceRecordBody = req.body;

    if (!service_date || !current_mileage || !service_type) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Service date, current mileage, and service type are required.' });
    }

    const existingResult = await db.query('SELECT vehicle_id, invoice_url FROM service_records WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Service record not found.' });
    }

    const oldRecord = existingResult.rows[0];
    const vehicle_id = oldRecord.vehicle_id;

    let invoice_url: string | null = oldRecord.invoice_url;
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

    const parsedLabour: number = labour_cost ? parseFloat(labour_cost.toString()) : 0;
    const parsedParts: number = parts_cost ? parseFloat(parts_cost.toString()) : 0;
    const parsedMileage: number = parseInt(current_mileage.toString(), 10);

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
      next_service_mileage ? parseInt(next_service_mileage.toString(), 10) : null,
      next_service_date || null,
      id
    ]);

    const updatedRecord = result.rows[0];

    const vehicleCheck = await db.query('SELECT current_mileage FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length > 0 && parsedMileage > vehicleCheck.rows[0].current_mileage) {
      await db.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [parsedMileage, vehicle_id]);
    }

    await recalculateMaintenanceRisk(vehicle_id);

    try {
      if (updatedRecord.next_service_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDate = new Date(updatedRecord.next_service_date);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if ([10, 7, 5].includes(daysRemaining)) {
          const title = `Scheduled Maintenance in ${daysRemaining} Days`;
          const message = `Vehicle is due for ${updatedRecord.service_type || 'Routine Maintenance'} on ${nextDate.toLocaleDateString()} (${daysRemaining} days remaining). Please prepare the vehicle for maintenance.`;

          const mechanicRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [updatedRecord.mechanic_id || (req.user ? req.user.id : null)]);
          const mechanic = mechanicRes.rows[0];

          const driverRes = await db.query(`
            SELECT u.id, u.email, u.full_name 
            FROM assignments a 
            JOIN users u ON a.driver_id = u.id 
            WHERE a.vehicle_id = $1 AND a.assignment_status = 'Active'
            LIMIT 1
          `, [updatedRecord.vehicle_id]);
          const driver = driverRes.rows[0];

          const adminRes = await db.query("SELECT id, email, full_name FROM users WHERE role = 'Admin' OR role = 'Fleet Manager'");
          const admins = adminRes.rows;

          const userIds = new Set<string | number>();
          admins.forEach((a: any) => userIds.add(a.id));
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
    } catch (err: any) {
      console.error('⚠️ Could not process instant alert on service record update:', err.message);
    }

    return res.status(200).json({
      message: 'Service record updated successfully',
      record: updatedRecord
    });
  } catch (error: any) {
    if (req.file) {
      safeUnlinkFile(req.file.path);
    }
    if (error && error.code === '23514') {
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
    return next(error);
  }
};

export const getVehicleServiceHistory = async (
  req: Request<{ vehicleId: string }>,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { vehicleId } = req.params;

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

    return res.status(200).json({
      vehicle: vehicleResult.rows[0],
      total_records: historyResult.rows.length,
      history: historyResult.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteServiceRecord = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const queryText = 'DELETE FROM service_records WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service record not found.' });
    }

    const deletedRecord = result.rows[0];
    const { vehicle_id, invoice_url } = deletedRecord;

    if (invoice_url) {
      const relativePath = invoice_url.startsWith('/') ? invoice_url.substring(1) : invoice_url;
      const filePath = path.join(__dirname, '../..', relativePath);
      safeUnlinkFile(filePath);
    }

    await recalculateMaintenanceRisk(vehicle_id);

    return res.status(200).json({
      message: 'Service record deleted successfully',
      record: deletedRecord
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  createServiceRecord,
  getAllServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
  getVehicleServiceHistory,
  deleteServiceRecord
};
