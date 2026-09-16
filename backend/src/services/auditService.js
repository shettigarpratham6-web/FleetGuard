/**
 * Audit Service — logs system actions to the audit_logs table.
 */
const db = require('../config/db');

/**
 * Create an audit log entry.
 * @param {object} params
 * @param {string} params.userId - User who performed the action
 * @param {string} params.action - Action performed (e.g. 'CREATE_VEHICLE', 'UPDATE_COMPLIANCE', 'LOGIN')
 * @param {string} params.entityType - Entity type (e.g. 'vehicle', 'user', 'assignment')
 * @param {string} params.entityId - UUID of the affected entity
 * @param {object} params.details - Additional JSON details about the action
 * @param {string} params.ipAddress - IP address of the requester
 * @returns {object} Created audit log entry
 */
const createAuditLog = async ({ userId, action, entityType, entityId, details = {}, ipAddress }) => {
  try {
    const result = await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        JSON.stringify(details),
        ipAddress || null
      ]
    );
    return result.rows[0];
  } catch (error) {
    // Audit failures should never crash the main flow
    console.error('[AuditService] Failed to write audit log:', error.message);
    return null;
  }
};

/**
 * Retrieve audit logs with optional filters.
 * @param {object} filters - { userId, action, entityType, entityId, limit, offset }
 * @returns {Array}
 */
const getAuditLogs = async ({ userId, action, entityType, entityId, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT al.*, u.email AS user_email, u.full_name AS user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  const params = [];
  const conditions = [];

  if (userId) { params.push(userId); conditions.push(`al.user_id = $${params.length}`); }
  if (action) { params.push(action); conditions.push(`al.action = $${params.length}`); }
  if (entityType) { params.push(entityType); conditions.push(`al.entity_type = $${params.length}`); }
  if (entityId) { params.push(entityId); conditions.push(`al.entity_id = $${params.length}`); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY al.created_at DESC';
  params.push(parseInt(limit, 10)); query += ` LIMIT $${params.length}`;
  params.push(parseInt(offset, 10)); query += ` OFFSET $${params.length}`;

  const result = await db.query(query, params);
  return result.rows;
};

module.exports = { createAuditLog, getAuditLogs };
