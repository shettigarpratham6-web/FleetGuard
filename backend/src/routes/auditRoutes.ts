import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import * as auditController from '../controllers/auditController';

const router = Router();

// GET all audit logs (Admin only, read-only trail)
router.get('/', auth as any, authorize(['Admin']) as any, auditController.getAuditLogs as any);

// GET audit logs filtered by entity type and ID
router.get('/entity/:entityType/:entityId', auth as any, authorize(['Admin']) as any, auditController.getAuditLogsByEntity as any);

// GET audit logs filtered by user
router.get('/user/:userId', auth as any, authorize(['Admin']) as any, auditController.getAuditLogsByUser as any);

export default router;
