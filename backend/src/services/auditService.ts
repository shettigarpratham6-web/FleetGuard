/**
 * Audit Service — logs system actions to the audit_logs table.
 */
import db from '../config/db';

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export interface GetAuditLogsInput {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create an audit log entry.
 */
export const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress
}: CreateAuditLogInput): Promise<any | null> => {
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
  } catch (error: any) {
    // Audit failures should never crash the main flow
    console.error('[AuditService] Failed to write audit log:', error.message);
    return null;
  }
};

/**
 * Retrieve audit logs with optional filters.
 */
export const getAuditLogs = async ({
  userId,
  action,
  entityType,
  entityId,
  limit = 50,
  offset = 0
}: GetAuditLogsInput = {}): Promise<any[]> => {
  let query = `
    SELECT al.*, u.email AS user_email, u.full_name AS user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (userId) { params.push(userId); conditions.push(`al.user_id = $${params.length}`); }
  if (action) { params.push(action); conditions.push(`al.action = $${params.length}`); }
  if (entityType) { params.push(entityType); conditions.push(`al.entity_type = $${params.length}`); }
  if (entityId) { params.push(entityId); conditions.push(`al.entity_id = $${params.length}`); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY al.created_at DESC';
  params.push(limit); query += ` LIMIT $${params.length}`;
  params.push(offset); query += ` OFFSET $${params.length}`;

  const result = await db.query(query, params);
  return result.rows;
};

export default { createAuditLog, getAuditLogs };
