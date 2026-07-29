const express = require("express");
const router = express.Router();

const driverController = require("../controllers/driverController");
const { auth, authorize } = require("../middleware/auth");

router.get(
    "/profile",
    auth,
    authorize(["Driver"]),
    driverController.getProfile
);

router.put(
    "/profile",
    auth,
    authorize(["Driver"]),
    driverController.updateProfile
);

router.put(
    "/profile/password",
    auth,
    authorize(["Driver"]),
    driverController.changePassword
);

module.exports = router;
