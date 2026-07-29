const express = require('express');
const router = express.Router();
const historicalServiceController = require('../controllers/historicalServiceController');
const { auth, authorize } = require('../middleware/auth');

// Historical service routes
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), historicalServiceController.createHistoricalService);
router.get('/vehicle/:vehicleId', auth, historicalServiceController.getHistoricalServicesByVehicle);
router.delete('/:id', auth, authorize(['Admin']), historicalServiceController.deleteHistoricalService);

module.exports = router;
