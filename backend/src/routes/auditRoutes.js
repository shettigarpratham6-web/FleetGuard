const authenticateToken = require("../middleware/authMiddleware");

router.get("/me", authenticateToken, authController.getMe);