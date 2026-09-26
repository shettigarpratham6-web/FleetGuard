import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import * as auditController from '../controllers/auditController';

const router = Router();

router.get('/', auth as any, authorize(['Admin']) as any, auditController.getAuditLogs as any);
router.get('/entity/:entityType/:entityId', auth as any, authorize(['Admin']) as any, auditController.getAuditLogsByEntity as any);
router.get('/user/:userId', auth as any, authorize(['Admin']) as any, auditController.getAuditLogsByUser as any);

export default router;
