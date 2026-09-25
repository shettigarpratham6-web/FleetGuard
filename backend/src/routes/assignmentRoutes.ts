const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { auth, authorize } = require('../middleware/auth');

// All assignment routes require authentication
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), assignmentController.createAssignment);
router.get('/', auth, assignmentController.getAllAssignments);
router.get('/:id', auth, assignmentController.getAssignmentById);
router.put('/:id/return', auth, authorize(['Admin', 'Fleet Manager']), assignmentController.returnVehicle);
router.put('/:id/cancel', auth, authorize(['Admin', 'Fleet Manager']), assignmentController.cancelAssignment);

module.exports = router;
