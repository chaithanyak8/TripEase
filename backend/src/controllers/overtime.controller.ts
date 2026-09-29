import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { Role, OvertimeStatus, NotificationType } from '@prisma/client';

export class OvertimeController {
  async getMyOvertime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account required', 403);
        return;
      }

      const overtimes = await prisma.overtime.findMany({
        where: { employeeId },
        include: { approver: { select: { id: true, email: true } } },
        orderBy: { date: 'desc' },
      });

      sendSuccess(res, overtimes, 'My overtime records fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch overtime', 500);
    }
  }

  async getAllOvertime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role === Role.EMPLOYEE) {
        return this.getMyOvertime(req, res);
      }

      const { status, departmentId } = req.query;
      const where: any = {};

      if (status) {
        where.status = status as OvertimeStatus;
      }

      if (departmentId) {
        where.employee = { departmentId: Number(departmentId) };
      }

      const overtimes = await prisma.overtime.findMany({
        where,
        include: {
          employee: {
            select: { id: true, fullName: true, employeeCode: true, department: true },
          },
          approver: { select: { id: true, email: true } },
        },
        orderBy: { date: 'desc' },
      });

      sendSuccess(res, overtimes, 'All overtime records fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch overtime', 500);
    }
  }

  async createOvertime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account required', 403);
        return;
      }

      const { attendanceId, date, minutes, ratePerHour: customRate } = req.body;

      // Determine ratePerHour from SalaryStructure or CompanySettings
      let ratePerHour = customRate;
      if (!ratePerHour) {
        const emp = await prisma.employee.findUnique({
          where: { id: employeeId },
          include: {
            salaryStructures: {
              orderBy: { effectiveFrom: 'desc' },
              take: 1,
            },
          },
        });

        const empOtRate = emp?.salaryStructures[0]?.overtimeRate;
        if (empOtRate && Number(empOtRate) > 0) {
          ratePerHour = Number(empOtRate);
        } else {
          const settings = await prisma.companySettings.findFirst();
          ratePerHour = Number(settings?.defaultOvertimeRate || 200);
        }
      }

      const hours = minutes / 60;
      const amount = Number((hours * ratePerHour).toFixed(2));

      const overtime = await prisma.overtime.create({
        data: {
          employeeId,
          attendanceId: attendanceId || null,
          date: new Date(date),
          minutes,
          ratePerHour,
          amount,
          status: OvertimeStatus.PENDING,
        },
      });

      await recordAuditLog({
        userId: req.user?.id,
        action: 'OVERTIME_LOGGED',
        entity: 'Overtime',
        entityId: String(overtime.id),
        details: { minutes, amount, ratePerHour },
        ipAddress: req.ip,
      });

      sendSuccess(res, overtime, 'Overtime record created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create overtime', 500);
    }
  }

  async approveOvertime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const overtime = await prisma.overtime.findUnique({
        where: { id },
        include: { employee: { include: { user: true } } },
      });

      if (!overtime) {
        sendError(res, 'Overtime record not found', 404);
        return;
      }

      if (overtime.status !== OvertimeStatus.PENDING) {
        sendError(res, `Cannot approve overtime with status ${overtime.status}`, 400);
        return;
      }

      const updated = await prisma.overtime.update({
        where: { id },
        data: {
          status: OvertimeStatus.APPROVED,
          approvedBy: req.user?.id,
          approvedAt: new Date(),
        },
      });

      if (overtime.employee.userId) {
        await prisma.notification.create({
          data: {
            userId: overtime.employee.userId,
            title: 'Overtime Approved',
            message: `Your overtime of ${overtime.minutes} mins (₹${Number(overtime.amount).toFixed(2)}) has been approved.`,
            type: NotificationType.OVERTIME,
          },
        });
      }

      await recordAuditLog({
        userId: req.user?.id,
        action: 'OVERTIME_APPROVED',
        entity: 'Overtime',
        entityId: String(id),
        details: { amount: overtime.amount },
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Overtime approved successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to approve overtime', 500);
    }
  }

  async rejectOvertime(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const overtime = await prisma.overtime.findUnique({
        where: { id },
        include: { employee: { include: { user: true } } },
      });

      if (!overtime) {
        sendError(res, 'Overtime record not found', 404);
        return;
      }

      if (overtime.status !== OvertimeStatus.PENDING) {
        sendError(res, `Cannot reject overtime with status ${overtime.status}`, 400);
        return;
      }

      const updated = await prisma.overtime.update({
        where: { id },
        data: {
          status: OvertimeStatus.REJECTED,
          approvedBy: req.user?.id,
        },
      });

      if (overtime.employee.userId) {
        await prisma.notification.create({
          data: {
            userId: overtime.employee.userId,
            title: 'Overtime Rejected',
            message: `Your overtime request for ${overtime.minutes} mins was rejected.`,
            type: NotificationType.OVERTIME,
          },
        });
      }

      await recordAuditLog({
        userId: req.user?.id,
        action: 'OVERTIME_REJECTED',
        entity: 'Overtime',
        entityId: String(id),
        ipAddress: req.ip,
      });

      sendSuccess(res, updated, 'Overtime rejected');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to reject overtime', 500);
    }
  }
}

export const overtimeController = new OvertimeController();
