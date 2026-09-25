import { Router } from 'express';
import * as serviceRecordController from '../controllers/serviceRecordController';
import { auth, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

/**
 * @route   POST /api/services
 * @desc    Create a new service record
 * @access  Admin, Fleet Manager, Service Center
 */
router.post(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager', 'Service Center']) as any,
  upload.single('file') as any,
  serviceRecordController.createServiceRecord as any
);

/**
 * @route   GET /api/services
 * @desc    Get all service records
 * @access  Authenticated Users
 */
router.get(
  '/',
  auth as any,
  serviceRecordController.getAllServiceRecords as any
);

/**
 * @route   GET /api/services/history/:vehicleId
 * @desc    Get complete service history of a vehicle
 * @access  Authenticated Users
 */
router.get(
  '/history/:vehicleId',
  auth as any,
  serviceRecordController.getVehicleServiceHistory as any
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service record by ID
 * @access  Authenticated Users
 */
router.get(
  '/:id',
  auth as any,
  serviceRecordController.getServiceRecordById as any
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service record
 * @access  Admin, Fleet Manager, Service Center
 */
router.put(
  '/:id',
  auth as any,
  upload.single('file') as any,
  serviceRecordController.updateServiceRecord as any
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service record
 * @access  Admin only
 */
router.delete(
  '/:id',
  auth as any,
  authorize(['Admin']) as any,
  serviceRecordController.deleteServiceRecord as any
);

export default router;
