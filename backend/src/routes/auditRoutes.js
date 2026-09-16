const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// GET all audit logs (Admin only, read-only trail)
router.get('/', auth, authorize(['Admin']), auditController.getAuditLogs);

// GET audit logs filtered by entity type and ID
router.get('/entity/:entityType/:entityId', auth, authorize(['Admin']), auditController.getAuditLogsByEntity);

// GET audit logs filtered by user
router.get('/user/:userId', auth, authorize(['Admin']), auditController.getAuditLogsByUser);

module.exports = router;