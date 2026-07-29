const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { auth, authorize } = require('../middleware/auth');

// All vehicle routes require authentication
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), vehicleController.createVehicle);
router.get('/', auth, vehicleController.getAllVehicles);
router.get('/:id', auth, vehicleController.getVehicleById);
router.put('/:id', auth, authorize(['Admin', 'Fleet Manager']), vehicleController.updateVehicle);
router.delete('/:id', auth, authorize(['Admin']), vehicleController.deleteVehicle);

module.exports = router;
