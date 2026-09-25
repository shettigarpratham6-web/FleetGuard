import { Router } from 'express';
import vehicleController from '../controllers/vehicleController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// All vehicle routes require authentication
router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, vehicleController.createVehicle as any);
router.get('/', auth as any, vehicleController.getAllVehicles as any);

// 3. Get a single vehicle by ID
router.get('/:id', auth as any, vehicleController.getVehicleById as any);

// 4. Update a vehicle by ID (Only Admins and Fleet Managers)
router.put('/:id', auth as any, authorize(['Admin', 'Fleet Manager']) as any, vehicleController.updateVehicle as any);

// 5. Delete a vehicle by ID (Only Admins)
router.delete('/:id', auth as any, authorize(['Admin']) as any, vehicleController.deleteVehicle as any);

export default router;
