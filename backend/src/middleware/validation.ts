import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/responseFormatter.js';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', error.errors);
        return;
      }
      sendError(res, 'Invalid request data', 400);
    }
  };
};
