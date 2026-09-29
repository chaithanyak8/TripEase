import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwtUtils.js';
import { prisma } from '../prisma/client.js';
import { sendError } from '../utils/responseFormatter.js';
import { Role, UserStatus } from '@prisma/client';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { employee: true },
    });

    if (!user) {
      sendError(res, 'User not found', 401, 'UNAUTHORIZED');
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      sendError(res, 'Account is inactive or suspended', 403, 'ACCOUNT_SUSPENDED');
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId || user.employee?.id || null,
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, 'TOKEN_EXPIRED');
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
};

export const enforceEmployeeAccess = (
  targetEmployeeId: number,
  req: AuthenticatedRequest,
  res: Response
): boolean => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    return false;
  }

  // Admin and HR can access all
  if (req.user.role === Role.ADMIN || req.user.role === Role.HR_MANAGER) {
    return true;
  }

  // Employee can only access their own
  if (req.user.employeeId !== targetEmployeeId) {
    sendError(res, 'Access denied: You cannot view or modify another employee records', 403, 'EMPLOYEE_ISOLATION_VIOLATION');
    return false;
  }

  return true;
};
