const express = require('express');
const router = express.Router();
const maintenanceRiskController = require('../controllers/maintenanceRiskController');
const { auth, authorize } = require('../middleware/auth');

// Maintenance risk routes
router.get('/', auth, maintenanceRiskController.getAllRisks);
router.get('/vehicle/:vehicleId', auth, maintenanceRiskController.getRiskByVehicleId);
router.post('/calculate', auth, authorize(['Admin', 'Fleet Manager']), maintenanceRiskController.triggerRecalculation);

module.exports = router;
