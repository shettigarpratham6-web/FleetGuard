const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

router.get('/settings', auth, notificationController.getAlertSettings);
router.put('/settings', auth, authorize(['Admin', 'Fleet Manager', 'Manager']), notificationController.updateAlertSettings);
router.post('/trigger-expiry-scan', auth, authorize(['Admin', 'Fleet Manager', 'Manager']), notificationController.triggerExpiryScan);

router.post('/', auth, authorize(['Admin', 'Fleet Manager', 'Driver']), notificationController.createNotification);
router.get('/', auth, notificationController.getMyNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;