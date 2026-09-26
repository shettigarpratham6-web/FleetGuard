import { Router } from 'express';
import checklistController from '../controllers/checklistController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth as any, checklistController.createChecklist as any);
router.get('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, checklistController.getAllChecklists as any);
router.get('/my-checklists', auth as any, checklistController.getMyChecklists as any);
router.get('/vehicle/:vehicleId', auth as any, checklistController.getChecklistsByVehicle as any);
router.get('/:id', auth as any, checklistController.getChecklistById as any);

export default router;
