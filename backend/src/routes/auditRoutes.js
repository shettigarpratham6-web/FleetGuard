const express = require('express');
const router = express.Router();
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

module.exports = router;