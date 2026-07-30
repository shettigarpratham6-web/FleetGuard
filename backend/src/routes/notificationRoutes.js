
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize(['Admin', 'Fleet Manager']), notificationController.createNotification);
router.get('/', auth, notificationController.getMyNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;