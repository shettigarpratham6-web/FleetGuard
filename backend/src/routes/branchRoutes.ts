import { Router } from 'express';
import branchController from '../controllers/branchController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// All branch routes require authentication
router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, branchController.createBranch as any);
router.get('/', auth as any, branchController.getAllBranches as any);
router.get('/:id', auth as any, branchController.getBranchById as any);
router.put('/:id', auth as any, authorize(['Admin', 'Fleet Manager']) as any, branchController.updateBranch as any);
router.delete('/:id', auth as any, authorize(['Admin']) as any, branchController.deleteBranch as any);

export default router;
