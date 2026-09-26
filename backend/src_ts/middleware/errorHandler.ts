import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): Response | void => {
  console.error('[Error Handler]', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size limit exceeded. Maximum file size is 5 MB.' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field. Please check your upload field name.' });
  }

  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry. A record with this value already exists.' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist. Please check your input values.' });
  }

  if (err.code === '23514') {
    return res.status(400).json({ error: `Constraint violated: ${err.message}` });
  }

  if (err.code === '23502') {
    return res.status(400).json({ error: `Required field missing: ${err.column || 'unknown column'}` });
  }

  if (err.message && err.message.includes('ECONNREFUSED')) {
    return res.status(500).json({ error: 'Database connection failed. Please ensure PostgreSQL is running.' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Authentication token has expired. Please log in again.' });
  }

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message || 'An error occurred.' });
  }

  return res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default errorHandler;
