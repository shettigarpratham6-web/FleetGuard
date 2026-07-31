const express = require("express");
const router = express.Router();

const overrideLogController = require("../controllers/overrideLogController");
const { auth, authorize } = require("../middleware/auth");

// Create an override audit log
router.post(
    "/",
    auth,
    authorize(["Admin", "Fleet Manager"]),
    overrideLogController.createOverrideLog
);

// Get all override audit logs
router.get(
    "/",
    auth,
    authorize(["Admin", "Fleet Manager"]),
    overrideLogController.getAllOverrideLogs
);

// Get a single override audit log
router.get(
    "/:id",
    auth,
    authorize(["Admin", "Fleet Manager"]),
    overrideLogController.getOverrideLogById
);

module.exports = router;