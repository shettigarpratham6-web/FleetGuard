import { Router } from 'express';
import assignmentController from '../controllers/assignmentController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// All assignment routes require authentication
router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, assignmentController.createAssignment as any);
router.get('/', auth as any, assignmentController.getAllAssignments as any);
router.get('/:id', auth as any, assignmentController.getAssignmentById as any);
router.put('/:id/return', auth as any, authorize(['Admin', 'Fleet Manager']) as any, assignmentController.returnVehicle as any);
router.put('/:id/cancel', auth as any, authorize(['Admin', 'Fleet Manager']) as any, assignmentController.cancelAssignment as any);

export default router;
