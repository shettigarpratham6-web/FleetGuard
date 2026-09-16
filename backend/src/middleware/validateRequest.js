/**
 * Request validation utility middleware helpers.
 * Provides reusable Express middleware for common validation patterns.
 */

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validates that specified body fields are present and non-empty.
 * @param {...string} fields - Field names to check
 */
const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => {
    const val = req.body[f];
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
 * @param {string} paramName - The req.params key to validate
 */
const validateUUID = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  if (!value || !UUID_REGEX.test(value)) {
    return res.status(400).json({
      error: `Invalid ${paramName} format. Must be a valid UUID.`
    });
  }
  next();
};

/**
 * Validates that a field value is within an allowed enum list.
 * @param {string} field - Body field name
 * @param {string[]} allowed - Allowed values
 */
const validateEnum = (field, allowed) => (req, res, next) => {
  const value = req.body[field];
  if (value !== undefined && !allowed.includes(value)) {
    return res.status(400).json({
      error: `Invalid value for '${field}'. Must be one of: ${allowed.join(', ')}`
    });
  }
  next();
};

/**
 * Validates that a date string is a valid ISO date.
 * @param {...string} fields - Body field names to validate as dates
 */
const validateDates = (...fields) => (req, res, next) => {
  for (const field of fields) {
    const value = req.body[field];
    if (value && isNaN(Date.parse(value))) {
      return res.status(400).json({
        error: `Invalid date format for '${field}'. Use ISO 8601 format (YYYY-MM-DD).`
      });
    }
  }
  next();
};

/**
 * Validates that a numeric field is a positive number.
 * @param {...string} fields - Body field names to validate as positive numbers
 */
const validatePositiveNumbers = (...fields) => (req, res, next) => {
  for (const field of fields) {
    const value = req.body[field];
    if (value !== undefined && value !== null && value !== '') {
      const num = parseFloat(value);
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
const isValidUUID = (value) => UUID_REGEX.test(value);

module.exports = {
  requireFields,
  validateUUID,
  validateEnum,
  validateDates,
  validatePositiveNumbers,
  isValidUUID,
  UUID_REGEX
};
