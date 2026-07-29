const express = require('express');
const router = express.Router();
const serviceRecordController = require('../controllers/serviceRecordController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Service records routes
router.post('/', auth, authorize(['Admin', 'Fleet Manager', 'Service Center']), upload.single('file'), serviceRecordController.createServiceRecord);
router.get('/', auth, serviceRecordController.getAllServiceRecords);
router.get('/:id', auth, serviceRecordController.getServiceRecordById);
router.put('/:id', auth, authorize(['Admin', 'Fleet Manager', 'Service Center']), upload.single('file'), serviceRecordController.updateServiceRecord);
router.delete('/:id', auth, authorize(['Admin']), serviceRecordController.deleteServiceRecord);

module.exports = router;
