/**
 * Standardized API response formatter.
 * Provides consistent response shape across all endpoints.
 */

/**
 * Success response wrapper.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable success message
 * @param {object} data - Response payload
 */
const success = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Error response wrapper.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 */
const error = (res, statusCode = 500, errorMessage = 'Internal Server Error') => {
  return res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
};

/**
 * Paginated response wrapper.
 * @param {object} res - Express response object
 * @param {Array} rows - Array of records
 * @param {number} total - Total count of records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @param {string} dataKey - Key name for the array in the response
 */
const paginated = (res, rows, total, page, limit, dataKey = 'data') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    [dataKey]: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
};

/**
 * Created response (201).
 */
const created = (res, message = 'Resource created successfully', data = {}) => {
  return success(res, 201, message, data);
};

/**
 * Not found response (404).
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, 404, message);
};

/**
 * Bad request response (400).
 */
const badRequest = (res, message = 'Bad request') => {
  return error(res, 400, message);
};

/**
 * Unauthorized response (401).
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, 401, message);
};

/**
 * Forbidden response (403).
 */
const forbidden = (res, message = 'Access forbidden') => {
  return error(res, 403, message);
};

module.exports = {
  success,
  error,
  paginated,
  created,
  notFound,
  badRequest,
  unauthorized,
  forbidden
};
