const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All compliance document routes require authentication
router.post('/', auth, authorize(['Admin', 'Fleet Manager', 'Driver']), upload.single('file'), complianceController.createDocument);
router.get('/', auth, complianceController.getAllDocuments);
router.get('/vehicle/:vehicleId/status', auth, complianceController.getVehicleComplianceStatus);
router.get('/vehicle/:vehicleId', auth, complianceController.getDocumentsByVehicle);
router.get('/:id', auth, complianceController.getDocumentById);
router.put('/:id', auth, upload.single('file'), complianceController.updateDocument);
router.delete('/:id', auth, authorize(['Admin']), complianceController.deleteDocument);

module.exports = router;
