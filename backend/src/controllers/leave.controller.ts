import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { enforceEmployeeAccess } from '../middleware/auth.js';
import { Role, LeaveStatus, NotificationType } from '@prisma/client';

export class LeaveController {
  async createLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account required', 403);
        return;
      }

      const { leaveTypeId, startDate, endDate, reason } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Rule: Prevent end date before start date
      if (end < start) {
        sendError(res, 'End date cannot be earlier than start date', 400, 'INVALID_DATE_RANGE');
        return;
      }

      // Calculate number of leave days (inclusive)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Rule: Prevent overlapping approved or pending leave
      const overlapping = await prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              startDate: { lte: end },
              endDate: { gte: start },
            },
          ],
        },
      });

      if (overlapping) {
        sendError(res, 'You already have an active or pending leave during this time period', 409, 'OVERLAPPING_LEAVE');
        return;
      }

      // Check leave type & balance
      const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
      if (!leaveType) {
        sendError(res, 'Invalid leave type', 404);
        return;
      }

      const currentYear = start.getFullYear();
      let balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        // Create initial balance
        balance = await prisma.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId,
            year: currentYear,
            allocatedDays: leaveType.defaultDays,
            usedDays: 0,
            remainingDays: leaveType.defaultDays,
          },
        });
      }

      // Rule: Paid leave cannot exceed available balance
      if (leaveType.isPaid && Number(balance.remainingDays) < numberOfDays) {
        sendError(
          res,
          `Insufficient leave balance. You have ${balance.remainingDays} days remaining, but requested ${numberOfDays} days.`,
          400,
          'INSUFFICIENT_BALANCE'
        );
        return;
      }

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId,
          startDate: start,
          endDate: end,
          numberOfDays,
          reason,
          status: LeaveStatus.PENDING,
        },
        include: { leaveType: true },
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'LEAVE_REQUESTED',
        entity: 'LeaveRequest',
        entityId: String(leaveRequest.id),
        details: { numberOfDays, reason },
        ipAddress: req.ip,
      });

      sendSuccess(res, leaveRequest, 'Leave request submitted successfully', 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to submit leave request', 500);
    }
  }

  async getMyLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account required', 403);
        return;
      }

      const leaves = await prisma.leaveRequest.findMany({
        where: { employeeId },
        include: { leaveType: true, approver: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, leaves, 'Leave history fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch leaves', 500);
    }
  }

  async getAllLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role === Role.EMPLOYEE) {
        return this.getMyLeaves(req, res);
      }

      const { status, departmentId } = req.query;
      const where: any = {};

      if (status) {
        where.status = status as LeaveStatus;
      }

      if (departmentId) {
        where.employee = { departmentId: Number(departmentId) };
      }

      const leaves = await prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: { id: true, fullName: true, employeeCode: true, department: true },
          },
          leaveType: true,
          approver: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, leaves, 'Leave requests fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch leaves', 500);
    }
  }

  async getLeaveById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { leaveType: true, employee: true },
      });

      if (!leave) {
        sendError(res, 'Leave request not found', 404);
        return;
      }

      if (!enforceEmployeeAccess(leave.employeeId, req, res)) return;

      sendSuccess(res, leave, 'Leave details fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch leave', 500);
    }
  }

  async approveLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { leaveType: true, employee: { include: { user: true } } },
      });

      if (!leave) {
        sendError(res, 'Leave request not found', 404);
        return;
      }

      if (leave.status !== LeaveStatus.PENDING) {
        sendError(res, `Cannot approve leave with status ${leave.status}`, 400);
        return;
      }

      const year = leave.startDate.getFullYear();

      // Transaction to update request, leave balance, attendance records, and notification
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.leaveRequest.update({
          where: { id },
          data: {
            status: LeaveStatus.APPROVED,
            approvedBy: req.user?.id,
            approvedAt: new Date(),
          },
        });

        // Update leave balance usedDays & remainingDays
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: leave.employeeId,
              leaveTypeId: leave.leaveTypeId,
              year,
            },
          },
        });

        if (balance) {
          const newUsed = Number(balance.usedDays) + Number(leave.numberOfDays);
          const newRemaining = Math.max(0, Number(balance.allocatedDays) - newUsed);
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: newUsed,
              remainingDays: newRemaining,
            },
          });
        }

        // Create notification for employee
        if (leave.employee.userId) {
          await tx.notification.create({
            data: {
              userId: leave.employee.userId,
              title: 'Leave Approved',
              message: `Your ${leave.leaveType.name} leave request for ${leave.numberOfDays} days has been approved.`,
              type: NotificationType.LEAVE,
            },
          });
        }

        return updated;
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'LEAVE_APPROVED',
        entity: 'LeaveRequest',
        entityId: String(id),
        details: { employeeId: leave.employeeId, days: leave.numberOfDays },
        ipAddress: req.ip,
      });

      sendSuccess(res, result, 'Leave request approved successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to approve leave', 500);
    }
  }

  async rejectLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { rejectionReason } = req.body;

      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!leave) {
        sendError(res, 'Leave request not found', 404);
        return;
      }

      if (leave.status !== LeaveStatus.PENDING) {
        sendError(res, `Cannot reject leave with status ${leave.status}`, 400);
        return;
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveStatus.REJECTED,
          approvedBy: req.user?.id,
          rejectionReason: rejectionReason || 'Rejected by management',
        },
      });

      if (leave.employee.userId) {
        await prisma.notification.create({
          data: {
            userId: leave.employee.userId,
            title: 'Leave Rejected',
            message: `Your leave request was rejected: ${rejectionReason || 'No reason provided'}`,
            type: NotificationType.LEAVE,
          },
        });
      }

      await recordAuditLog({
        userId: req.user?.id,
        action: 'LEAVE_REJECTED',
        entity: 'LeaveRequest',
        entityId: String(id),
        details: { rejectionReason },
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Leave request rejected');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to reject leave', 500);
    }
  }

  async cancelLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const leave = await prisma.leaveRequest.findUnique({ where: { id } });

      if (!leave) {
        sendError(res, 'Leave request not found', 404);
        return;
      }

      if (!enforceEmployeeAccess(leave.employeeId, req, res)) return;

      if (leave.status !== LeaveStatus.PENDING) {
        sendError(res, 'Only pending leave requests can be cancelled', 400);
        return;
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: { status: LeaveStatus.CANCELLED },
      });

      sendSuccess(res, updated, 'Leave request cancelled successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to cancel leave', 500);
    }
  }

  async getLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let targetEmployeeId = req.user?.employeeId;

      if (req.query.employeeId && (req.user?.role === Role.ADMIN || req.user?.role === Role.HR_MANAGER)) {
        targetEmployeeId = Number(req.query.employeeId);
      }

      if (!targetEmployeeId) {
        sendError(res, 'Employee ID required', 400);
        return;
      }

      const year = Number(req.query.year) || new Date().getFullYear();

      const balances = await prisma.leaveBalance.findMany({
        where: { employeeId: targetEmployeeId, year },
        include: { leaveType: true },
      });

      sendSuccess(res, balances, 'Leave balances fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch leave balances', 500);
    }
  }
}

export const leaveController = new LeaveController();
