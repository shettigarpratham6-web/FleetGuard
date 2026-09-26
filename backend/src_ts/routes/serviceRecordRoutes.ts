import { Router } from 'express';
import * as serviceRecordController from '../controllers/serviceRecordController';
import { auth, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.post(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager', 'Service Center']) as any,
  upload.single('file') as any,
  serviceRecordController.createServiceRecord as any
);

router.get(
  '/',
  auth as any,
  serviceRecordController.getAllServiceRecords as any
);

router.get(
  '/history/:vehicleId',
  auth as any,
  serviceRecordController.getVehicleServiceHistory as any
);

router.get(
  '/:id',
  auth as any,
  serviceRecordController.getServiceRecordById as any
);

router.put(
  '/:id',
  auth as any,
  upload.single('file') as any,
  serviceRecordController.updateServiceRecord as any
);

router.delete(
  '/:id',
  auth as any,
  authorize(['Admin']) as any,
  serviceRecordController.deleteServiceRecord as any
);

export default router;
