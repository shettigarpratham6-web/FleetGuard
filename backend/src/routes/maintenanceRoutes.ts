import { Router } from 'express';
import maintenanceController from '../controllers/maintenanceController';

const router = Router();

router.get('/service-queue', maintenanceController.getServiceQueue as any);

export default router;
