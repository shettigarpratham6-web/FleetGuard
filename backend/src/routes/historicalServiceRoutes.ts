import { Router } from 'express';
import historicalServiceController from '../controllers/historicalServiceController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Historical service routes
router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, historicalServiceController.createHistoricalService as any);
router.get('/', auth as any, historicalServiceController.getAllHistoricalServices as any);
router.get('/vehicle/:vehicleId', auth as any, historicalServiceController.getHistoricalServicesByVehicle as any);
router.delete('/:id', auth as any, authorize(['Admin']) as any, historicalServiceController.deleteHistoricalService as any);

export default router;
