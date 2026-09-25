const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, checklistController.createChecklist);
router.get('/', auth, authorize(['Admin', 'Fleet Manager']), checklistController.getAllChecklists);
router.get('/my-checklists', auth, checklistController.getMyChecklists);
router.get('/vehicle/:vehicleId', auth, checklistController.getChecklistsByVehicle);
router.get('/:id', auth, checklistController.getChecklistById);

module.exports = router;
