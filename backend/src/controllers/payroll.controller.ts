import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { payrollService } from '../services/payroll.service.js';
import { salaryService } from '../services/salary.service.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/audit.service.js';
import { Role } from '@prisma/client';

export class PayrollController {
  async calculatePayroll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { month, year, employeeIds } = req.body;

      const payrolls = await payrollService.calculatePayroll(month, year, employeeIds);

      await recordAuditLog({
        userId: req.user?.id,
        action: 'PAYROLL_CALCULATED',
        entity: 'Payroll',
        details: { month, year, count: payrolls.length },
        ipAddress: req.ip,
      });

      sendSuccess(res, payrolls, `Payroll calculated for ${month}/${year}`);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to calculate payroll', 500);
    }
  }

  async processPayroll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== Role.ADMIN && req.user.role !== Role.HR_MANAGER)) {
        sendError(res, 'Only Admin or HR Manager can process payroll', 403, 'FORBIDDEN');
        return;
      }

      const { month, year, employeeIds } = req.body;

      const processed = await payrollService.processPayroll(
        month,
        year,
        req.user.id,
        employeeIds
      );

      await recordAuditLog({
        userId: req.user.id,
        action: 'PAYROLL_PROCESSED',
        entity: 'Payroll',
        details: { month, year, count: processed.length },
        ipAddress: req.ip,
      });

      sendSuccess(res, processed, `Payroll processed successfully for ${month}/${year}`);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to process payroll', 500);
    }
  }

  async getPayrollForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();

      const forecast = await payrollService.getPayrollForecast(month, year);
      sendSuccess(res, forecast, 'Payroll forecast calculated');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to generate payroll forecast', 500);
    }
  }

  async getAttendanceToPayImpact(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();

      let targetEmployeeId: number | undefined = undefined;
      if (req.user?.role === Role.EMPLOYEE) {
        targetEmployeeId = req.user.employeeId || undefined;
      } else if (req.query.employeeId) {
        targetEmployeeId = Number(req.query.employeeId);
      }

      const impact = await salaryService.getAttendanceToPayImpact(month, year, targetEmployeeId);
      sendSuccess(res, impact, 'Attendance-to-pay impact analysis');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch impact analysis', 500);
    }
  }

  async getPayrolls(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { month, year, departmentId, status, employeeId } = req.query;

      const where: any = {};

      if (req.user?.role === Role.EMPLOYEE) {
        where.employeeId = req.user.employeeId;
      } else if (employeeId) {
        where.employeeId = Number(employeeId);
      }

      if (month) where.month = Number(month);
      if (year) where.year = Number(year);
      if (status) where.status = status;
      if (departmentId) where.employee = { departmentId: Number(departmentId) };

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              designation: true,
              department: true,
            },
          },
          payslip: true,
          processor: { select: { id: true, email: true } },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }],
      });

      sendSuccess(res, payrolls, 'Payroll records fetched');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payrolls', 500);
    }
  }

  async getPayrollById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const record = await prisma.payroll.findUnique({
        where: { id },
        include: {
          employee: { include: { department: true } },
          payslip: true,
          processor: { select: { id: true, email: true } },
        },
      });

      if (!record) {
        sendError(res, 'Payroll record not found', 404);
        return;
      }

      if (req.user?.role === Role.EMPLOYEE && req.user.employeeId !== record.employeeId) {
        sendError(res, 'Access denied', 403);
        return;
      }

      sendSuccess(res, record, 'Payroll record details');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payroll record', 500);
    }
  }
}

export const payrollController = new PayrollController();
