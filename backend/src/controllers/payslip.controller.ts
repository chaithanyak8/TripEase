import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../prisma/client.js';
import { generatePayslipPdf } from '../services/pdf.service.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { enforceEmployeeAccess } from '../middleware/auth.js';
import { Role } from '@prisma/client';

export class PayslipController {
  async getMyPayslips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        sendError(res, 'Employee account required', 403);
        return;
      }

      const payslips = await prisma.payslip.findMany({
        where: { employeeId },
        include: { payroll: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      sendSuccess(res, payslips, 'My payslips fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payslips', 500);
    }
  }

  async getAllPayslips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role === Role.EMPLOYEE) {
        return this.getMyPayslips(req, res);
      }

      const { month, year, departmentId, employeeId } = req.query;
      const where: any = {};

      if (employeeId) where.employeeId = Number(employeeId);
      if (month) where.month = Number(month);
      if (year) where.year = Number(year);
      if (departmentId) where.employee = { departmentId: Number(departmentId) };

      const payslips = await prisma.payslip.findMany({
        where,
        include: {
          payroll: true,
          employee: {
            select: { id: true, fullName: true, employeeCode: true, department: true },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      sendSuccess(res, payslips, 'Payslips fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payslips', 500);
    }
  }

  async getPayslipById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const payslip = await prisma.payslip.findUnique({
        where: { id },
        include: {
          payroll: true,
          employee: { include: { department: true } },
        },
      });

      if (!payslip) {
        sendError(res, 'Payslip not found', 404);
        return;
      }

      if (!enforceEmployeeAccess(payslip.employeeId, req, res)) return;

      sendSuccess(res, payslip, 'Payslip fetched successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch payslip', 500);
    }
  }

  async downloadPayslipPdf(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const payslip = await prisma.payslip.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!payslip) {
        sendError(res, 'Payslip not found', 404);
        return;
      }

      if (!enforceEmployeeAccess(payslip.employeeId, req, res)) return;

      const pdfBuffer = await generatePayslipPdf(id);

      const filename = `Payslip-${payslip.payslipNumber}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to generate PDF payslip', 500);
    }
  }
}

export const payslipController = new PayslipController();
