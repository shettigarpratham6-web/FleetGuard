import { Router } from 'express';
import driverController from '../controllers/driverController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/profile',
  auth as any,
  authorize(['Driver']) as any,
  driverController.getProfile as any
);

router.put(
  '/profile',
  auth as any,
  authorize(['Driver']) as any,
  driverController.updateProfile as any
);

router.put(
  '/profile/password',
  auth as any,
  authorize(['Driver']) as any,
  driverController.changePassword as any
);

export default router;
