import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, message: string, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * HTTP status code constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (error: any): ApiError => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint failed
        const field = error.meta?.target || 'field';
        return new ApiError(
          HTTP_STATUS.CONFLICT,
          `A record with this ${field} already exists`,
          'DUPLICATE_RECORD',
          { field, constraint: error.meta?.target }
        );
      
      case 'P2025':
        // Record not found
        return new ApiError(
          HTTP_STATUS.NOT_FOUND,
          'Record not found',
          'RECORD_NOT_FOUND'
        );
      
      case 'P2003':
        // Foreign key constraint failed
        return new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Referenced record does not exist',
          'FOREIGN_KEY_CONSTRAINT',
          { field: error.meta?.field_name }
        );
      
      case 'P2014':
        // Required relation violation
        return new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Cannot delete record due to existing references',
          'RELATION_CONSTRAINT'
        );
      
      default:
        return new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Database operation failed',
          'DATABASE_ERROR',
          { prismaCode: error.code }
        );
    }
  }

  if (error instanceof PrismaClientValidationError) {
    return new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid data provided',
      'VALIDATION_ERROR',
      { message: error.message }
    );
  }

  return new ApiError(
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'Unknown database error',
    'DATABASE_ERROR'
  );
};

/**
 * Handle different types of errors and convert to ApiError
 */
const normalizeError = (error: any): ApiError => {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError || 
      error instanceof PrismaClientValidationError) {
    return handlePrismaError(error);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid authentication token',
      'INVALID_TOKEN'
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication token has expired',
      'TOKEN_EXPIRED'
    );
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'File size too large',
      'FILE_TOO_LARGE',
      { maxSize: error.limit }
    );
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Too many files uploaded',
      'TOO_MANY_FILES',
      { maxCount: error.limit }
    );
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Unexpected file field',
      'UNEXPECTED_FILE',
      { field: error.field }
    );
  }

  // Default error
  return new ApiError(
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error.message || 'Internal server error',
    'INTERNAL_ERROR'
  );
};

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const normalizedError = normalizeError(error);
  
  // Log error for debugging (exclude sensitive information)
  const logData = {
    error: normalizedError.message,
    code: normalizedError.code,
    statusCode: normalizedError.statusCode,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
    // Include request ID if available
    requestId: req.headers['x-request-id'] || 'unknown'
  };

  // Log based on severity
  if (normalizedError.statusCode >= 500) {
    console.error('Server Error:', logData, error.stack);
  } else if (normalizedError.statusCode >= 400) {
    console.warn('Client Error:', logData);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: normalizedError.message,
    code: normalizedError.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Include details in development mode or for specific error types
  if (process.env.NODE_ENV === 'development' || 
      normalizedError.statusCode < 500) {
    errorResponse.details = normalizedError.details;
  }

  res.status(normalizedError.statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new ApiError(
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    'ROUTE_NOT_FOUND'
  );

  res.status(error.statusCode).json({
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

/**
 * Async error wrapper
 * Catches async errors and passes them to error middleware
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Success response helper
 */
export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = HTTP_STATUS.OK
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Paginated response helper
 */
export const paginatedResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    },
    timestamp: new Date().toISOString()
  });
};