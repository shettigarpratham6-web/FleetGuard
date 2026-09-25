import { Router } from 'express';
import complianceController from '../controllers/complianceController';
import { auth, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// All compliance document routes require authentication
router.post('/', auth as any, authorize(['Admin', 'Fleet Manager', 'Driver']) as any, upload.single('file') as any, complianceController.createDocument as any);
router.get('/', auth as any, complianceController.getAllDocuments as any);
router.get('/vehicle/:vehicleId/status', auth as any, complianceController.getVehicleComplianceStatus as any);
router.get('/vehicle/:vehicleId', auth as any, complianceController.getDocumentsByVehicle as any);
router.get('/:id', auth as any, complianceController.getDocumentById as any);
router.put('/:id', auth as any, upload.single('file') as any, complianceController.updateDocument as any);
router.delete('/:id', auth as any, authorize(['Admin']) as any, complianceController.deleteDocument as any);

export default router;
