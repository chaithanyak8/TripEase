import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseFormatter.js';
import { config } from '../config/index.js';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (config.nodeEnv === 'production') {
    // Sanitized in production
    sendError(res, statusCode === 500 ? 'Internal server error' : message, statusCode);
  } else {
    // Dev details
    sendError(res, message, statusCode, 'SERVER_ERROR', {
      stack: err.stack,
      details: err.meta || err.errors || null,
    });
  }
};
