const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicleController');
const { auth, authorize } = require('../middleware/auth');

// All vehicle routes require authentication
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), vehicleController.createVehicle);
router.get('/', auth, vehicleController.getAllVehicles);

// 3. Get a single vehicle by ID
router.get('/:id', auth, vehicleController.getVehicleById);

// 4. Update a vehicle by ID (Only Admins and Fleet Managers)
router.put('/:id', auth, authorize(['Admin', 'Fleet Manager']), vehicleController.updateVehicle);

// 5. Delete a vehicle by ID (Only Admins)
router.delete('/:id', auth, authorize(['Admin']), vehicleController.deleteVehicle);

module.exports = router;