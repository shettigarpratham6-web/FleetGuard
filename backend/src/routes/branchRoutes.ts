const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { auth, authorize } = require('../middleware/auth');

// All branch routes require authentication
router.post('/', auth, authorize(['Admin', 'Fleet Manager']), branchController.createBranch);
router.get('/', auth, branchController.getAllBranches);
router.get('/:id', auth, branchController.getBranchById);
router.put('/:id', auth, authorize(['Admin', 'Fleet Manager']), branchController.updateBranch);
router.delete('/:id', auth, authorize(['Admin']), branchController.deleteBranch);

module.exports = router;
