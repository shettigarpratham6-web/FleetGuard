import { Router } from 'express';
import dashboardController from '../controllers/dashboardController';
import authenticateToken from '../middleware/authMiddleware';
import authorize from '../middleware/roleMiddleware';

const router = Router();

router.get(
  '/dashboard',
  authenticateToken as any,
  authorize('Admin') as any,
  dashboardController.getDashboard as any
);

export default router;
