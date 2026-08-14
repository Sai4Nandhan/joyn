import { env } from '../config/env.js';

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let isOperational = err.isOperational;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for ${err.path}`;
    isOperational = true;
  }

  if (!isOperational) {
    console.error('[unhandled error]', err);
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errorCode ? { errorCode: err.errorCode } : {}),
    ...(err.details ? { details: err.details } : {}),
    ...(env.nodeEnv === 'development' && !isOperational ? { stack: err.stack } : {}),
  });
}
