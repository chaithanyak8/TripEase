import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { hashPassword, comparePassword, generateToken } from '../utils/jwtUtils.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { Role, UserStatus } from '@prisma/client';
import crypto from 'crypto';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, departmentId, designation } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        sendError(res, 'Email is already registered', 409, 'EMAIL_EXISTS');
        return;
      }

      const passwordHash = await hashPassword(password);

      // Auto-generate employeeCode: e.g. EMP + next number
      const count = await prisma.employee.count();
      const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

      // Create Employee & User in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.create({
          data: {
            employeeCode,
            fullName,
            email,
            phone: phone || null,
            designation: designation || 'Associate',
            joiningDate: new Date(),
            basicSalary: 30000.00,
            departmentId: departmentId || null,
            status: 'ACTIVE',
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: Role.EMPLOYEE, // Public registration strictly creates EMPLOYEE
            status: UserStatus.ACTIVE,
            employeeId: emp.id,
          },
        });

        // Initialize default leave balances for current year
        const currentYear = new Date().getFullYear();
        const leaveTypes = await tx.leaveType.findMany({ where: { status: 'ACTIVE' } });
        for (const lt of leaveTypes) {
          await tx.leaveBalance.create({
            data: {
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocatedDays: lt.defaultDays,
              usedDays: 0,
              remainingDays: lt.defaultDays,
            },
          });
        }

        return { user, emp };
      });

      const token = generateToken({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        employeeId: result.emp.id,
      });

      await recordAuditLog({
        userId: result.user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: String(result.user.id),
        details: { email: result.user.email, role: result.user.role },
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
          token,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            employeeId: result.emp.id,
            fullName: result.emp.fullName,
            employeeCode: result.emp.employeeCode,
          },
        },
        'Registration successful',
        201
      );
    } catch (error: any) {
      sendError(res, error.message || 'Registration failed', 500);
    }
  }

  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { employee: true },
      });

      if (!user) {
        sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        return;
      }

      if (user.status !== UserStatus.ACTIVE) {
        sendError(res, 'Account is inactive or suspended', 403, 'ACCOUNT_SUSPENDED');
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        employeeId: user.employeeId,
      });

      await recordAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: String(user.id),
        details: { email: user.email },
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            fullName: user.employee?.fullName || 'Administrator',
            employeeCode: user.employee?.employeeCode || null,
          },
        },
        'Login successful'
      );
    } catch (error: any) {
      sendError(res, error.message || 'Login failed', 500);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      await recordAuditLog({
        userId: req.user.id,
        action: 'LOGOUT',
        entity: 'User',
        entityId: String(req.user.id),
        ipAddress: req.ip,
      });
    }
    sendSuccess(res, {}, 'Logged out successfully');
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          employee: {
            include: {
              department: true,
              salaryStructures: {
                orderBy: { effectiveFrom: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        employee: user.employee || null,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch current user', 500);
    }
  }

  async forgotPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Safe response to not expose email presence
        sendSuccess(res, {}, 'If that email is registered, a password reset link has been sent.');
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // In development, return token so user can test reset directly
      sendSuccess(
        res,
        { resetToken: token },
        'Password reset token generated. Use this token to reset password.'
      );
    } catch (error: any) {
      sendError(res, error.message || 'Failed to initiate password reset', 500);
    }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!record || record.expiresAt < new Date()) {
        sendError(res, 'Invalid or expired reset token', 400, 'INVALID_TOKEN');
        return;
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.delete({
          where: { id: record.id },
        }),
      ]);

      await recordAuditLog({
        userId: record.userId,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: String(record.userId),
        ipAddress: req.ip,
      });

      sendSuccess(res, {}, 'Password has been reset successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to reset password', 500);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { oldPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const isMatch = await comparePassword(oldPassword, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'Current password is incorrect', 400, 'INCORRECT_OLD_PASSWORD');
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await recordAuditLog({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: String(user.id),
        ipAddress: req.ip,
      });

      sendSuccess(res, {}, 'Password changed successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to change password', 500);
    }
  }
}

export const authController = new AuthController();
