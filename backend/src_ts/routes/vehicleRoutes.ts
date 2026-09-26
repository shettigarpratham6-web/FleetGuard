import { Router } from 'express';
import vehicleController from '../controllers/vehicleController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, vehicleController.createVehicle as any);
router.get('/', auth as any, vehicleController.getAllVehicles as any);

router.get('/:id', auth as any, vehicleController.getVehicleById as any);

router.put('/:id', auth as any, authorize(['Admin', 'Fleet Manager']) as any, vehicleController.updateVehicle as any);

router.delete('/:id', auth as any, authorize(['Admin']) as any, vehicleController.deleteVehicle as any);

export default router;
