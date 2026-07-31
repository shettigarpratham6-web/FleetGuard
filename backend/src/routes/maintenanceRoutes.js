const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenanceController');

router.get('/service-queue', maintenanceController.getServiceQueue);

module.exports = router;