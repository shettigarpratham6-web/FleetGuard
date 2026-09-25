import { Router } from 'express';
import overrideLogController from '../controllers/overrideLogController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Create an override audit log
router.post(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.createOverrideLog as any
);

// Get all override audit logs
router.get(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.getAllOverrideLogs as any
);

// Get a single override audit log
router.get(
  '/:id',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.getOverrideLogById as any
);

export default router;
