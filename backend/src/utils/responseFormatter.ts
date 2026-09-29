import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T = {} as T, message = 'Success', statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errorCode?: string,
  errors?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode: errorCode || getErrorCodeFromStatus(statusCode),
    ...(errors ? { errors } : {}),
  });
}

function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}
