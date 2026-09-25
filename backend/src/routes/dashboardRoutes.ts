const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
    "/dashboard",
    authenticateToken,
    authorize("Admin"),
    dashboardController.getDashboard
);

module.exports = router;