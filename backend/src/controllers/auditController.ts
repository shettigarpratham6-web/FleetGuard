import type { Request, Response, NextFunction } from 'express';
import db from '../config/db';

interface GetAuditLogsQuery {
  action?: string;
  entity_type?: string;
  limit?: string;
  offset?: string;
}

interface EntityParams {
  entityType: string;
  entityId: string;
}

interface UserParams {
  userId: string;
}

/**
 * GET /api/audit
 * Fetch all audit logs with optional filtering and pagination.
 */
export const getAuditLogs = async (
  req: Request<{}, {}, {}, GetAuditLogsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action, entity_type, limit, offset } = req.query;
    let queryText = `
      SELECT al.*, u.email AS user_email, u.full_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (action) {
      params.push(action);
      conditions.push(`al.action = $${params.length}`);
    }

    if (entity_type) {
      params.push(entity_type);
      conditions.push(`al.entity_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY al.created_at DESC';

    if (limit) {
      params.push(parseInt(limit, 10));
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseInt(offset, 10));
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await db.query(queryText, params);
    res.status(200).json({ auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Fetch audit logs for a specific entity (e.g. vehicle, user, assignment).
 */
export const getAuditLogsByEntity = async (
  req: Request<EntityParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;

    const queryText = `
      SELECT al.*, u.email AS user_email, u.full_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = $1 AND al.entity_id = $2
      ORDER BY al.created_at DESC
    `;
    const result = await db.query(queryText, [entityType, entityId]);
    res.status(200).json({ auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit/user/:userId
 * Fetch audit logs for a specific user.
 */
export const getAuditLogsByUser = async (
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const queryText = `
      SELECT al.*, u.email AS user_email, u.full_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = $1
      ORDER BY al.created_at DESC
    `;
    const result = await db.query(queryText, [userId]);
    res.status(200).json({ auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

export default {
  getAuditLogs,
  getAuditLogsByEntity,
  getAuditLogsByUser
};
