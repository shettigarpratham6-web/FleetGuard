const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { auth, authorize } = require('../middleware/auth');
const db = require('../config/db');

// GET all audit logs (Admin only, read-only trail)
router.get('/', auth, authorize(['Admin']), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT al.*, u.email AS user_email, u.full_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
    `);
    res.status(200).json({ auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
});
=======
const authController = require('../controllers/authController');
const authenticateToken = require("../middleware/authMiddleware");

router.get("/me", authenticateToken, authController.getMe);
>>>>>>> 2c2a3e69832085d4d86a6f1323a911f3d90b0ea9

module.exports = router;