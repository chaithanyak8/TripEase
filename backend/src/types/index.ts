import { Request } from 'express';
import { Role, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
  employeeId?: number | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: any;
}
