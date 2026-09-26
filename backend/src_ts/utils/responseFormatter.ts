import type { Response } from 'express';

export const success = (res: Response, statusCode: number = 200, message: string = 'Success', data: Record<string, any> = {}): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

export const error = (res: Response, statusCode: number = 500, errorMessage: string = 'Internal Server Error'): Response => {
  return res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
};

export const paginated = (
  res: Response,
  rows: any[],
  total: number,
  page: number,
  limit: number,
  dataKey: string = 'data'
): Response => {
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

export const created = (res: Response, message: string = 'Resource created successfully', data: Record<string, any> = {}): Response => {
  return success(res, 201, message, data);
};

export const notFound = (res: Response, message: string = 'Resource not found'): Response => {
  return error(res, 404, message);
};

export const badRequest = (res: Response, message: string = 'Bad request'): Response => {
  return error(res, 400, message);
};

export const unauthorized = (res: Response, message: string = 'Unauthorized'): Response => {
  return error(res, 401, message);
};

export const forbidden = (res: Response, message: string = 'Access forbidden'): Response => {
  return error(res, 403, message);
};

export default {
  success,
  error,
  paginated,
  created,
  notFound,
  badRequest,
  unauthorized,
  forbidden
};
