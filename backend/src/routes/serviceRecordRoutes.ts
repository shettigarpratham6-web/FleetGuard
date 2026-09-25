const express = require('express');
const router = express.Router();

const serviceRecordController = require('../controllers/serviceRecordController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/services
 * @desc    Create a new service record
 * @access  Admin, Fleet Manager, Service Center
 */
router.post(
    '/',
    auth,
    authorize(['Admin', 'Fleet Manager', 'Service Center']),
    upload.single('file'),
    serviceRecordController.createServiceRecord
);

/**
 * @route   GET /api/services
 * @desc    Get all service records
 * @access  Authenticated Users
 */
router.get(
    '/',
    auth,
    serviceRecordController.getAllServiceRecords
);

/**
 * @route   GET /api/services/history/:vehicleId
 * @desc    Get complete service history of a vehicle
 * @access  Authenticated Users
 */
router.get(
    '/history/:vehicleId',
    auth,
    serviceRecordController.getVehicleServiceHistory
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service record by ID
 * @access  Authenticated Users
 */
router.get(
    '/:id',
    auth,
    serviceRecordController.getServiceRecordById
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service record
 * @access  Admin, Fleet Manager, Service Center
 */
router.put(
    '/:id',
    auth,
    upload.single('file'),
    serviceRecordController.updateServiceRecord
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service record
 * @access  Admin only
 */
router.delete(
    '/:id',
    auth,
    authorize(['Admin']),
    serviceRecordController.deleteServiceRecord
);

module.exports = router;