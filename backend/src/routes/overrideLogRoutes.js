const express = require('express');
const router = express.Router();
const overrideLogController = require('../controllers/overrideLogController');
const { auth, authorize } = require('../middleware/auth');

// Override log routes require authorization (only managers/admin can create and view)
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), overrideLogController.createOverrideLog);
router.get('/', auth, authorize(['Admin', 'Fleet Manager']), overrideLogController.getAllOverrideLogs);
router.get('/:id', auth, authorize(['Admin', 'Fleet Manager']), overrideLogController.getOverrideLogById);

module.exports = router;
