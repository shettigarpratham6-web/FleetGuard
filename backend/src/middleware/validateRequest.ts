import type { Request, Response, NextFunction } from 'express';

/**
 * Request validation utility middleware helpers.
 * Provides reusable Express middleware for common validation patterns.
 */

export const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validates that specified body fields are present and non-empty.
 * @param fields - Field names to check
 */
export const requireFields = (...fields: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const missing = fields.filter((f) => {
    const val = req.body?.[f];
    return val === undefined || val === null || String(val).trim() === '';
  });

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`
    });
  }
  next();
};

/**
 * Validates that a route param is a valid UUID.
 * @param paramName - The req.params key to validate
 */
export const validateUUID = (paramName: string) => (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const value = req.params?.[paramName];
  if (!value || !UUID_REGEX.test(value)) {
    return res.status(400).json({
      error: `Invalid ${paramName} format. Must be a valid UUID.`
    });
  }
  next();
};

/**
 * Validates that a field value is within an allowed enum list.
 * @param field - Body field name
 * @param allowed - Allowed values
 */
export const validateEnum = (field: string, allowed: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const value = req.body?.[field];
  if (value !== undefined && !allowed.includes(value)) {
    return res.status(400).json({
      error: `Invalid value for '${field}'. Must be one of: ${allowed.join(', ')}`
    });
  }
  next();
};

/**
 * Validates that a date string is a valid ISO date.
 * @param fields - Body field names to validate as dates
 */
export const validateDates = (...fields: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  for (const field of fields) {
    const value = req.body?.[field];
    if (value && isNaN(Date.parse(String(value)))) {
      return res.status(400).json({
        error: `Invalid date format for '${field}'. Use ISO 8601 format (YYYY-MM-DD).`
      });
    }
  }
  next();
};

/**
 * Validates that a numeric field is a positive number.
 * @param fields - Body field names to validate as positive numbers
 */
export const validatePositiveNumbers = (...fields: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  for (const field of fields) {
    const value = req.body?.[field];
    if (value !== undefined && value !== null && value !== '') {
      const num = parseFloat(String(value));
      if (isNaN(num) || num < 0) {
        return res.status(400).json({
          error: `'${field}' must be a non-negative number.`
        });
      }
    }
  }
  next();
};

/**
 * Simple UUID check utility (non-middleware).
 */
export const isValidUUID = (value: string): boolean => UUID_REGEX.test(value);

export default {
  requireFields,
  validateUUID,
  validateEnum,
  validateDates,
  validatePositiveNumbers,
  isValidUUID,
  UUID_REGEX
};
