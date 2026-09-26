import { Router } from 'express';
import overrideLogController from '../controllers/overrideLogController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.createOverrideLog as any
);

router.get(
  '/',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.getAllOverrideLogs as any
);

router.get(
  '/:id',
  auth as any,
  authorize(['Admin', 'Fleet Manager']) as any,
  overrideLogController.getOverrideLogById as any
);

export default router;
