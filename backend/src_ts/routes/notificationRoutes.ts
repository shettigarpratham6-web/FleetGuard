import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth as any, authorize(['Admin', 'Fleet Manager']) as any, notificationController.createNotification as any);
router.get('/', auth as any, notificationController.getMyNotifications as any);
router.put('/:id/read', auth as any, notificationController.markAsRead as any);
router.delete('/:id', auth as any, notificationController.deleteNotification as any);

export default router;
