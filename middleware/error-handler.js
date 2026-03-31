import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Request error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        field: err.field || undefined
      }
    });
  }

  // Handle validation errors from express
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    });
  }

  // Default: unknown error
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message
    }
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}
