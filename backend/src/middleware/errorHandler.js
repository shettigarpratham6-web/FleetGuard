/**
 * Centralized Express error handler middleware.
 * Must be registered LAST in Express middleware chain (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Multer file size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded. Maximum file size is 5 MB.' });
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field. Please check your upload field name.' });
  }

  // Multer invalid file type (thrown manually in fileFilter)
  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry. A record with this value already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist. Please check your input values.' });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: `Constraint violated: ${err.message}` });
  }

  // PostgreSQL not null violation
  if (err.code === '23502') {
    return res.status(400).json({ error: `Required field missing: ${err.column || 'unknown column'}` });
  }

  // PostgreSQL connection refused
  if (err.message && err.message.includes('ECONNREFUSED')) {
    return res.status(500).json({ error: 'Database connection failed. Please ensure PostgreSQL is running.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Authentication token has expired. Please log in again.' });
  }

  // Validation error (from validateRequest middleware)
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message });
  }

  // Custom app errors with status code
  if (err.status) {
    return res.status(err.status).json({ error: err.message || 'An error occurred.' });
  }

  // Generic fallback
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
