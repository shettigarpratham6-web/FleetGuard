import { Router } from 'express';
import maintenanceRiskController from '../controllers/maintenanceRiskController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Maintenance risk routes
router.get('/', auth as any, maintenanceRiskController.getAllRisks as any);
router.get('/vehicle/:vehicleId', auth as any, maintenanceRiskController.getRiskByVehicleId as any);
router.post('/calculate', auth as any, authorize(['Admin', 'Fleet Manager']) as any, maintenanceRiskController.triggerRecalculation as any);

export default router;
